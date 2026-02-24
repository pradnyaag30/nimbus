export type Framework = 'RBI' | 'SEBI' | 'SOC2' | 'PCI_DSS';
export type CheckSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CheckResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'ERROR';

export interface ComplianceCheckDef {
  controlId: string;
  controlName: string;
  description: string;
  frameworks: Framework[];
  severity: CheckSeverity;
  category: string;
  resourceType: string;
  provider: 'AWS' | 'AZURE' | 'GCP';
  remediation: string;
  evaluate: (context: EvalContext) => CheckResult;
}

export interface EvalContext {
  awsConnected: boolean;
  trustedAdvisorChecks?: Array<{ name: string; status: string }>;
  resources?: Array<{ type: string; region: string; tags: Record<string, string>; metadata: Record<string, unknown> }>;
}

export interface ComplianceCheckResult {
  controlId: string;
  controlName: string;
  description: string;
  category: string;
  framework: Framework;
  severity: CheckSeverity;
  status: CheckResult;
  resourceId?: string;
  resourceType: string;
  provider: string;
  remediation: string;
  lastEvaluatedAt: string;
}

export interface FrameworkScore {
  framework: Framework;
  label: string;
  total: number;
  passed: number;
  failed: number;
  notApplicable: number;
  score: number;
}
