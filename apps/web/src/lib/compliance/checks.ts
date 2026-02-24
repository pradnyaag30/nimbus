import { COMPLIANCE_CHECKS, FRAMEWORK_LABELS } from './frameworks';
import type { ComplianceCheckResult, EvalContext, Framework, FrameworkScore } from './types';

export function runComplianceChecks(context: EvalContext): ComplianceCheckResult[] {
  const results: ComplianceCheckResult[] = [];
  const now = new Date().toISOString();

  for (const check of COMPLIANCE_CHECKS) {
    const status = check.evaluate(context);

    for (const framework of check.frameworks) {
      results.push({
        controlId: check.controlId,
        controlName: check.controlName,
        description: check.description,
        category: check.category,
        framework,
        severity: check.severity,
        status,
        resourceType: check.resourceType,
        provider: check.provider,
        remediation: check.remediation,
        lastEvaluatedAt: now,
      });
    }
  }

  return results;
}

export function computeFrameworkScores(results: ComplianceCheckResult[]): FrameworkScore[] {
  const frameworks: Framework[] = ['RBI', 'SEBI', 'SOC2', 'PCI_DSS'];

  return frameworks.map((fw) => {
    const checks = results.filter((r) => r.framework === fw);
    const applicable = checks.filter((r) => r.status !== 'NOT_APPLICABLE');
    const passed = applicable.filter((r) => r.status === 'PASS').length;
    const failed = applicable.filter((r) => r.status === 'FAIL').length;
    const total = applicable.length;

    return {
      framework: fw,
      label: FRAMEWORK_LABELS[fw] || fw,
      total,
      passed,
      failed,
      notApplicable: checks.length - applicable.length,
      score: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  });
}
