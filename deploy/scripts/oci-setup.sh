#!/usr/bin/env bash
# =============================================================================
# Nimbus FinOps — OCI (Oracle Cloud Infrastructure) Setup
# =============================================================================
# Creates read-only access for the Nimbus Cloud FinOps platform.
# Run from OCI CloudShell or any terminal with OCI CLI configured as admin.
#
# What this creates:
#   1. IAM Group — NimbusFinOpsReaders
#   2. IAM User — nimbus-finops-svc (added to group)
#   3. API Signing Key — RSA 2048-bit (public key uploaded, private key base64-encoded)
#   4. IAM Policies — 7 read-only statements at tenancy level
#
# Prerequisites:
#   - OCI CLI installed and configured (oci setup config)
#   - Tenancy administrator access
#   - openssl installed (for key generation)
#
# Usage:
#   ./oci-setup.sh                              # Auto-detect region from CLI config
#   ./oci-setup.sh --region ap-mumbai-1         # Override region
# =============================================================================

set -euo pipefail

# --- Parse Arguments --------------------------------------------------------

CUSTOM_REGION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --region) CUSTOM_REGION="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--region OCI_REGION]"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Step 1: Auto-detect tenancy info ---------------------------------------

echo ""
echo "[1/7] Detecting OCI configuration..."

# Get tenancy OCID from CLI config
OCI_TENANCY_OCID=$(oci iam tenancy get --query 'data.id' --raw-output 2>/dev/null) || {
  # Fallback: parse from OCI config file
  OCI_TENANCY_OCID=$(grep -m1 'tenancy' ~/.oci/config 2>/dev/null | cut -d'=' -f2 | tr -d ' ') || {
    echo "  ERROR: Cannot detect OCI tenancy. Is OCI CLI configured?"
    echo "  Run: oci setup config"
    exit 1
  }
}

if [[ -z "${OCI_TENANCY_OCID}" ]]; then
  echo "  ERROR: Cannot detect OCI tenancy OCID."
  exit 1
fi

# Get tenancy name
TENANCY_NAME=$(oci iam tenancy get --tenancy-id "${OCI_TENANCY_OCID}" --query 'data.name' --raw-output 2>/dev/null) || TENANCY_NAME="unknown"

# Detect region from CLI config or argument
if [[ -n "${CUSTOM_REGION}" ]]; then
  OCI_REGION="${CUSTOM_REGION}"
else
  OCI_REGION=$(oci iam region-subscription list --tenancy-id "${OCI_TENANCY_OCID}" --query 'data[?isHomeRegion].regionName | [0]' --raw-output 2>/dev/null) || {
    OCI_REGION=$(grep -m1 'region' ~/.oci/config 2>/dev/null | cut -d'=' -f2 | tr -d ' ') || OCI_REGION="ap-mumbai-1"
  }
fi

echo ""
echo "  ============================================="
echo "  Nimbus FinOps — OCI Setup"
echo "  ============================================="
echo "  Tenancy:  ${TENANCY_NAME} (${OCI_TENANCY_OCID})"
echo "  Region:   ${OCI_REGION}"
echo "  ============================================="
echo ""

# --- Step 2: IAM Group ------------------------------------------------------

echo "[2/7] Creating IAM Group..."

GROUP_NAME="NimbusFinOpsReaders"

# Check if group already exists
GROUP_OCID=$(oci iam group list \
  --compartment-id "${OCI_TENANCY_OCID}" \
  --name "${GROUP_NAME}" \
  --query 'data[0].id' --raw-output 2>/dev/null)

if [[ -n "${GROUP_OCID}" && "${GROUP_OCID}" != "None" && "${GROUP_OCID}" != "null" ]]; then
  echo "  ↳ Group already exists: ${GROUP_NAME}"
else
  GROUP_OCID=$(oci iam group create \
    --compartment-id "${OCI_TENANCY_OCID}" \
    --name "${GROUP_NAME}" \
    --description "Read-only access for Nimbus FinOps platform" \
    --query 'data.id' --raw-output 2>/dev/null)
  echo "  ↳ Created group: ${GROUP_NAME}"
fi

# --- Step 3: IAM User -------------------------------------------------------

echo "[3/7] Creating IAM User..."

USER_NAME="nimbus-finops-svc"

# Check if user already exists
USER_OCID=$(oci iam user list \
  --compartment-id "${OCI_TENANCY_OCID}" \
  --name "${USER_NAME}" \
  --query 'data[0].id' --raw-output 2>/dev/null)

if [[ -n "${USER_OCID}" && "${USER_OCID}" != "None" && "${USER_OCID}" != "null" ]]; then
  echo "  ↳ User already exists: ${USER_NAME}"
else
  USER_OCID=$(oci iam user create \
    --compartment-id "${OCI_TENANCY_OCID}" \
    --name "${USER_NAME}" \
    --description "Nimbus FinOps read-only service user" \
    --query 'data.id' --raw-output 2>/dev/null)
  echo "  ↳ Created user: ${USER_NAME}"
fi

# Add user to group (idempotent — OCI ignores duplicates or we catch error)
oci iam group add-user \
  --group-id "${GROUP_OCID}" \
  --user-id "${USER_OCID}" \
  2>/dev/null && echo "  ↳ Added user to group: ${GROUP_NAME}" || \
  echo "  ↳ User already in group: ${GROUP_NAME}"

# --- Step 4: API Signing Key ------------------------------------------------

echo "[4/7] Generating API signing key..."

KEY_DIR="/tmp/nimbus-oci-$(date +%s)"
mkdir -p "${KEY_DIR}"

PRIVATE_KEY="${KEY_DIR}/nimbus-oci-key.pem"
PUBLIC_KEY="${KEY_DIR}/nimbus-oci-key-public.pem"

# Generate RSA 2048-bit key pair
openssl genrsa -out "${PRIVATE_KEY}" 2048 2>/dev/null
openssl rsa -in "${PRIVATE_KEY}" -pubout -out "${PUBLIC_KEY}" 2>/dev/null

echo "  ↳ RSA 2048-bit key pair generated"

# Upload public key to the service user
UPLOAD_RESULT=$(oci iam user api-key upload \
  --user-id "${USER_OCID}" \
  --key-file "${PUBLIC_KEY}" \
  --query 'data.fingerprint' --raw-output 2>/dev/null) || {
  echo "  WARNING: Failed to upload API key. User may have max keys (3)."
  echo "  Delete an old key: oci iam user api-key delete --user-id ${USER_OCID} --fingerprint <FP>"
  UPLOAD_RESULT=""
}

OCI_FINGERPRINT="${UPLOAD_RESULT}"

if [[ -n "${OCI_FINGERPRINT}" && "${OCI_FINGERPRINT}" != "None" ]]; then
  echo "  ↳ Public key uploaded — fingerprint: ${OCI_FINGERPRINT}"
else
  echo "  ↳ Attempting to detect fingerprint from existing keys..."
  OCI_FINGERPRINT=$(oci iam user api-key list \
    --user-id "${USER_OCID}" \
    --query 'data[-1].fingerprint' --raw-output 2>/dev/null) || OCI_FINGERPRINT="UPLOAD_FAILED"
fi

# Base64-encode private key and securely delete plaintext
OCI_PRIVATE_KEY_B64=$(base64 < "${PRIVATE_KEY}" | tr -d '\n')
rm -f "${PRIVATE_KEY}" "${PUBLIC_KEY}"
rmdir "${KEY_DIR}" 2>/dev/null || true

echo "  ↳ Private key base64-encoded (plaintext securely deleted)"

# --- Step 5: IAM Policies ---------------------------------------------------

echo "[5/7] Creating IAM Policies..."

POLICY_NAME="NimbusFinOpsPolicy"

# All 7 policy statements — read-only access across the entire tenancy
POLICY_STATEMENTS='[
  "Allow group NimbusFinOpsReaders to read usage-reports in tenancy",
  "Allow group NimbusFinOpsReaders to read usage-budgets in tenancy",
  "Allow group NimbusFinOpsReaders to read all-resources in tenancy",
  "Allow group NimbusFinOpsReaders to read cloud-advisor-recommendations in tenancy",
  "Allow group NimbusFinOpsReaders to read cloud-guard-problems in tenancy",
  "Allow group NimbusFinOpsReaders to read compartments in tenancy",
  "Allow group NimbusFinOpsReaders to read tag-namespaces in tenancy"
]'

# Check if policy already exists
EXISTING_POLICY=$(oci iam policy list \
  --compartment-id "${OCI_TENANCY_OCID}" \
  --name "${POLICY_NAME}" \
  --query 'data[0].id' --raw-output 2>/dev/null)

if [[ -n "${EXISTING_POLICY}" && "${EXISTING_POLICY}" != "None" && "${EXISTING_POLICY}" != "null" ]]; then
  echo "  ↳ Policy already exists — updating statements..."
  oci iam policy update \
    --policy-id "${EXISTING_POLICY}" \
    --statements "${POLICY_STATEMENTS}" \
    --force \
    2>/dev/null && echo "  ↳ Policy updated: ${POLICY_NAME}" || \
    echo "  ↳ Policy update failed (statements may be unchanged)"
else
  oci iam policy create \
    --compartment-id "${OCI_TENANCY_OCID}" \
    --name "${POLICY_NAME}" \
    --description "Read-only access for Nimbus FinOps platform" \
    --statements "${POLICY_STATEMENTS}" \
    2>/dev/null && echo "  ↳ Created policy: ${POLICY_NAME}" || \
    echo "  ↳ Policy creation failed (check permissions)"
fi

echo ""
echo "  Policy Statements:"
echo "    1. read usage-reports     → Cost data (Usage API / Cost Analysis)"
echo "    2. read usage-budgets     → Budget tracking and alerts"
echo "    3. read all-resources     → Resource inventory (Search API)"
echo "    4. read cloud-advisor-recommendations → Rightsizing recommendations"
echo "    5. read cloud-guard-problems          → Security and compliance findings"
echo "    6. read compartments      → Compartment hierarchy"
echo "    7. read tag-namespaces    → Cost allocation tags"

# --- Step 6: Verify access ---------------------------------------------------

echo ""
echo "[6/7] Verifying access..."

# Test: list compartments using the new credentials
# (We can't auth as the new user from here, so we verify the policy exists)
echo "  Checking policy attachment..."

VERIFY_POLICY=$(oci iam policy list \
  --compartment-id "${OCI_TENANCY_OCID}" \
  --name "${POLICY_NAME}" \
  --query 'data[0].lifecycleState' --raw-output 2>/dev/null)

if [[ "${VERIFY_POLICY}" == "ACTIVE" ]]; then
  echo "  ↳ Policy status: ACTIVE"
else
  echo "  ↳ Policy status: ${VERIFY_POLICY:-UNKNOWN} (may need a few minutes to propagate)"
fi

# Verify user is in group
USER_IN_GROUP=$(oci iam group list-members \
  --group-id "${GROUP_OCID}" \
  --query "data[?\"user-id\"=='${USER_OCID}'].\"user-id\" | [0]" --raw-output 2>/dev/null)

if [[ -n "${USER_IN_GROUP}" && "${USER_IN_GROUP}" != "None" && "${USER_IN_GROUP}" != "null" ]]; then
  echo "  ↳ User ${USER_NAME} is in group ${GROUP_NAME}: OK"
else
  echo "  ↳ User group membership: could not verify (check manually)"
fi

echo ""
echo "  To test with the new credentials:"
echo "    export OCI_CLI_TENANCY=${OCI_TENANCY_OCID}"
echo "    export OCI_CLI_USER=${USER_OCID}"
echo "    export OCI_CLI_FINGERPRINT=${OCI_FINGERPRINT}"
echo "    oci iam compartment list --compartment-id ${OCI_TENANCY_OCID}"

# --- Step 7: Summary --------------------------------------------------------

echo ""
echo "[7/7] Setup complete!"
echo ""
echo "  ============================================="
echo "  OCI Credentials for Nimbus"
echo "  ============================================="
echo ""
echo "  Add these to your Nimbus .env file:"
echo ""
echo "  OCI_TENANCY_OCID=${OCI_TENANCY_OCID}"
echo "  OCI_USER_OCID=${USER_OCID}"
echo "  OCI_FINGERPRINT=${OCI_FINGERPRINT}"
echo "  OCI_PRIVATE_KEY=${OCI_PRIVATE_KEY_B64}"
echo "  OCI_REGION=${OCI_REGION}"
echo ""
echo "  ============================================="
echo ""
echo "  What Nimbus can now access:"
echo "    ✓ Cost data via Usage API / Cost Analysis (usage-reports)"
echo "    ✓ Budget tracking and alerts (usage-budgets)"
echo "    ✓ Resource inventory via Search API (all-resources)"
echo "    ✓ Rightsizing recommendations via Cloud Advisor (cloud-advisor-recommendations)"
echo "    ✓ Security findings via Cloud Guard (cloud-guard-problems)"
echo "    ✓ Compartment hierarchy (compartments)"
echo "    ✓ Cost allocation tags (tag-namespaces)"
echo ""
echo "  API Cost: FREE (OCI Usage APIs have no per-request charges)"
echo ""
echo "  Security:"
echo "    - Read-only policies only (no 'manage' or 'use' verbs)"
echo "    - Private key stored as base64 environment variable"
echo "    - Key rotation: rotate every 12 months"
echo "    - Consider Instance Principal for OCI-hosted deployments (no key needed)"
echo ""
echo "  Key Differences from Other Clouds:"
echo "    - Single tenancy = single bill (compartments are logical, not billing boundaries)"
echo "    - No data egress charges (unique among clouds)"
echo "    - OCPU = 2 vCPUs (different pricing model)"
echo "    - Usage API aggregates all regions automatically"
echo "  ============================================="
