#!/usr/bin/env bash
# =============================================================================
# Nimbus FinOps — GCP Setup
# =============================================================================
# Creates read-only access for the Nimbus Cloud FinOps platform.
# Run from GCP CloudShell or any terminal with gcloud CLI configured as admin.
#
# What this creates:
#   1. Service Account — nimbus-finops-reader (in specified project)
#   2. Organization-level IAM bindings — billing, assets, recommendations, monitoring
#   3. BigQuery access — dataViewer on billing dataset, jobUser on project
#   4. Enables required APIs
#   5. Service Account JSON key (base64-encoded for .env)
#
# Prerequisites:
#   - gcloud CLI installed and logged in (gcloud auth login)
#   - Organization Admin or sufficient IAM permissions
#   - BigQuery Billing Export enabled (must be done in Console — see notes)
#
# Usage:
#   ./gcp-setup.sh --project PROJECT_ID --billing-dataset DATASET
#   ./gcp-setup.sh --project my-project --billing-dataset nimbus_billing_export
#   ./gcp-setup.sh --project my-project --billing-dataset nimbus_billing_export --billing-table gcp_billing_export_v1_XXXXXX
# =============================================================================

set -euo pipefail

# --- Parse Arguments --------------------------------------------------------

GCP_PROJECT=""
BILLING_DATASET=""
BILLING_TABLE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --project) GCP_PROJECT="$2"; shift 2 ;;
    --billing-dataset) BILLING_DATASET="$2"; shift 2 ;;
    --billing-table) BILLING_TABLE="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 --project PROJECT_ID --billing-dataset DATASET [--billing-table TABLE]"
      echo ""
      echo "  --project          GCP project for the service account & BigQuery jobs"
      echo "  --billing-dataset  BigQuery dataset containing billing export"
      echo "  --billing-table    (Optional) Specific billing export table name"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "${GCP_PROJECT}" || -z "${BILLING_DATASET}" ]]; then
  echo "ERROR: --project and --billing-dataset are required."
  echo "Run: $0 --help"
  exit 1
fi

# --- Step 1: Auto-detect organization & billing info -------------------------

echo ""
echo "[1/7] Detecting GCP configuration..."

GCP_ORG_ID=$(gcloud organizations list --format="value(ID)" 2>/dev/null | head -1) || {
  echo "  ERROR: Cannot list organizations. Ensure you have Organization Admin access."
  exit 1
}

if [[ -z "${GCP_ORG_ID}" ]]; then
  echo "  ERROR: No GCP Organization found. Nimbus requires organization-level access."
  exit 1
fi

GCP_ORG_NAME=$(gcloud organizations list --format="value(displayName)" 2>/dev/null | head -1)

# Verify the project exists
gcloud projects describe "${GCP_PROJECT}" --format="value(projectId)" >/dev/null 2>&1 || {
  echo "  ERROR: Project '${GCP_PROJECT}' not found or inaccessible."
  exit 1
}

echo ""
echo "  ============================================="
echo "  Nimbus FinOps — GCP Setup"
echo "  ============================================="
echo "  Organization:  ${GCP_ORG_NAME} (${GCP_ORG_ID})"
echo "  Project:       ${GCP_PROJECT}"
echo "  BQ Dataset:    ${BILLING_DATASET}"
echo "  ============================================="
echo ""

# --- Step 2: Service Account ------------------------------------------------

echo "[2/7] Creating Service Account..."

SA_NAME="nimbus-finops-reader"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"

# Check if already exists
EXISTING_SA=$(gcloud iam service-accounts list \
  --project="${GCP_PROJECT}" \
  --filter="email:${SA_EMAIL}" \
  --format="value(email)" 2>/dev/null)

if [[ -n "${EXISTING_SA}" ]]; then
  echo "  ↳ Service Account already exists: ${SA_EMAIL}"
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Nimbus FinOps Reader" \
    --description="Read-only access for Nimbus Cloud FinOps platform" \
    --project="${GCP_PROJECT}" \
    2>/dev/null
  echo "  ↳ Created Service Account: ${SA_EMAIL}"
fi

# --- Step 3: Organization-level IAM bindings ---------------------------------

echo "[3/7] Assigning organization-level IAM roles..."

SA_MEMBER="serviceAccount:${SA_EMAIL}"

declare -A ORG_ROLES=(
  ["roles/billing.viewer"]="Billing data and budgets across all projects"
  ["roles/cloudasset.viewer"]="Resource inventory across all projects"
  ["roles/recommender.viewer"]="Rightsizing and cost optimization recommendations"
  ["roles/browser"]="List projects, folders, organization structure"
  ["roles/monitoring.viewer"]="Cloud Monitoring metrics (CPU, memory, disk)"
)

for ROLE in "${!ORG_ROLES[@]}"; do
  DESCRIPTION="${ORG_ROLES[${ROLE}]}"

  # Check if binding already exists
  EXISTING=$(gcloud organizations get-iam-policy "${GCP_ORG_ID}" \
    --format="json" 2>/dev/null | \
    python3 -c "
import sys, json
policy = json.load(sys.stdin)
for b in policy.get('bindings', []):
    if b['role'] == '${ROLE}' and '${SA_MEMBER}' in b.get('members', []):
        print('exists')
        break
" 2>/dev/null)

  if [[ "${EXISTING}" == "exists" ]]; then
    echo "  ↳ ${ROLE} — already bound"
  else
    gcloud organizations add-iam-policy-binding "${GCP_ORG_ID}" \
      --member="${SA_MEMBER}" \
      --role="${ROLE}" \
      --quiet \
      --format="none" 2>/dev/null && \
      echo "  ↳ ${ROLE} — bound (${DESCRIPTION})" || \
      echo "  ↳ ${ROLE} — FAILED (check permissions)"
  fi
done

# --- Step 4: BigQuery access -------------------------------------------------

echo ""
echo "[4/7] Configuring BigQuery access..."

# 4a: BigQuery Job User on the project (run queries)
echo "  Assigning bigquery.jobUser on project ${GCP_PROJECT}..."
gcloud projects add-iam-policy-binding "${GCP_PROJECT}" \
  --member="${SA_MEMBER}" \
  --role="roles/bigquery.jobUser" \
  --quiet \
  --format="none" 2>/dev/null && \
  echo "  ↳ roles/bigquery.jobUser — assigned on ${GCP_PROJECT}" || \
  echo "  ↳ roles/bigquery.jobUser — already assigned or failed"

# 4b: BigQuery Data Viewer on the billing export dataset
DATASET_FULL="${GCP_PROJECT}:${BILLING_DATASET}"
echo "  Assigning bigquery.dataViewer on dataset ${DATASET_FULL}..."

# Check if dataset exists
bq show "${DATASET_FULL}" >/dev/null 2>&1
DATASET_EXISTS=$?

if [[ ${DATASET_EXISTS} -ne 0 ]]; then
  echo ""
  echo "  WARNING: Dataset '${DATASET_FULL}' not found."
  echo "  This means billing export hasn't been set up yet."
  echo ""
  echo "  To enable billing export:"
  echo "    1. Go to GCP Console → Billing → Billing Export → BigQuery Export"
  echo "    2. Create dataset: bq mk --dataset --location=US ${DATASET_FULL}"
  echo "    3. Enable: Standard usage cost + Detailed usage cost + Pricing"
  echo "    4. Re-run this script"
  echo ""
  echo "  Creating the dataset now..."
  bq mk --dataset --location=US --description="Nimbus billing export" "${DATASET_FULL}" 2>/dev/null && \
    echo "  ↳ Dataset created: ${DATASET_FULL}" || \
    echo "  ↳ Dataset creation failed (may need billing export setup first)"
fi

# Grant dataViewer on the dataset using bq
bq update --dataset \
  --source "${DATASET_FULL}" 2>/dev/null || true

# Use gcloud to add IAM binding on the dataset
# bq add-iam-policy-binding is the most reliable way
python3 -c "
import subprocess, json, sys

# Get current policy
result = subprocess.run(
    ['bq', 'show', '--format=prettyjson', '${DATASET_FULL}'],
    capture_output=True, text=True
)
if result.returncode != 0:
    print('  ↳ Cannot access dataset — skipping dataViewer binding')
    sys.exit(0)

dataset = json.loads(result.stdout)
access = dataset.get('access', [])

# Check if already has access
sa_entry = {'role': 'READER', 'userByEmail': '${SA_EMAIL}'}
if any(a.get('userByEmail') == '${SA_EMAIL}' for a in access):
    print('  ↳ bigquery.dataViewer — already granted on dataset')
    sys.exit(0)

# Add access
access.append(sa_entry)
dataset['access'] = access

# Write updated dataset
import tempfile
with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
    json.dump(dataset, f)
    f.flush()
    update_result = subprocess.run(
        ['bq', 'update', '--source', f.name, '${DATASET_FULL}'],
        capture_output=True, text=True
    )
    if update_result.returncode == 0:
        print('  ↳ bigquery.dataViewer — granted on ${BILLING_DATASET}')
    else:
        print('  ↳ bigquery.dataViewer — failed: ' + update_result.stderr.strip())
" 2>/dev/null || echo "  ↳ bigquery.dataViewer — manual grant may be needed"

# --- Step 5: Enable required APIs -------------------------------------------

echo ""
echo "[5/7] Enabling required APIs..."

declare -a APIS=(
  "cloudasset.googleapis.com"
  "recommender.googleapis.com"
  "cloudbilling.googleapis.com"
  "bigquery.googleapis.com"
  "billingbudgets.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "monitoring.googleapis.com"
  "serviceusage.googleapis.com"
)

for API in "${APIS[@]}"; do
  gcloud services enable "${API}" --project="${GCP_PROJECT}" --quiet 2>/dev/null && \
    echo "  ↳ ${API} — enabled" || \
    echo "  ↳ ${API} — already enabled or failed"
done

# --- Step 6: Service Account JSON key ----------------------------------------

echo ""
echo "[6/7] Generating Service Account key..."

# Create a temp file for the key
KEY_FILE="/tmp/nimbus-gcp-key-$(date +%s).json"

gcloud iam service-accounts keys create "${KEY_FILE}" \
  --iam-account="${SA_EMAIL}" \
  --project="${GCP_PROJECT}" \
  2>/dev/null

if [[ -f "${KEY_FILE}" ]]; then
  GCP_SA_KEY_B64=$(base64 < "${KEY_FILE}" | tr -d '\n')
  rm -f "${KEY_FILE}"
  echo "  ↳ Key generated and base64-encoded (plaintext securely deleted)"
else
  echo "  ERROR: Failed to create service account key."
  exit 1
fi

# Auto-detect billing table if not provided
if [[ -z "${BILLING_TABLE}" ]]; then
  BILLING_TABLE=$(bq ls --max_results=5 "${DATASET_FULL}" 2>/dev/null | \
    grep -o 'gcp_billing_export[^ ]*' | head -1) || true
  if [[ -z "${BILLING_TABLE}" ]]; then
    BILLING_TABLE="gcp_billing_export_v1_XXXXXX_YYYYYY"
    echo "  NOTE: Could not auto-detect billing table. Using placeholder."
    echo "        Update GCP_BILLING_TABLE after billing export is enabled."
  else
    echo "  ↳ Auto-detected billing table: ${BILLING_TABLE}"
  fi
fi

# --- Step 7: Summary --------------------------------------------------------

echo ""
echo "[7/7] Setup complete!"
echo ""
echo "  ============================================="
echo "  GCP Credentials for Nimbus"
echo "  ============================================="
echo ""
echo "  Add these to your Nimbus .env file:"
echo ""
echo "  GCP_SERVICE_ACCOUNT_JSON=${GCP_SA_KEY_B64}"
echo "  GCP_PROJECT_ID=${GCP_PROJECT}"
echo "  GCP_ORG_ID=${GCP_ORG_ID}"
echo "  GCP_BILLING_DATASET=${GCP_PROJECT}.${BILLING_DATASET}"
echo "  GCP_BILLING_TABLE=${BILLING_TABLE}"
echo ""
echo "  ============================================="
echo ""
echo "  What Nimbus can now access:"
echo "    ✓ Cost data via BigQuery billing export (billing.viewer + BQ dataViewer)"
echo "    ✓ Resource inventory via Cloud Asset Inventory (cloudasset.viewer)"
echo "    ✓ Rightsizing recommendations via Recommender API (recommender.viewer)"
echo "    ✓ Organization structure — projects, folders (browser)"
echo "    ✓ Cloud Monitoring metrics — CPU, memory, disk (monitoring.viewer)"
echo ""
echo "  API Cost: ~\$1-3/month (BigQuery query charges, cached to minimize scans)"
echo ""
echo "  Security:"
echo "    - Read-only roles only (no Editor/Owner)"
echo "    - Key rotation: gcloud iam service-accounts keys create ... --iam-account=${SA_EMAIL}"
echo "    - Consider Workload Identity Federation for keyless auth in production"
echo ""
echo "  IMPORTANT — Billing Export Setup:"
echo "    If not already done, enable BigQuery billing export in GCP Console:"
echo "    1. Go to Billing → Billing Export → BigQuery Export"
echo "    2. Select dataset: ${BILLING_DATASET}"
echo "    3. Enable: Standard usage cost + Detailed usage cost + Pricing"
echo "    (This step CANNOT be done via CLI — requires Console)"
echo "  ============================================="
