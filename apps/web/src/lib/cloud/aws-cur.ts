import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  type ResultSet,
} from '@aws-sdk/client-athena';

// --- Types -------------------------------------------------------------------

export interface CurQueryResult {
  columns: string[];
  rows: Record<string, string>[];
  queryExecutionId: string;
  dataScannedBytes: number;
  executionTimeMs: number;
}

export interface ResourceCostItem {
  resourceId: string;
  serviceName: string;
  resourceType: string;
  region: string;
  cost: number;
  usageQuantity: number;
  usageUnit: string;
  tags: Record<string, string>;
}

export interface HourlyCostItem {
  hour: string;
  serviceName: string;
  cost: number;
  resourceCount: number;
}

export interface TagCostItem {
  tagValue: string;
  serviceName: string;
  cost: number;
  resourceCount: number;
}

export type CurQueryType =
  | 'resourceCostBreakdown'
  | 'costsByResourceId'
  | 'hourlyCostSpike'
  | 'tagCostAllocation'
  | 'untaggedResourceCosts'
  | 'serviceResourceBreakdown'
  | 'commitmentWaste'
  | 'dataTransferByResource';

// --- Configuration -----------------------------------------------------------

const ATHENA_DATABASE = process.env.ATHENA_DATABASE || 'athenacurcfn_nimbus_daily_cur';
const ATHENA_TABLE = process.env.CUR_TABLE_NAME || 'nimbus_daily_cur';
const ATHENA_WORKGROUP = process.env.ATHENA_WORKGROUP || 'nimbus-finops';
const ATHENA_RESULTS_BUCKET = process.env.ATHENA_RESULTS_BUCKET || 's3://nimbus-athena-results-766940073591/query-results/';

// --- Cache -------------------------------------------------------------------

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const queryCache = new Map<string, { data: CurQueryResult; cachedAt: number }>();

function getCacheKey(queryType: string, params: Record<string, string>): string {
  return `${queryType}:${JSON.stringify(params)}`;
}

function getCachedResult(key: string): CurQueryResult | null {
  const entry = queryCache.get(key);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) {
    queryCache.delete(key);
  }
  return null;
}

function setCachedResult(key: string, data: CurQueryResult): void {
  queryCache.set(key, { data, cachedAt: Date.now() });
  // Evict old entries if cache grows too large (max 100 entries)
  if (queryCache.size > 100) {
    const oldest = Array.from(queryCache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)[0];
    if (oldest) queryCache.delete(oldest[0]);
  }
}

// --- Athena Client -----------------------------------------------------------

function createAthenaClient(): AthenaClient {
  return new AthenaClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

// --- Core Query Execution ----------------------------------------------------

async function executeAthenaQuery(sql: string): Promise<CurQueryResult> {
  const client = createAthenaClient();

  // Start query
  const startResult = await client.send(
    new StartQueryExecutionCommand({
      QueryString: sql,
      QueryExecutionContext: {
        Database: ATHENA_DATABASE,
      },
      WorkGroup: ATHENA_WORKGROUP,
      ResultConfiguration: {
        OutputLocation: ATHENA_RESULTS_BUCKET,
      },
    })
  );

  const queryExecutionId = startResult.QueryExecutionId!;

  // Poll for completion (max 30 seconds)
  const startTime = Date.now();
  const MAX_WAIT_MS = 30_000;
  const POLL_INTERVAL_MS = 500;

  let state = 'QUEUED';
  let dataScannedBytes = 0;

  while (Date.now() - startTime < MAX_WAIT_MS) {
    const statusResult = await client.send(
      new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId })
    );

    state = statusResult.QueryExecution?.Status?.State || 'UNKNOWN';
    dataScannedBytes =
      statusResult.QueryExecution?.Statistics?.DataScannedInBytes || 0;

    if (state === 'SUCCEEDED') break;
    if (state === 'FAILED' || state === 'CANCELLED') {
      const reason =
        statusResult.QueryExecution?.Status?.StateChangeReason || 'Unknown error';
      throw new Error(`Athena query ${state}: ${reason}`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  if (state !== 'SUCCEEDED') {
    throw new Error(`Athena query timed out after ${MAX_WAIT_MS / 1000}s (state: ${state})`);
  }

  // Fetch results
  const resultsResponse = await client.send(
    new GetQueryResultsCommand({
      QueryExecutionId: queryExecutionId,
      MaxResults: 1000,
    })
  );

  const resultSet: ResultSet = resultsResponse.ResultSet || { Rows: [] };
  const columns = (resultSet.ResultSetMetadata?.ColumnInfo || []).map(
    (col) => col.Name || ''
  );

  // First row is headers, skip it
  const dataRows = (resultSet.Rows || []).slice(1);
  const rows = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    (row.Data || []).forEach((datum, i) => {
      obj[columns[i]] = datum.VarCharValue || '';
    });
    return obj;
  });

  return {
    columns,
    rows,
    queryExecutionId,
    dataScannedBytes,
    executionTimeMs: Date.now() - startTime,
  };
}

// --- Pre-Built Query Functions -----------------------------------------------

/**
 * Top resources by cost within a date range.
 * Returns up to 50 resources sorted by total cost descending.
 */
export async function getResourceCostBreakdown(
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('resourceCostBreakdown', { startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT
      line_item_resource_id AS resource_id,
      line_item_product_code AS service_name,
      product_instance_type AS resource_type,
      product_region AS region,
      SUM(CAST(line_item_unblended_cost AS double)) AS total_cost,
      SUM(CAST(line_item_usage_amount AS double)) AS total_usage,
      pricing_unit AS usage_unit
    FROM "${ATHENA_TABLE}"
    WHERE line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_resource_id != ''
      AND line_item_line_item_type = 'Usage'
    GROUP BY
      line_item_resource_id,
      line_item_product_code,
      product_instance_type,
      product_region,
      pricing_unit
    ORDER BY total_cost DESC
    LIMIT 50
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * Cost history for a specific resource over a date range.
 */
export async function getCostsByResourceId(
  resourceId: string,
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('costsByResourceId', { resourceId, startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT
      DATE(line_item_usage_start_date) AS usage_date,
      line_item_product_code AS service_name,
      line_item_line_item_type AS charge_type,
      SUM(CAST(line_item_unblended_cost AS double)) AS daily_cost,
      SUM(CAST(line_item_usage_amount AS double)) AS daily_usage,
      pricing_unit AS usage_unit
    FROM "${ATHENA_TABLE}"
    WHERE line_item_resource_id = '${resourceId}'
      AND line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
    GROUP BY
      DATE(line_item_usage_start_date),
      line_item_product_code,
      line_item_line_item_type,
      pricing_unit
    ORDER BY usage_date DESC
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * Hourly cost breakdown for a specific date — identifies when spikes happen.
 */
export async function getHourlyCostSpike(date: string): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('hourlyCostSpike', { date });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const endDate = nextDate.toISOString().split('T')[0];

  const sql = `
    SELECT
      DATE_FORMAT(line_item_usage_start_date, '%Y-%m-%d %H:00') AS hour,
      line_item_product_code AS service_name,
      SUM(CAST(line_item_unblended_cost AS double)) AS hourly_cost,
      COUNT(DISTINCT line_item_resource_id) AS resource_count
    FROM "${ATHENA_TABLE}"
    WHERE line_item_usage_start_date >= TIMESTAMP '${date}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_line_item_type = 'Usage'
    GROUP BY
      DATE_FORMAT(line_item_usage_start_date, '%Y-%m-%d %H:00'),
      line_item_product_code
    ORDER BY hourly_cost DESC
    LIMIT 100
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * Cost allocation by a specific tag key (e.g., 'Team', 'Project', 'CostCenter').
 */
export async function getTagCostAllocation(
  tagKey: string,
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('tagCostAllocation', { tagKey, startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  // CUR stores tags as resource_tags_user_<tagkey> (lowercased, underscored)
  const tagColumn = `resource_tags_user_${tagKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const sql = `
    SELECT
      COALESCE("${tagColumn}", 'Untagged') AS tag_value,
      line_item_product_code AS service_name,
      SUM(CAST(line_item_unblended_cost AS double)) AS total_cost,
      COUNT(DISTINCT line_item_resource_id) AS resource_count
    FROM "${ATHENA_TABLE}"
    WHERE line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_line_item_type = 'Usage'
    GROUP BY
      COALESCE("${tagColumn}", 'Untagged'),
      line_item_product_code
    ORDER BY total_cost DESC
    LIMIT 100
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * Cost of resources missing required tags (Environment, Team, CostCenter, Project, Owner).
 */
export async function getUntaggedResourceCosts(
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('untaggedResourceCosts', { startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT
      line_item_resource_id AS resource_id,
      line_item_product_code AS service_name,
      product_instance_type AS resource_type,
      product_region AS region,
      SUM(CAST(line_item_unblended_cost AS double)) AS total_cost,
      CASE
        WHEN resource_tags_user_environment IS NULL OR resource_tags_user_environment = '' THEN 'Missing: Environment'
        WHEN resource_tags_user_team IS NULL OR resource_tags_user_team = '' THEN 'Missing: Team'
        WHEN resource_tags_user_costcenter IS NULL OR resource_tags_user_costcenter = '' THEN 'Missing: CostCenter'
        WHEN resource_tags_user_project IS NULL OR resource_tags_user_project = '' THEN 'Missing: Project'
        WHEN resource_tags_user_owner IS NULL OR resource_tags_user_owner = '' THEN 'Missing: Owner'
        ELSE 'Partial'
      END AS missing_tag
    FROM "${ATHENA_TABLE}"
    WHERE line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_resource_id != ''
      AND line_item_line_item_type = 'Usage'
      AND (
        resource_tags_user_environment IS NULL OR resource_tags_user_environment = ''
        OR resource_tags_user_team IS NULL OR resource_tags_user_team = ''
        OR resource_tags_user_costcenter IS NULL OR resource_tags_user_costcenter = ''
        OR resource_tags_user_project IS NULL OR resource_tags_user_project = ''
        OR resource_tags_user_owner IS NULL OR resource_tags_user_owner = ''
      )
    GROUP BY
      line_item_resource_id,
      line_item_product_code,
      product_instance_type,
      product_region,
      resource_tags_user_environment,
      resource_tags_user_team,
      resource_tags_user_costcenter,
      resource_tags_user_project,
      resource_tags_user_owner
    ORDER BY total_cost DESC
    LIMIT 50
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * Resource-level breakdown within a specific service.
 */
export async function getServiceResourceBreakdown(
  serviceName: string,
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('serviceResourceBreakdown', { serviceName, startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT
      line_item_resource_id AS resource_id,
      product_instance_type AS resource_type,
      product_region AS region,
      line_item_operation AS operation,
      SUM(CAST(line_item_unblended_cost AS double)) AS total_cost,
      SUM(CAST(line_item_usage_amount AS double)) AS total_usage,
      pricing_unit AS usage_unit
    FROM "${ATHENA_TABLE}"
    WHERE line_item_product_code = '${serviceName}'
      AND line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_resource_id != ''
      AND line_item_line_item_type = 'Usage'
    GROUP BY
      line_item_resource_id,
      product_instance_type,
      product_region,
      line_item_operation,
      pricing_unit
    ORDER BY total_cost DESC
    LIMIT 50
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * RI/Savings Plans underutilization — shows wasted commitment spend by resource.
 */
export async function getCommitmentWaste(
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('commitmentWaste', { startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT
      line_item_product_code AS service_name,
      line_item_line_item_type AS charge_type,
      reservation_reservation_a_r_n AS commitment_id,
      SUM(CAST(line_item_unblended_cost AS double)) AS total_cost,
      SUM(CAST(line_item_blended_cost AS double)) AS blended_cost,
      SUM(CAST(line_item_usage_amount AS double)) AS total_usage,
      pricing_unit AS usage_unit,
      COUNT(DISTINCT line_item_resource_id) AS resource_count
    FROM "${ATHENA_TABLE}"
    WHERE line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_line_item_type IN ('RIFee', 'SavingsPlanCoveredUsage', 'SavingsPlanNegation', 'SavingsPlanUpfrontFee', 'SavingsPlanRecurringFee')
    GROUP BY
      line_item_product_code,
      line_item_line_item_type,
      reservation_reservation_a_r_n,
      pricing_unit
    ORDER BY total_cost DESC
    LIMIT 50
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

/**
 * Data transfer costs broken down by resource — identifies top network spenders.
 */
export async function getDataTransferByResource(
  startDate: string,
  endDate: string
): Promise<CurQueryResult> {
  const cacheKey = getCacheKey('dataTransferByResource', { startDate, endDate });
  const cached = getCachedResult(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT
      line_item_resource_id AS resource_id,
      line_item_product_code AS service_name,
      line_item_usage_type AS usage_type,
      product_region AS region,
      SUM(CAST(line_item_unblended_cost AS double)) AS total_cost,
      SUM(CAST(line_item_usage_amount AS double)) AS total_gb,
      'GB' AS usage_unit
    FROM "${ATHENA_TABLE}"
    WHERE line_item_usage_start_date >= TIMESTAMP '${startDate}'
      AND line_item_usage_start_date < TIMESTAMP '${endDate}'
      AND line_item_usage_type LIKE '%DataTransfer%'
      AND line_item_resource_id != ''
    GROUP BY
      line_item_resource_id,
      line_item_product_code,
      line_item_usage_type,
      product_region
    ORDER BY total_cost DESC
    LIMIT 50
  `;

  const result = await executeAthenaQuery(sql);
  setCachedResult(cacheKey, result);
  return result;
}

// --- Query Router (for API endpoint) -----------------------------------------

export interface CurQueryParams {
  queryType: CurQueryType;
  startDate?: string;
  endDate?: string;
  resourceId?: string;
  tagKey?: string;
  serviceName?: string;
  date?: string;
}

/**
 * Route a query request to the appropriate pre-built function.
 */
export async function executeCurQuery(params: CurQueryParams): Promise<CurQueryResult> {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultStart = params.startDate || monthStart.toISOString().split('T')[0];
  const defaultEnd = params.endDate || today.toISOString().split('T')[0];

  switch (params.queryType) {
    case 'resourceCostBreakdown':
      return getResourceCostBreakdown(defaultStart, defaultEnd);

    case 'costsByResourceId':
      if (!params.resourceId) throw new Error('resourceId is required for costsByResourceId');
      return getCostsByResourceId(params.resourceId, defaultStart, defaultEnd);

    case 'hourlyCostSpike':
      if (!params.date) throw new Error('date is required for hourlyCostSpike');
      return getHourlyCostSpike(params.date);

    case 'tagCostAllocation':
      if (!params.tagKey) throw new Error('tagKey is required for tagCostAllocation');
      return getTagCostAllocation(params.tagKey, defaultStart, defaultEnd);

    case 'untaggedResourceCosts':
      return getUntaggedResourceCosts(defaultStart, defaultEnd);

    case 'serviceResourceBreakdown':
      if (!params.serviceName) throw new Error('serviceName is required for serviceResourceBreakdown');
      return getServiceResourceBreakdown(params.serviceName, defaultStart, defaultEnd);

    case 'commitmentWaste':
      return getCommitmentWaste(defaultStart, defaultEnd);

    case 'dataTransferByResource':
      return getDataTransferByResource(defaultStart, defaultEnd);

    default:
      throw new Error(`Unknown query type: ${params.queryType}`);
  }
}

// --- Health Check -----------------------------------------------------------

/**
 * Verify CUR + Athena connectivity by running a simple count query.
 */
export async function checkCurAvailability(): Promise<{
  available: boolean;
  database: string;
  table: string;
  workgroup: string;
  error?: string;
}> {
  try {
    const sql = `SELECT COUNT(*) as row_count FROM "${ATHENA_TABLE}" LIMIT 1`;
    const result = await executeAthenaQuery(sql);
    return {
      available: true,
      database: ATHENA_DATABASE,
      table: ATHENA_TABLE,
      workgroup: ATHENA_WORKGROUP,
    };
  } catch (error) {
    return {
      available: false,
      database: ATHENA_DATABASE,
      table: ATHENA_TABLE,
      workgroup: ATHENA_WORKGROUP,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
