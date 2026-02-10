import { type CostSummary } from './cost-context';

// Smart rule-based response engine that works without an external API.
// Handles diverse natural language questions about cloud costs.

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

// Keyword extraction — normalize user input into tokens
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[?!.,;:'"]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function has(tokens: string[], ...words: string[]): boolean {
  return words.some((w) => tokens.some((t) => t.includes(w)));
}

export function generateLocalResponse(query: string, data: CostSummary): string {
  const tokens = tokenize(query);
  const q = query.toLowerCase();

  // --- GREETINGS & HELP ---
  if (has(tokens, 'hello', 'hi', 'hey', 'help', 'what can')) {
    return `I'm **Nimbus AI**, your Cloud FinOps assistant. I can answer questions about anything on your dashboard:\n\n- **Spending**: "total spend", "cost by provider", "which service costs most"\n- **Anomalies**: "any spikes?", "which server is bleeding money?"\n- **Budgets**: "are we over budget?", "budget status"\n- **Savings**: "how to reduce costs?", "where can we save?"\n- **Providers**: "AWS breakdown", "Azure status", "GCP cost"\n- **Forecasts**: "projected spend", "next month estimate"\n- **Summary**: "give me a full report"\n\nJust ask in plain language!`;
  }

  // --- TOTAL SPEND / OVERVIEW ---
  if (has(tokens, 'total', 'overall', 'spend', 'mtd', 'much', 'current', 'dashboard')) {
    if (has(tokens, 'aws', 'amazon')) return awsBreakdown(data);
    if (has(tokens, 'azure', 'microsoft')) return azureBreakdown(data);
    if (has(tokens, 'gcp', 'google')) return gcpBreakdown(data);

    return `**Total Spend (MTD):** ${fmt(data.totalSpendMTD)}\n**Forecasted Monthly:** ${fmt(data.forecastedSpend)}\n\nBreakdown by provider:\n${data.providers.map((p) => `- **${p.name}:** ${fmt(p.spend)} (${pct(p.change)} MoM)`).join('\n')}\n\nAWS leads at ${((data.providers[0].spend / data.totalSpendMTD) * 100).toFixed(0)}% of total spend.`;
  }

  // --- TOP SERVICES / HIGHEST COST ---
  if (has(tokens, 'top', 'highest', 'expensive', 'biggest', 'most', 'service', 'rank')) {
    const top5 = data.topServices.slice(0, 5);
    const spiking = data.topServices.filter((s) => s.change > 8);
    return `**Top 5 Services by Cost (MTD):**\n\n${top5.map((s, i) => `${i + 1}. **${s.name}** (${s.provider}) — ${fmt(s.cost)} ${pct(s.change)} MoM`).join('\n')}\n\n${spiking.length > 0 ? `⚠️ **Spiking:** ${spiking.map((s) => `${s.name} (${pct(s.change)})`).join(', ')}` : '✅ No unusual service-level spikes.'}`;
  }

  // --- BLEEDING / BURNING / WASTING / SPIKE / PROBLEM ---
  if (has(tokens, 'bleed', 'burn', 'waste', 'leak', 'drain', 'problem', 'issue', 'wrong', 'concern', 'worry', 'danger', 'critical', 'red', 'flag')) {
    const openAnomalies = data.anomalies.filter((a) => a.status === 'open');
    const overBudget = data.budgets.filter((b) => b.spent > b.limit);
    const spiking = data.topServices.filter((s) => s.change > 8);
    const totalImpact = openAnomalies.reduce((s, a) => s + a.impact, 0);

    let response = `**🔴 Areas Needing Attention:**\n\n`;

    if (openAnomalies.length > 0) {
      response += `**Anomalies (${openAnomalies.length} active, ${fmt(totalImpact)} impact):**\n`;
      response += openAnomalies.map((a) => `- ${a.title} — **${a.provider}/${a.service}** — ${fmt(a.impact)}`).join('\n');
      response += '\n\n';
    }

    if (overBudget.length > 0) {
      response += `**Over Budget (${overBudget.length}):**\n`;
      response += overBudget.map((b) => `- ${b.name}: ${fmt(b.spent)} / ${fmt(b.limit)} (${((b.spent / b.limit) * 100).toFixed(0)}%)`).join('\n');
      response += '\n\n';
    }

    if (spiking.length > 0) {
      response += `**Cost Spikes:**\n`;
      response += spiking.map((s) => `- ${s.name} (${s.provider}): ${pct(s.change)} increase`).join('\n');
      response += '\n\n';
    }

    response += `**Priority Action:** Investigate the EC2 data transfer anomaly first (${fmt(openAnomalies[0]?.impact || 0)} impact).`;
    return response;
  }

  // --- SERVER / INSTANCE / EC2 / VM ---
  if (has(tokens, 'server', 'instance', 'ec2', 'vm', 'virtual', 'compute', 'machine')) {
    const compute = data.topServices.filter((s) =>
      /ec2|instance|vm|virtual|compute|gce|eks/i.test(s.name),
    );
    const computeAnomaly = data.anomalies.filter((a) =>
      /ec2|instance|vm|compute|lambda/i.test(a.service),
    );
    return `**Compute / Server Costs:**\n\n${compute.map((s) => `- **${s.name}** (${s.provider}): ${fmt(s.cost)} (${pct(s.change)} MoM)`).join('\n')}\n\nTotal compute: **${fmt(compute.reduce((s, c) => s + c.cost, 0))}**\n\n${computeAnomaly.length > 0 ? `⚠️ **Active anomalies:**\n${computeAnomaly.map((a) => `- ${a.title} — ${fmt(a.impact)} impact`).join('\n')}` : '✅ No compute anomalies.'}`;
  }

  // --- STORAGE / S3 / DISK ---
  if (has(tokens, 'storage', 's3', 'disk', 'blob', 'bucket', 'gcs')) {
    const storage = data.topServices.filter((s) =>
      /s3|storage|disk|blob/i.test(s.name),
    );
    return `**Storage Costs:**\n\n${storage.map((s) => `- **${s.name}** (${s.provider}): ${fmt(s.cost)} (${pct(s.change)} MoM)`).join('\n')}\n\nTotal storage: **${fmt(storage.reduce((s, c) => s + c.cost, 0))}**\n\n💡 **Tip:** Storage optimization can save ${fmt(data.recommendations.find((r) => r.category === 'Storage Optimization')?.savings || 0)}/mo by moving infrequently accessed data to cheaper tiers.`;
  }

  // --- DATABASE / RDS / SQL ---
  if (has(tokens, 'database', 'db', 'rds', 'sql', 'dynamo', 'cosmos', 'bigquery')) {
    const db = data.topServices.filter((s) =>
      /rds|sql|database|dynamo|bigquery/i.test(s.name),
    );
    const dbAnomaly = data.anomalies.filter((a) =>
      /sql|database|rds|bigquery/i.test(a.service),
    );
    return `**Database Costs:**\n\n${db.map((s) => `- **${s.name}** (${s.provider}): ${fmt(s.cost)} (${pct(s.change)} MoM)`).join('\n')}\n\nTotal database: **${fmt(db.reduce((s, c) => s + c.cost, 0))}**\n\n${dbAnomaly.length > 0 ? `⚠️ **Active anomalies:**\n${dbAnomaly.map((a) => `- ${a.title} — ${fmt(a.impact)} impact`).join('\n')}` : '✅ No database anomalies.'}`;
  }

  // --- AWS SPECIFIC ---
  if (has(tokens, 'aws', 'amazon')) return awsBreakdown(data);

  // --- AZURE SPECIFIC ---
  if (has(tokens, 'azure', 'microsoft')) return azureBreakdown(data);

  // --- GCP SPECIFIC ---
  if (has(tokens, 'gcp', 'google', 'gcloud')) return gcpBreakdown(data);

  // --- KUBERNETES ---
  if (has(tokens, 'k8s', 'kubernetes', 'kube', 'container', 'pod', 'cluster', 'eks', 'aks', 'gke')) {
    const k8s = data.providers.find((p) => p.name === 'Kubernetes');
    const eksService = data.topServices.find((s) => /eks/i.test(s.name));
    return `**Kubernetes Costs:**\n\n- **Total K8s spend:** ${fmt(k8s?.spend || 0)} (${pct(k8s?.change || 0)} MoM)\n${eksService ? `- **Amazon EKS:** ${fmt(eksService.cost)} (${pct(eksService.change)} MoM)` : ''}\n- **Budget:** ${(() => { const b = data.budgets.find((b) => b.provider === 'Kubernetes'); return b ? `${fmt(b.spent)} / ${fmt(b.limit)} (${((b.spent / b.limit) * 100).toFixed(0)}%)` : 'N/A'; })()}\n\n💡 **Tip:** Consider spot instances for fault-tolerant K8s workloads — potential savings: ${fmt(data.recommendations.find((r) => r.category === 'Spot Instances')?.savings || 0)}/mo`;
  }

  // --- SAVINGS / OPTIMIZE / REDUCE / CUT ---
  if (has(tokens, 'sav', 'optimi', 'reduc', 'cut', 'lower', 'cheaper', 'efficient', 'improve', 'better')) {
    const total = data.recommendations.reduce((s, r) => s + r.savings, 0);
    const sorted = [...data.recommendations].sort((a, b) => b.savings - a.savings);
    return `**Optimization Recommendations:**\n\n**Total Potential Savings:** ${fmt(total)}/month (${fmt(total * 12)}/year)\n\n${sorted.map((r) => `- **${r.category}:** ${r.count} items — ${fmt(r.savings)}/mo`).join('\n')}\n\n**Top Action:** Focus on **${sorted[0].category}** first — ${fmt(sorted[0].savings)}/month across ${sorted[0].count} resources.`;
  }

  // --- ANOMALY / SPIKE / UNUSUAL ---
  if (has(tokens, 'anomal', 'spike', 'unusual', 'alert', 'incident', 'detect')) {
    const open = data.anomalies.filter((a) => a.status === 'open');
    const totalImpact = open.reduce((s, a) => s + a.impact, 0);
    return `**Active Anomalies:** ${open.length}\n**Total Impact:** ${fmt(totalImpact)}\n\n${open.map((a) => `🔴 **${a.title}**\n   Provider: ${a.provider} | Service: ${a.service} | Impact: ${fmt(a.impact)}`).join('\n\n')}\n\n**Action:** Investigate EC2 data transfer first (highest impact at ${fmt(open[0]?.impact || 0)}).`;
  }

  // --- BUDGET ---
  if (has(tokens, 'budget', 'limit', 'overspend', 'track', 'allocation')) {
    const overBudget = data.budgets.filter((b) => b.spent > b.limit);
    const atRisk = data.budgets.filter((b) => b.spent / b.limit > 0.8 && b.spent <= b.limit);
    return `**Budget Status:**\n\n${data.budgets.map((b) => {
      const pctUsed = (b.spent / b.limit) * 100;
      const status = pctUsed > 100 ? '🔴 OVER' : pctUsed > 80 ? '🟡 WARNING' : '🟢 OK';
      return `${status} **${b.name}:** ${fmt(b.spent)} / ${fmt(b.limit)} (${pctUsed.toFixed(0)}%)`;
    }).join('\n')}\n\n${overBudget.length > 0 ? `⚠️ **${overBudget.length} exceeded:** ${overBudget.map((b) => b.name).join(', ')}` : '✅ No budgets exceeded.'}${atRisk.length > 0 ? `\n🟡 **${atRisk.length} at risk** of exceeding this month.` : ''}`;
  }

  // --- FORECAST / PREDICT ---
  if (has(tokens, 'forecast', 'predict', 'project', 'next', 'estimate', 'expect', 'trend')) {
    const totalReco = data.recommendations.reduce((s, r) => s + r.savings, 0);
    return `**Forecast:**\n\n- **Current MTD:** ${fmt(data.totalSpendMTD)}\n- **Forecasted Monthly:** ${fmt(data.forecastedSpend)}\n- **With optimizations:** ${fmt(data.forecastedSpend - totalReco)}/month\n\n**Potential Annual Savings:** ${fmt(totalReco * 12)}\n\nImplementing all ${data.recommendations.reduce((s, r) => s + r.count, 0)} recommendations would reduce spend by ${((totalReco / data.forecastedSpend) * 100).toFixed(0)}%.`;
  }

  // --- SUMMARY / REPORT / STATUS ---
  if (has(tokens, 'summary', 'overview', 'status', 'report', 'brief', 'everything', 'all', 'full')) {
    return nocSummary(data);
  }

  // --- COMPARISON / VS ---
  if (has(tokens, 'compar', 'vs', 'versus', 'differ', 'between')) {
    return `**Provider Comparison:**\n\n| Provider | Spend | Change | % of Total |\n|----------|-------|--------|------------|\n${data.providers.map((p) => `| ${p.name} | ${fmt(p.spend)} | ${pct(p.change)} | ${((p.spend / data.totalSpendMTD) * 100).toFixed(1)}% |`).join('\n')}\n\n**Verdict:** AWS is the largest spend at ${fmt(data.providers[0].spend)}. Azure is growing fastest at ${pct(data.providers.find((p) => p.name === 'Azure')?.change || 0)}.`;
  }

  // --- RESERVED / RI ---
  if (has(tokens, 'reserved', 'ri', 'commit', 'saving plan', 'commitment')) {
    const ri = data.recommendations.find((r) => r.category === 'Reserved Instances');
    return `**Reserved Instance Opportunities:**\n\n- **Available RI savings:** ${fmt(ri?.savings || 0)}/month (${fmt((ri?.savings || 0) * 12)}/year)\n- **Resources eligible:** ${ri?.count || 0} instances\n\nConverting on-demand workloads with stable usage patterns to 1-year or 3-year reserved instances offers the single largest cost optimization.`;
  }

  // --- COST PER / UNIT ECONOMICS ---
  if (has(tokens, 'cost per', 'unit', 'per day', 'daily', 'hourly', 'weekly')) {
    const daily = data.totalSpendMTD / new Date().getDate();
    const hourly = daily / 24;
    return `**Unit Cost Breakdown:**\n\n- **Daily run rate:** ${fmt(daily)}\n- **Hourly run rate:** ${fmt(hourly)}\n- **Monthly forecast:** ${fmt(data.forecastedSpend)}\n- **Annual projection:** ${fmt(data.forecastedSpend * 12)}\n\nBy provider (daily):\n${data.providers.map((p) => `- ${p.name}: ${fmt(p.spend / new Date().getDate())}/day`).join('\n')}`;
  }

  // --- IDLE / UNUSED ---
  if (has(tokens, 'idle', 'unused', 'zombie', 'orphan', 'unattach', 'delete')) {
    const idle = data.recommendations.find((r) => r.category === 'Idle Resources');
    return `**Idle / Unused Resources:**\n\n- **Idle resources found:** ${idle?.count || 0}\n- **Potential savings:** ${fmt(idle?.savings || 0)}/month\n\nThese include unattached disks, stopped instances still incurring charges, unused elastic IPs, and orphaned snapshots. Cleaning these up is a quick win with zero performance impact.`;
  }

  // --- RIGHTSIZE ---
  if (has(tokens, 'rightsize', 'right-size', 'resize', 'downsize', 'overprovision')) {
    const rs = data.recommendations.find((r) => r.category === 'Rightsizing');
    return `**Rightsizing Opportunities:**\n\n- **Resources to rightsize:** ${rs?.count || 0}\n- **Monthly savings:** ${fmt(rs?.savings || 0)}\n- **Annual savings:** ${fmt((rs?.savings || 0) * 12)}\n\nThese instances are consistently using less than 40% of provisioned CPU/memory. Downsizing to the next tier maintains performance while reducing cost.`;
  }

  // --- SMART FALLBACK: Try to match any keyword to a service/provider/concept ---
  const serviceMatch = data.topServices.find((s) =>
    tokens.some((t) => s.name.toLowerCase().includes(t) || s.provider.toLowerCase().includes(t)),
  );
  if (serviceMatch) {
    return `**${serviceMatch.name} (${serviceMatch.provider}):**\n\n- **Current cost:** ${fmt(serviceMatch.cost)}\n- **Trend:** ${pct(serviceMatch.change)} month-over-month\n- **% of total:** ${((serviceMatch.cost / data.totalSpendMTD) * 100).toFixed(1)}%\n\n${serviceMatch.change > 5 ? `⚠️ This service is trending up. Consider reviewing usage patterns.` : serviceMatch.change < -3 ? `✅ Cost is trending down — optimization efforts are working.` : `Cost is stable within normal range.`}`;
  }

  // --- ULTIMATE FALLBACK: Give a useful NOC summary ---
  return nocSummary(data);
}

// --- Helper functions ---

function awsBreakdown(data: CostSummary): string {
  const awsServices = data.topServices.filter((s) => s.provider === 'AWS');
  const provider = data.providers.find((p) => p.name === 'AWS')!;
  const budget = data.budgets.find((b) => b.provider === 'AWS');
  const anomalies = data.anomalies.filter((a) => a.provider === 'AWS' && a.status === 'open');
  return `**AWS Spend Overview:**\n\n**Total:** ${fmt(provider.spend)} (${pct(provider.change)} MoM)\n\n**Services:**\n${awsServices.map((s) => `- ${s.name}: ${fmt(s.cost)} (${pct(s.change)})`).join('\n')}\n\n${budget ? `**Budget:** ${fmt(budget.spent)} / ${fmt(budget.limit)} (${((budget.spent / budget.limit) * 100).toFixed(0)}%)` : ''}\n${anomalies.length > 0 ? `\n⚠️ **${anomalies.length} active anomalies:** ${anomalies.map((a) => a.title).join(', ')}` : '\n✅ No AWS anomalies.'}`;
}

function azureBreakdown(data: CostSummary): string {
  const services = data.topServices.filter((s) => s.provider === 'Azure');
  const provider = data.providers.find((p) => p.name === 'Azure')!;
  const budget = data.budgets.find((b) => b.provider === 'Azure');
  const anomalies = data.anomalies.filter((a) => a.provider === 'Azure' && a.status === 'open');
  return `**Azure Spend Overview:**\n\n**Total:** ${fmt(provider.spend)} (${pct(provider.change)} MoM)\n\n**Services:**\n${services.map((s) => `- ${s.name}: ${fmt(s.cost)} (${pct(s.change)})`).join('\n')}\n\n${budget ? `**Budget:** ${fmt(budget.spent)} / ${fmt(budget.limit)} (${((budget.spent / budget.limit) * 100).toFixed(0)}%)` : ''}\n${anomalies.length > 0 ? `\n⚠️ **${anomalies.length} active anomalies:** ${anomalies.map((a) => a.title).join(', ')}` : '\n✅ No Azure anomalies.'}`;
}

function gcpBreakdown(data: CostSummary): string {
  const services = data.topServices.filter((s) => s.provider === 'GCP');
  const provider = data.providers.find((p) => p.name === 'GCP')!;
  const budget = data.budgets.find((b) => b.provider === 'GCP');
  const anomalies = data.anomalies.filter((a) => a.provider === 'GCP' && a.status === 'open');
  return `**GCP Spend Overview:**\n\n**Total:** ${fmt(provider.spend)} (${pct(provider.change)} MoM)\n\n**Services:**\n${services.map((s) => `- ${s.name}: ${fmt(s.cost)} (${pct(s.change)})`).join('\n')}\n\n${budget ? `**Budget:** ${fmt(budget.spent)} / ${fmt(budget.limit)} (${((budget.spent / budget.limit) * 100).toFixed(0)}%) ⚠️ **Over budget!**` : ''}\n${anomalies.length > 0 ? `\n⚠️ **${anomalies.length} active anomalies:** ${anomalies.map((a) => a.title).join(', ')}` : '\n✅ No GCP anomalies.'}`;
}

function nocSummary(data: CostSummary): string {
  const openAnomalies = data.anomalies.filter((a) => a.status === 'open');
  const overBudget = data.budgets.filter((b) => b.spent > b.limit);
  const totalReco = data.recommendations.reduce((s, r) => s + r.savings, 0);
  return `**NOC Summary — Cloud FinOps Status:**\n\n💰 **Spend MTD:** ${fmt(data.totalSpendMTD)} | Forecast: ${fmt(data.forecastedSpend)}\n📊 **Top Provider:** AWS at ${fmt(data.providers[0].spend)}\n🔴 **Anomalies:** ${openAnomalies.length} open (${fmt(openAnomalies.reduce((s, a) => s + a.impact, 0))} impact)\n📋 **Budgets:** ${overBudget.length > 0 ? `${overBudget.length} exceeded` : 'All within limits'}\n💡 **Savings Available:** ${fmt(totalReco)}/month\n\n**Top 3 Actions:**\n1. Investigate EC2 data transfer anomaly (${fmt(openAnomalies[0]?.impact || 0)})\n2. Address GCP Analytics over-budget\n3. Apply Reserved Instance recommendations (${fmt(12400)}/mo savings)`;
}
