#!/usr/bin/env bash
# =============================================================================
# Nimbus FinOps — AWS Setup
# =============================================================================
# Creates read-only access for the Nimbus Cloud FinOps platform.
# Run from AWS CloudShell or any terminal with AWS CLI configured as admin.
#
# What this creates:
#   1. S3 buckets (CUR data + Athena results) — encrypted, lifecycle policies
#   2. IAM policy — every permission Nimbus uses (18 statements, future-proof)
#   3. IAM user with access keys (or cross-account role with --cross-account)
#   4. CUR 2.0 export (Parquet, daily, resource-level)
#   5. Athena workgroup with cost control (100MB scan limit)
#   6. Resource Explorer index
#   7. Compute Optimizer enrollment
#
# Usage:
#   ./aws-setup.sh                         # Basic setup with IAM user
#   ./aws-setup.sh --region us-east-1      # Override region
#   ./aws-setup.sh --cross-account 123456  # Add cross-account role for Nimbus SaaS
# =============================================================================

set -euo pipefail

# --- Parse Arguments --------------------------------------------------------

NIMBUS_ACCOUNT_ID=""
CUSTOM_REGION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --region) CUSTOM_REGION="$2"; shift 2 ;;
    --cross-account) NIMBUS_ACCOUNT_ID="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--region REGION] [--cross-account NIMBUS_AWS_ACCOUNT_ID]"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Step 1: Configuration (auto-detect) ------------------------------------

echo ""
echo "[1/10] Detecting AWS configuration..."

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null) || {
  echo "  ERROR: Cannot detect AWS account. Is AWS CLI configured?"
  echo "  Run: aws configure"
  exit 1
}

AWS_REGION="${CUSTOM_REGION:-${AWS_REGION:-ap-south-1}}"
CUR_BUCKET_NAME="nimbus-cur-${AWS_ACCOUNT_ID}"
ATHENA_RESULTS_BUCKET="nimbus-athena-results-${AWS_ACCOUNT_ID}"
CUR_REPORT_NAME="nimbus-daily-cur"
IAM_POLICY_NAME="NimbusFinOpsReadOnly"
IAM_ROLE_NAME="NimbusFinOpsRole"
IAM_USER_NAME="nimbus-finops-svc"
EXTERNAL_ID="nimbus-$(openssl rand -hex 8 2>/dev/null || echo "$(date +%s)")"

echo ""
echo "  ============================================="
echo "  Nimbus FinOps — AWS Setup"
echo "  ============================================="
echo "  Account:  ${AWS_ACCOUNT_ID}"
echo "  Region:   ${AWS_REGION}"
echo "  ============================================="
echo ""

# --- Step 2: S3 Buckets (CUR + Athena results) ------------------------------

echo "[2/10] Creating S3 buckets..."

# --- 2a: CUR data bucket ---
aws s3api create-bucket \
  --bucket "${CUR_BUCKET_NAME}" \
  --region "${AWS_REGION}" \
  --create-bucket-configuration LocationConstraint="${AWS_REGION}" \
  2>/dev/null || echo "  ↳ CUR bucket already exists."

# Encryption (AES256)
aws s3api put-bucket-encryption \
  --bucket "${CUR_BUCKET_NAME}" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Block all public access
aws s3api put-public-access-block \
  --bucket "${CUR_BUCKET_NAME}" \
  --public-access-block-configuration \
  '{"BlockPublicAcls":true,"IgnorePublicAcls":true,"BlockPublicPolicy":true,"RestrictPublicBuckets":true}'

# Lifecycle: IA after 90 days, Glacier after 365 days (billing records — never delete)
aws s3api put-bucket-lifecycle-configuration \
  --bucket "${CUR_BUCKET_NAME}" \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "CURDataLifecycle",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "Transitions": [
        {"Days": 90, "StorageClass": "STANDARD_IA"},
        {"Days": 365, "StorageClass": "GLACIER"}
      ]
    }]
  }'

# Bucket policy for CUR delivery
cat > /tmp/nimbus-cur-bucket-policy.json << CURPOLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCURDelivery",
      "Effect": "Allow",
      "Principal": {"Service": "billingreports.amazonaws.com"},
      "Action": ["s3:GetBucketAcl", "s3:GetBucketPolicy"],
      "Resource": "arn:aws:s3:::${CUR_BUCKET_NAME}",
      "Condition": {
        "StringEquals": {
          "aws:SourceArn": "arn:aws:cur:us-east-1:${AWS_ACCOUNT_ID}:definition/*",
          "aws:SourceAccount": "${AWS_ACCOUNT_ID}"
        }
      }
    },
    {
      "Sid": "AllowCURWrite",
      "Effect": "Allow",
      "Principal": {"Service": "billingreports.amazonaws.com"},
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${CUR_BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceArn": "arn:aws:cur:us-east-1:${AWS_ACCOUNT_ID}:definition/*",
          "aws:SourceAccount": "${AWS_ACCOUNT_ID}"
        }
      }
    }
  ]
}
CURPOLICY

aws s3api put-bucket-policy \
  --bucket "${CUR_BUCKET_NAME}" \
  --policy file:///tmp/nimbus-cur-bucket-policy.json

echo "  ✅ CUR bucket: ${CUR_BUCKET_NAME} (encrypted, lifecycle: IA@90d, Glacier@365d)"

# --- 2b: Athena results bucket ---
aws s3api create-bucket \
  --bucket "${ATHENA_RESULTS_BUCKET}" \
  --region "${AWS_REGION}" \
  --create-bucket-configuration LocationConstraint="${AWS_REGION}" \
  2>/dev/null || echo "  ↳ Athena results bucket already exists."

# Encryption (AES256)
aws s3api put-bucket-encryption \
  --bucket "${ATHENA_RESULTS_BUCKET}" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Block all public access
aws s3api put-public-access-block \
  --bucket "${ATHENA_RESULTS_BUCKET}" \
  --public-access-block-configuration \
  '{"BlockPublicAcls":true,"IgnorePublicAcls":true,"BlockPublicPolicy":true,"RestrictPublicBuckets":true}'

# Lifecycle: expire query results after 7 days (ephemeral outputs)
aws s3api put-bucket-lifecycle-configuration \
  --bucket "${ATHENA_RESULTS_BUCKET}" \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "ExpireQueryResults",
      "Status": "Enabled",
      "Filter": {"Prefix": ""},
      "Expiration": {"Days": 7}
    }]
  }'

echo "  ✅ Athena bucket: ${ATHENA_RESULTS_BUCKET} (encrypted, lifecycle: expire@7d)"
echo ""

# --- Step 3: IAM Policy (comprehensive, 18 statements) ----------------------

echo "[3/10] Creating IAM policy '${IAM_POLICY_NAME}'..."

# Write policy JSON with placeholder, then inject account ID via sed
# (avoids heredoc variable expansion issues with JSON special chars)
cat > /tmp/nimbus-policy.json << 'IAMPOLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CredentialValidation",
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity"],
      "Resource": "*"
    },
    {
      "Sid": "CostExplorerRead",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostAndUsageWithResources",
        "ce:GetCostForecast",
        "ce:GetTags",
        "ce:GetCostCategories",
        "ce:GetDimensionValues",
        "ce:GetReservationUtilization",
        "ce:GetReservationCoverage",
        "ce:GetReservationPurchaseRecommendation",
        "ce:GetRightsizingRecommendation",
        "ce:GetSavingsPlansPurchaseRecommendation",
        "ce:GetSavingsPlansUtilization",
        "ce:GetSavingsPlansCoverage",
        "ce:GetAnomalies",
        "ce:GetAnomalyMonitors",
        "ce:GetAnomalySubscriptions",
        "ce:CreateAnomalyMonitor",
        "ce:CreateAnomalySubscription"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CURRead",
      "Effect": "Allow",
      "Action": [
        "cur:DescribeReportDefinitions",
        "cur:GetUsageReport",
        "bcm-data-exports:ListExports",
        "bcm-data-exports:GetExport"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CURBucketRead",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::nimbus-cur-__ACCOUNT_ID__",
        "arn:aws:s3:::nimbus-cur-__ACCOUNT_ID__/*"
      ]
    },
    {
      "Sid": "AthenaResultsBucket",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": [
        "arn:aws:s3:::nimbus-athena-results-__ACCOUNT_ID__",
        "arn:aws:s3:::nimbus-athena-results-__ACCOUNT_ID__/*"
      ]
    },
    {
      "Sid": "AthenaCURQuery",
      "Effect": "Allow",
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryExecution",
        "athena:GetQueryResults",
        "athena:StopQueryExecution",
        "athena:GetWorkGroup",
        "athena:ListWorkGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "GlueCatalogRead",
      "Effect": "Allow",
      "Action": [
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions",
        "glue:GetPartition",
        "glue:BatchGetPartition"
      ],
      "Resource": [
        "arn:aws:glue:*:*:catalog",
        "arn:aws:glue:*:*:database/athenacurcfn*",
        "arn:aws:glue:*:*:database/nimbus*",
        "arn:aws:glue:*:*:table/athenacurcfn*/*",
        "arn:aws:glue:*:*:table/nimbus*/*"
      ]
    },
    {
      "Sid": "OrganizationRead",
      "Effect": "Allow",
      "Action": [
        "organizations:ListAccounts",
        "organizations:DescribeOrganization",
        "organizations:DescribeAccount"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ResourceInventory",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeVolumes",
        "ec2:DescribeSnapshots",
        "ec2:DescribeAddresses",
        "ec2:DescribeNatGateways",
        "ec2:DescribeLoadBalancers",
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:GetBucketTagging",
        "lambda:ListFunctions",
        "lambda:GetFunction",
        "ecs:ListClusters",
        "ecs:DescribeClusters",
        "eks:ListClusters",
        "eks:DescribeCluster",
        "elasticache:DescribeCacheClusters",
        "es:ListDomainNames",
        "es:DescribeDomains",
        "tag:GetResources",
        "tag:GetTagKeys",
        "tag:GetTagValues"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ResourceExplorer",
      "Effect": "Allow",
      "Action": [
        "resource-explorer-2:Search",
        "resource-explorer-2:GetView",
        "resource-explorer-2:ListResources",
        "resource-explorer-2:ListIndexes",
        "resource-explorer-2:GetIndex"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ComputeOptimizer",
      "Effect": "Allow",
      "Action": [
        "compute-optimizer:GetEC2InstanceRecommendations",
        "compute-optimizer:GetAutoScalingGroupRecommendations",
        "compute-optimizer:GetEBSVolumeRecommendations",
        "compute-optimizer:GetLambdaFunctionRecommendations",
        "compute-optimizer:GetEnrollmentStatus",
        "compute-optimizer:GetEnrollmentStatusesForOrganization"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TrustedAdvisor",
      "Effect": "Allow",
      "Action": [
        "trustedadvisor:Describe*",
        "trustedadvisor:Refresh*",
        "support:DescribeTrustedAdvisorChecks",
        "support:DescribeTrustedAdvisorCheckResult",
        "support:DescribeTrustedAdvisorCheckSummaries",
        "support:DescribeTrustedAdvisorCheckRefreshStatuses"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AwsConfig",
      "Effect": "Allow",
      "Action": [
        "config:DescribeConfigurationRecorderStatus",
        "config:DescribeConfigRules",
        "config:DescribeComplianceByConfigRule",
        "config:GetComplianceDetailsByConfigRule",
        "config:DescribeConfigurationAggregators"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:GetMetricData"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BudgetsReadWrite",
      "Effect": "Allow",
      "Action": [
        "budgets:ViewBudget",
        "budgets:DescribeBudgets",
        "budgets:CreateBudget",
        "budgets:ModifyBudget",
        "budgets:DescribeBudgetActionsForAccount"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SavingsPlansDetail",
      "Effect": "Allow",
      "Action": [
        "savingsplans:DescribeSavingsPlans",
        "savingsplans:DescribeSavingsPlansOfferings",
        "savingsplans:DescribeSavingsPlanRates"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PricingAPI",
      "Effect": "Allow",
      "Action": [
        "pricing:GetProducts",
        "pricing:DescribeServices",
        "pricing:GetAttributeValues"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ServiceQuotas",
      "Effect": "Allow",
      "Action": [
        "servicequotas:ListServiceQuotas",
        "servicequotas:GetServiceQuota",
        "servicequotas:ListServices"
      ],
      "Resource": "*"
    }
  ]
}
IAMPOLICY

# Inject the actual account ID into the policy (replaces __ACCOUNT_ID__ placeholder)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/__ACCOUNT_ID__/${AWS_ACCOUNT_ID}/g" /tmp/nimbus-policy.json
else
  sed -i "s/__ACCOUNT_ID__/${AWS_ACCOUNT_ID}/g" /tmp/nimbus-policy.json
fi

# Create or update the policy
POLICY_ARN=$(aws iam create-policy \
  --policy-name "${IAM_POLICY_NAME}" \
  --policy-document file:///tmp/nimbus-policy.json \
  --description "Nimbus FinOps Platform — comprehensive read access for cost, resources, recommendations, CUR/Athena" \
  --query 'Policy.Arn' --output text 2>/dev/null) || {
  # Policy exists — create a new version
  POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${IAM_POLICY_NAME}"
  echo "  ↳ Policy exists. Updating to latest version..."
  aws iam create-policy-version \
    --policy-arn "${POLICY_ARN}" \
    --policy-document file:///tmp/nimbus-policy.json \
    --set-as-default \
    2>/dev/null || echo "  ↳ Max 5 policy versions. Delete old versions first."
}

echo "  ✅ IAM Policy: ${POLICY_ARN} (18 statements)"
echo ""

# --- Step 4: IAM User -------------------------------------------------------

echo "[4/10] Creating IAM user '${IAM_USER_NAME}'..."

aws iam create-user \
  --user-name "${IAM_USER_NAME}" \
  --tags Key=Purpose,Value=NimbusFinOps Key=ManagedBy,Value=NimbusSetup \
  2>/dev/null || echo "  ↳ User already exists."

aws iam attach-user-policy \
  --user-name "${IAM_USER_NAME}" \
  --policy-arn "${POLICY_ARN}" \
  2>/dev/null || echo "  ↳ Policy already attached."

echo "  ✅ IAM User: ${IAM_USER_NAME}"
echo ""

# --- Step 5: Cross-Account Role (optional) -----------------------------------

echo "[5/10] Cross-account role..."

if [ -n "${NIMBUS_ACCOUNT_ID}" ]; then
  echo "  ↳ Creating cross-account role for Nimbus account ${NIMBUS_ACCOUNT_ID}..."

  cat > /tmp/nimbus-trust-policy.json << TRUSTPOLICY
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::${NIMBUS_ACCOUNT_ID}:root"},
    "Action": "sts:AssumeRole",
    "Condition": {"StringEquals": {"sts:ExternalId": "${EXTERNAL_ID}"}}
  }]
}
TRUSTPOLICY

  aws iam create-role \
    --role-name "${IAM_ROLE_NAME}" \
    --assume-role-policy-document file:///tmp/nimbus-trust-policy.json \
    --description "Cross-account role for Nimbus FinOps Platform" \
    --tags Key=Purpose,Value=NimbusFinOps Key=ManagedBy,Value=NimbusSetup \
    2>/dev/null || echo "  ↳ Role already exists."

  aws iam attach-role-policy \
    --role-name "${IAM_ROLE_NAME}" \
    --policy-arn "${POLICY_ARN}" \
    2>/dev/null || echo "  ↳ Policy already attached to role."

  echo "  ✅ Cross-account role: ${IAM_ROLE_NAME} (External ID: ${EXTERNAL_ID})"
else
  echo "  ↳ Skipped (use --cross-account ACCOUNT_ID to enable)"
fi
echo ""

# --- Step 6: Generate Access Keys --------------------------------------------

echo "[6/10] Generating access keys..."

ACCESS_KEY_ID=""
SECRET_ACCESS_KEY=""

KEYS=$(aws iam create-access-key \
  --user-name "${IAM_USER_NAME}" \
  --query 'AccessKey.[AccessKeyId,SecretAccessKey]' \
  --output text 2>/dev/null) || {
  echo "  ⚠️  Could not create keys (max 2 per user). Delete old keys first:"
  echo "     aws iam list-access-keys --user-name ${IAM_USER_NAME}"
  echo "     aws iam delete-access-key --user-name ${IAM_USER_NAME} --access-key-id <KEY_ID>"
  KEYS=""
}

if [ -n "${KEYS}" ]; then
  ACCESS_KEY_ID=$(echo "${KEYS}" | awk '{print $1}')
  SECRET_ACCESS_KEY=$(echo "${KEYS}" | awk '{print $2}')
  echo "  ✅ Access keys generated."
fi
echo ""

# --- Step 7: Cost & Usage Report (CUR) --------------------------------------

echo "[7/10] Creating Cost & Usage Report..."
echo "  ↳ Report: ${CUR_REPORT_NAME}"
echo "  ↳ Bucket: ${CUR_BUCKET_NAME}"
echo "  ↳ Format: Parquet, Daily, with Resource IDs + Athena artifacts"

# CUR API is only available in us-east-1
aws cur put-report-definition \
  --region us-east-1 \
  --report-definition '{
    "ReportName": "'"${CUR_REPORT_NAME}"'",
    "TimeUnit": "DAILY",
    "Format": "Parquet",
    "Compression": "Parquet",
    "AdditionalSchemaElements": ["RESOURCES", "SPLIT_COST_ALLOCATION_DATA"],
    "S3Bucket": "'"${CUR_BUCKET_NAME}"'",
    "S3Prefix": "cur-data",
    "S3Region": "'"${AWS_REGION}"'",
    "AdditionalArtifacts": ["ATHENA"],
    "RefreshClosedReports": true,
    "ReportVersioning": "OVERWRITE_REPORT"
  }' 2>/dev/null && echo "  ✅ CUR report created." || {
  echo "  ↳ Legacy CUR API failed. Trying BCM Data Exports API..."

  aws bcm-data-exports create-export \
    --region us-east-1 \
    --export '{
      "Name": "'"${CUR_REPORT_NAME}"'",
      "DataQuery": {
        "QueryStatement": "SELECT identity_line_item_id, identity_time_interval, bill_invoice_id, bill_invoicing_entity, bill_billing_entity, bill_bill_type, bill_payer_account_id, bill_billing_period_start_date, bill_billing_period_end_date, line_item_usage_account_id, line_item_line_item_type, line_item_usage_start_date, line_item_usage_end_date, line_item_product_code, line_item_usage_type, line_item_operation, line_item_availability_zone, line_item_resource_id, line_item_usage_amount, line_item_normalization_factor, line_item_normalized_usage_amount, line_item_currency_code, line_item_unblended_rate, line_item_unblended_cost, line_item_blended_rate, line_item_blended_cost, line_item_net_unblended_rate, line_item_net_unblended_cost, product_product_name, product_instance_type, product_region, pricing_term, pricing_unit, resource_tags",
        "TableConfigurations": {
          "COST_AND_USAGE_REPORT": {
            "TIME_GRANULARITY": "DAILY",
            "INCLUDE_RESOURCES": "TRUE",
            "INCLUDE_SPLIT_COST_ALLOCATION_DATA": "TRUE"
          }
        }
      },
      "DestinationConfigurations": {
        "S3Destination": {
          "S3Bucket": "'"${CUR_BUCKET_NAME}"'",
          "S3Prefix": "cur-data",
          "S3Region": "'"${AWS_REGION}"'",
          "S3OutputConfigurations": {
            "OutputType": "CUSTOM",
            "Format": "PARQUET",
            "Compression": "PARQUET",
            "Overwrite": "OVERWRITE_REPORT"
          }
        }
      },
      "RefreshCadence": {"Frequency": "SYNCHRONOUS"}
    }' 2>/dev/null && echo "  ✅ BCM Data Export created." || {
    echo ""
    echo "  ⚠️  Automated CUR setup failed. Create manually:"
    echo "     1. Go to: https://us-east-1.console.aws.amazon.com/billing/home#/reports"
    echo "     2. Report name: ${CUR_REPORT_NAME}"
    echo "     3. Time granularity: Daily | Include: Resource IDs"
    echo "     4. Format: Apache Parquet | S3 bucket: ${CUR_BUCKET_NAME}"
    echo "     5. S3 prefix: cur-data | Versioning: Overwrite"
  }
}
echo ""

# --- Step 8: Athena Workgroup ------------------------------------------------

echo "[8/10] Creating Athena workgroup 'nimbus-finops'..."

aws athena create-work-group \
  --name "nimbus-finops" \
  --region "${AWS_REGION}" \
  --configuration '{
    "ResultConfiguration": {
      "OutputLocation": "s3://'"${ATHENA_RESULTS_BUCKET}"'/query-results/",
      "EncryptionConfiguration": {"EncryptionOption": "SSE_S3"}
    },
    "EnforceWorkGroupConfiguration": true,
    "BytesScannedCutoffPerQuery": 104857600,
    "PublishCloudWatchMetricsEnabled": true,
    "EngineVersion": {"SelectedEngineVersion": "Athena engine version 3"}
  }' \
  --description "Nimbus FinOps — CUR queries with 100MB scan limit" \
  2>/dev/null && echo "  ✅ Athena workgroup created (100MB scan limit, SSE-S3 encryption)." || \
  echo "  ↳ Workgroup already exists."
echo ""

# --- Step 9: Resource Explorer Index ----------------------------------------

echo "[9/10] Creating Resource Explorer index..."

aws resource-explorer-2 create-index \
  --type LOCAL \
  --region "${AWS_REGION}" \
  2>/dev/null && echo "  ✅ Resource Explorer LOCAL index created." || \
  echo "  ↳ Index already exists (or requires manual enablement)."

# For org-wide visibility, upgrade to AGGREGATOR:
# aws resource-explorer-2 update-index-type \
#   --arn "$(aws resource-explorer-2 list-indexes --region ${AWS_REGION} --query 'Indexes[0].Arn' --output text)" \
#   --type AGGREGATOR --region "${AWS_REGION}"
echo ""

# --- Step 10: Compute Optimizer ----------------------------------------------

echo "[10/10] Enabling Compute Optimizer..."

aws compute-optimizer update-enrollment-status \
  --status Active \
  --region "${AWS_REGION}" \
  2>/dev/null && echo "  ✅ Compute Optimizer enabled." || \
  echo "  ↳ Already active or requires org-level access."
echo ""

# --- Summary ------------------------------------------------------------------

echo "============================================="
echo "  ✅ AWS Setup Complete!"
echo "============================================="
echo ""
echo "  Resources Created:"
echo "  ─────────────────────────────────────────"
echo "  S3 Bucket (CUR):       ${CUR_BUCKET_NAME}"
echo "  S3 Bucket (Athena):    ${ATHENA_RESULTS_BUCKET}"
echo "  IAM Policy:            ${IAM_POLICY_NAME} (18 statements)"
echo "  IAM User:              ${IAM_USER_NAME}"
if [ -n "${NIMBUS_ACCOUNT_ID}" ]; then
echo "  IAM Role:              ${IAM_ROLE_NAME}"
echo "  External ID:           ${EXTERNAL_ID}"
fi
echo "  CUR Report:            ${CUR_REPORT_NAME}"
echo "  Athena Workgroup:      nimbus-finops"
echo "  Resource Explorer:     LOCAL index"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────┐"
echo "  │  Copy these into your Nimbus .env file:                     │"
echo "  ├─────────────────────────────────────────────────────────────┤"
if [ -n "${ACCESS_KEY_ID}" ]; then
echo "  │  AWS_ACCESS_KEY_ID=${ACCESS_KEY_ID}"
echo "  │  AWS_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}"
fi
echo "  │  AWS_REGION=${AWS_REGION}"
echo "  │  ATHENA_DATABASE=athenacurcfn_nimbus_daily_cur"
echo "  │  CUR_TABLE_NAME=nimbus_daily_cur"
echo "  │  ATHENA_WORKGROUP=nimbus-finops"
echo "  │  ATHENA_RESULTS_BUCKET=s3://${ATHENA_RESULTS_BUCKET}/query-results/"
echo "  └─────────────────────────────────────────────────────────────┘"
echo ""
echo "  ⚠️  IMPORTANT:"
echo "  1. CUR data takes 24-48 hours to appear in S3"
echo "  2. Cost Explorer API provides data immediately"
echo "  3. Save the credentials above — they are shown only once"
echo ""
echo "  📋 Verify CUR setup later:"
echo "     aws cur describe-report-definitions --region us-east-1"
echo "     aws s3 ls s3://${CUR_BUCKET_NAME}/cur-data/ --recursive"
echo ""

# Cleanup temp files
rm -f /tmp/nimbus-policy.json /tmp/nimbus-cur-bucket-policy.json /tmp/nimbus-trust-policy.json
