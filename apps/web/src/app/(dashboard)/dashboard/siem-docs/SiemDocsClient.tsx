'use client';

import { FileText } from 'lucide-react';

const queryParams = [
  { name: 'since', type: 'string', default: 'none', description: 'ISO 8601 date. Returns logs created after this timestamp.' },
  { name: 'limit', type: 'number', default: '100', description: 'Number of records to return (1-1000).' },
  { name: 'cursor', type: 'string', default: 'none', description: 'Pagination token from a previous response to fetch the next page.' },
  { name: 'category', type: 'string', default: 'none', description: 'Filter by audit category: AUTH, USER_ADMIN, POLICY_ADMIN, CONFIG_ADMIN, SENSITIVE_READ.' },
];

const auditActions = [
  { action: 'LOGIN_SUCCESS', description: 'User successfully authenticated.' },
  { action: 'LOGIN_FAILED', description: 'Failed authentication attempt.' },
  { action: 'LOGOUT', description: 'User logged out.' },
  { action: 'USER_CREATED', description: 'New user account was created.' },
  { action: 'USER_INVITED', description: 'User was invited to the platform.' },
  { action: 'ROLE_CHANGED', description: 'User role was modified (e.g., VIEWER to EDITOR).' },
  { action: 'USER_DISABLED', description: 'User account was deactivated.' },
  { action: 'USER_ENABLED', description: 'User account was reactivated.' },
  { action: 'POLICY_CREATED', description: 'New governance policy was created.' },
  { action: 'POLICY_UPDATED', description: 'Existing governance policy was modified.' },
  { action: 'POLICY_DELETED', description: 'Governance policy was removed.' },
  { action: 'SETTINGS_CHANGED', description: 'System or tenant configuration was updated.' },
  { action: 'CLOUD_ACCOUNT_ADDED', description: 'New cloud provider account was connected.' },
  { action: 'CLOUD_ACCOUNT_REMOVED', description: 'Cloud provider account was disconnected.' },
  { action: 'MASTER_DATA_CHANGED', description: 'Cost center or business unit master data was modified.' },
  { action: 'COST_DATA_EXPORTED', description: 'Cost data was exported to CSV or other format.' },
  { action: 'COMPLIANCE_VIEWED', description: 'Compliance dashboard or report was accessed.' },
  { action: 'AUDIT_LOG_ACCESSED', description: 'Audit log records were viewed or queried.' },
  { action: 'REPORT_GENERATED', description: 'Scheduled or ad-hoc report was generated.' },
];

const responseExample = `{
  "logs": [
    {
      "id": "audit_42",
      "tenantId": "default",
      "userId": "usr_abc123",
      "userEmail": "admin@finops.ai",
      "userRole": "FINOPS_ADMIN",
      "action": "LOGIN_SUCCESS",
      "category": "AUTH",
      "targetType": null,
      "targetId": null,
      "metadata": { "ip": "10.0.1.55", "userAgent": "Mozilla/5.0..." },
      "createdAt": "2026-02-24T08:30:00.000Z"
    }
  ],
  "total": 1542,
  "cursor": "audit_42",
  "hasMore": true
}`;

const curlExample = `curl -s -H "Authorization: Bearer YOUR_SIEM_API_KEY" \\
  "https://your-finops-host/api/siem/audit-logs?since=2026-02-01T00:00:00Z&limit=50&category=AUTH"`;

export function SiemDocsClient() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SIEM API Documentation</h1>
          <p className="text-sm text-muted-foreground">
            Integrate FinOps AI audit logs with your SIEM platform (Splunk, QRadar, Sentinel, etc.)
          </p>
        </div>
      </div>

      {/* Endpoint */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Endpoint</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <code className="font-mono text-sm">
            <span className="font-bold text-green-600 dark:text-green-400">GET</span>{' '}
            /api/siem/audit-logs
          </code>
        </div>
        <p className="text-sm text-muted-foreground">
          Returns paginated audit log entries in JSON format. Supports filtering by time range,
          category, and cursor-based pagination for large result sets.
        </p>
      </section>

      {/* Authentication */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Authentication</h2>
        <p className="text-sm text-muted-foreground">
          All requests must include a valid API key in the Authorization header. The API key is
          configured via the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">SIEM_API_KEY</code> environment
          variable or in the tenant configuration.
        </p>
        <div className="rounded-lg bg-muted/50 p-4">
          <code className="font-mono text-sm">Authorization: Bearer &lt;your-api-key&gt;</code>
        </div>
        <p className="text-sm text-muted-foreground">
          Requests with an invalid or missing API key will receive a <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">401 Unauthorized</code> response.
        </p>
      </section>

      {/* Query Parameters */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Query Parameters</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Parameter</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Default</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {queryParams.map((param) => (
                <tr key={param.name} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{param.name}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{param.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{param.default}</td>
                  <td className="px-4 py-3 text-muted-foreground">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Response Format */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Response Format</h2>
        <p className="text-sm text-muted-foreground">
          The response includes the log entries, total count, pagination cursor, and a flag
          indicating whether more results are available. Custom headers{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">X-Total-Count</code> and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">X-Has-More</code> are also included.
        </p>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed">{responseExample}</pre>
        </div>
      </section>

      {/* Example Request */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Example Request</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed">{curlExample}</pre>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Rate Limits</h2>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">!</span>
            </div>
            <div>
              <p className="text-sm font-medium">1,000 requests per minute</p>
              <p className="text-xs text-muted-foreground">
                Exceeding this limit will result in a <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">429 Too Many Requests</code> response.
                Implement exponential backoff in your SIEM collector.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Actions Reference */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Actions Reference</h2>
        <p className="text-sm text-muted-foreground">
          The following audit actions are tracked by FinOps AI. Use these values for filtering and
          alert rule configuration in your SIEM platform.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {auditActions.map((item) => (
                <tr key={item.action} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{item.action}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Integration Notes */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Integration Notes</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>
            Configure your SIEM collector to poll this endpoint at a regular interval (e.g., every
            60 seconds).
          </li>
          <li>
            Use the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">since</code> parameter
            with the timestamp of the last received log to avoid duplicates.
          </li>
          <li>
            Use the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">cursor</code> parameter
            to paginate through large result sets within a single polling cycle.
          </li>
          <li>
            All timestamps are in ISO 8601 format (UTC).
          </li>
          <li>
            For compliance requirements (RBI, SEBI, SOC 2), retain audit logs for a minimum of
            3 years.
          </li>
        </ul>
      </section>
    </div>
  );
}
