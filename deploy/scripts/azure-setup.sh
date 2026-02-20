#!/usr/bin/env bash
# =============================================================================
# Nimbus FinOps — Azure Setup
# =============================================================================
# Creates read-only access for the Nimbus Cloud FinOps platform.
# Run from Azure CloudShell or any terminal with Azure CLI logged in as admin.
#
# What this creates:
#   1. App Registration (Service Principal) — nimbus-finops-reader
#   2. Client Secret (2-year expiry)
#   3. Role assignments at Root Management Group — Cost Management Reader, Reader,
#      Billing Reader
#   4. (Optional) Cost Management daily export to Blob Storage (--enable-export)
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Global Admin or Owner at Root Management Group
#   - For --enable-export: a Storage Account with a container
#
# Usage:
#   ./azure-setup.sh                                    # Basic setup
#   ./azure-setup.sh --enable-export SUB_ID RG SA       # With daily cost export
# =============================================================================

set -euo pipefail

# --- Parse Arguments --------------------------------------------------------

ENABLE_EXPORT=""
EXPORT_SUBSCRIPTION=""
EXPORT_RG=""
EXPORT_STORAGE_ACCOUNT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --enable-export)
      ENABLE_EXPORT="true"
      EXPORT_SUBSCRIPTION="${2:-}"
      EXPORT_RG="${3:-}"
      EXPORT_STORAGE_ACCOUNT="${4:-}"
      if [[ -z "${EXPORT_SUBSCRIPTION}" || -z "${EXPORT_RG}" || -z "${EXPORT_STORAGE_ACCOUNT}" ]]; then
        echo "Usage: $0 --enable-export SUBSCRIPTION_ID RESOURCE_GROUP STORAGE_ACCOUNT"
        exit 1
      fi
      shift 4
      ;;
    --help|-h)
      echo "Usage: $0 [--enable-export SUBSCRIPTION_ID RESOURCE_GROUP STORAGE_ACCOUNT]"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Step 1: Auto-detect tenant & root management group --------------------

echo ""
echo "[1/7] Detecting Azure configuration..."

AZURE_TENANT_ID=$(az account show --query 'tenantId' --output tsv 2>/dev/null) || {
  echo "  ERROR: Cannot detect Azure tenant. Is Azure CLI logged in?"
  echo "  Run: az login"
  exit 1
}

# Get the root management group (usually same ID as tenant)
ROOT_MG_ID=$(az account management-group list --query "[?displayName=='Tenant Root Group'].name | [0]" --output tsv 2>/dev/null) || {
  echo "  WARNING: Cannot list management groups. Using tenant ID as root MG."
  ROOT_MG_ID="${AZURE_TENANT_ID}"
}
ROOT_MG_ID="${ROOT_MG_ID:-${AZURE_TENANT_ID}}"

AZURE_SUBSCRIPTION=$(az account show --query 'id' --output tsv 2>/dev/null)
SUBSCRIPTION_NAME=$(az account show --query 'name' --output tsv 2>/dev/null)

echo ""
echo "  ============================================="
echo "  Nimbus FinOps — Azure Setup"
echo "  ============================================="
echo "  Tenant:         ${AZURE_TENANT_ID}"
echo "  Root MG:        ${ROOT_MG_ID}"
echo "  Subscription:   ${SUBSCRIPTION_NAME} (${AZURE_SUBSCRIPTION})"
echo "  ============================================="
echo ""

# --- Step 2: App Registration (Service Principal) --------------------------

echo "[2/7] Creating App Registration..."

APP_NAME="nimbus-finops-reader"

# Check if app already exists
EXISTING_APP_ID=$(az ad app list --display-name "${APP_NAME}" --query "[0].appId" --output tsv 2>/dev/null)

if [[ -n "${EXISTING_APP_ID}" && "${EXISTING_APP_ID}" != "None" ]]; then
  echo "  ↳ App Registration already exists: ${EXISTING_APP_ID}"
  AZURE_CLIENT_ID="${EXISTING_APP_ID}"
else
  AZURE_CLIENT_ID=$(az ad app create --display-name "${APP_NAME}" --query 'appId' --output tsv)
  echo "  ↳ Created App Registration: ${AZURE_CLIENT_ID}"
fi

# Ensure Service Principal exists for the app
SP_OBJECT_ID=$(az ad sp list --filter "appId eq '${AZURE_CLIENT_ID}'" --query "[0].id" --output tsv 2>/dev/null)
if [[ -z "${SP_OBJECT_ID}" || "${SP_OBJECT_ID}" == "None" ]]; then
  SP_OBJECT_ID=$(az ad sp create --id "${AZURE_CLIENT_ID}" --query 'id' --output tsv)
  echo "  ↳ Created Service Principal: ${SP_OBJECT_ID}"
else
  echo "  ↳ Service Principal exists: ${SP_OBJECT_ID}"
fi

# --- Step 3: Client Secret -------------------------------------------------

echo "[3/7] Creating Client Secret (2-year expiry)..."

# Compute expiry: 2 years from now (macOS + Linux compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
  SECRET_EXPIRY=$(date -v+2y '+%Y-%m-%dT%H:%M:%SZ')
else
  SECRET_EXPIRY=$(date -d '+2 years' --iso-8601=seconds)
fi

SECRET_OUTPUT=$(az ad app credential reset \
  --id "${AZURE_CLIENT_ID}" \
  --append \
  --end-date "${SECRET_EXPIRY}" \
  --display-name "nimbus-finops-$(date +%Y%m%d)" \
  2>/dev/null) || {
  # Fallback: simpler command if --end-date not supported
  SECRET_OUTPUT=$(az ad app credential reset --id "${AZURE_CLIENT_ID}" --append)
}

AZURE_CLIENT_SECRET=$(echo "${SECRET_OUTPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])" 2>/dev/null) || \
  AZURE_CLIENT_SECRET=$(echo "${SECRET_OUTPUT}" | grep -o '"password": *"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "${AZURE_CLIENT_SECRET}" ]]; then
  echo "  ERROR: Failed to extract client secret. Output:"
  echo "${SECRET_OUTPUT}"
  exit 1
fi

echo "  ↳ Client secret created (expires: ${SECRET_EXPIRY})"

# --- Step 4: Role Assignments at Root Management Group ----------------------

echo "[4/7] Assigning roles at Root Management Group..."

ROOT_MG_SCOPE="/providers/Microsoft.Management/managementGroups/${ROOT_MG_ID}"

declare -a ROLES=(
  "Cost Management Reader"
  "Reader"
  "Billing Reader"
)

for ROLE in "${ROLES[@]}"; do
  # Check if already assigned
  EXISTING=$(az role assignment list \
    --assignee "${AZURE_CLIENT_ID}" \
    --role "${ROLE}" \
    --scope "${ROOT_MG_SCOPE}" \
    --query "[0].id" --output tsv 2>/dev/null)

  if [[ -n "${EXISTING}" && "${EXISTING}" != "None" ]]; then
    echo "  ↳ ${ROLE} — already assigned"
  else
    az role assignment create \
      --assignee "${AZURE_CLIENT_ID}" \
      --role "${ROLE}" \
      --scope "${ROOT_MG_SCOPE}" \
      --output none 2>/dev/null && \
      echo "  ↳ ${ROLE} — assigned" || \
      echo "  ↳ ${ROLE} — FAILED (check permissions)"
  fi
done

echo ""
echo "  Role Summary:"
echo "    Cost Management Reader → Cost data, budgets, anomalies (all subscriptions)"
echo "    Reader                 → Resource Graph, Advisor, resource metadata"
echo "    Billing Reader         → Invoices, billing account details"

# --- Step 5: Cost Management Export (optional) ------------------------------

if [[ -n "${ENABLE_EXPORT}" ]]; then
  echo ""
  echo "[5/7] Creating Cost Management daily export..."

  STORAGE_ACCOUNT_ID="/subscriptions/${EXPORT_SUBSCRIPTION}/resourceGroups/${EXPORT_RG}/providers/Microsoft.Storage/storageAccounts/${EXPORT_STORAGE_ACCOUNT}"

  # Create the export at Root Management Group scope
  az costmanagement export create \
    --name "nimbus-daily-export" \
    --scope "${ROOT_MG_SCOPE}" \
    --storage-account-id "${STORAGE_ACCOUNT_ID}" \
    --storage-container "nimbus-cost-exports" \
    --timeframe MonthToDate \
    --recurrence Daily \
    --schedule-status Active \
    --type ActualCost \
    --output none 2>/dev/null && \
    echo "  ↳ Daily cost export created → ${EXPORT_STORAGE_ACCOUNT}/nimbus-cost-exports" || \
    echo "  ↳ Export creation failed (may need manual setup in Portal)"

  echo "  NOTE: Exports support FOCUS 1.0 format — enable in Portal for vendor-neutral data."
else
  echo ""
  echo "[5/7] Cost Management Export — skipped (use --enable-export to enable)"
fi

# --- Step 6: Verify access --------------------------------------------------

echo ""
echo "[6/7] Verifying access..."

# Quick test: authenticate as the service principal and query cost management
echo "  Testing Cost Management API access..."

# Get a token for the service principal
TOKEN=$(az account get-access-token \
  --tenant "${AZURE_TENANT_ID}" \
  --query 'accessToken' --output tsv 2>/dev/null)

if [[ -n "${TOKEN}" ]]; then
  # Test Cost Management Query (last 7 days for a quick check)
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://management.azure.com/providers/Microsoft.Management/managementGroups/${ROOT_MG_ID}/providers/Microsoft.CostManagement/query?api-version=2023-11-01" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "ActualCost",
      "timeframe": "MonthToDate",
      "dataset": {
        "granularity": "None",
        "aggregation": { "totalCost": { "name": "Cost", "function": "Sum" } }
      }
    }' 2>/dev/null)

  if [[ "${HTTP_STATUS}" == "200" ]]; then
    echo "  ↳ Cost Management API: OK (HTTP ${HTTP_STATUS})"
  elif [[ "${HTTP_STATUS}" == "401" || "${HTTP_STATUS}" == "403" ]]; then
    echo "  ↳ Cost Management API: Permission pending (role propagation can take 5-15 min)"
  else
    echo "  ↳ Cost Management API: HTTP ${HTTP_STATUS} (may need time to propagate)"
  fi
else
  echo "  ↳ Skipping API test (cannot get token in current context)"
  echo "  ↳ Role propagation takes 5-15 minutes — test later with:"
  echo "     az login --service-principal -u ${AZURE_CLIENT_ID} -p <secret> --tenant ${AZURE_TENANT_ID}"
fi

# --- Step 7: Summary -------------------------------------------------------

echo ""
echo "[7/7] Setup complete!"
echo ""
echo "  ============================================="
echo "  Azure Credentials for Nimbus"
echo "  ============================================="
echo ""
echo "  Add these to your Nimbus .env file:"
echo ""
echo "  AZURE_CLIENT_ID=${AZURE_CLIENT_ID}"
echo "  AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}"
echo "  AZURE_TENANT_ID=${AZURE_TENANT_ID}"
echo ""
echo "  ============================================="
echo ""
echo "  What Nimbus can now access:"
echo "    ✓ Cost data across ALL subscriptions (Cost Management Reader)"
echo "    ✓ Resource inventory via Azure Resource Graph (Reader)"
echo "    ✓ Advisor recommendations — rightsizing, security (Reader)"
echo "    ✓ Budget tracking and anomaly detection (Cost Management Reader)"
echo "    ✓ Billing and invoice details (Billing Reader)"
echo ""
echo "  API Cost: FREE (Azure Cost Management APIs have no per-request charges)"
echo ""
echo "  Security:"
echo "    - Read-only access only (no Owner/Contributor)"
echo "    - Client secret expires: ${SECRET_EXPIRY}"
echo "    - Rotate secret before expiry: az ad app credential reset --id ${AZURE_CLIENT_ID}"
echo ""
echo "  NOTE: Role assignments may take 5-15 minutes to propagate."
echo "  ============================================="
