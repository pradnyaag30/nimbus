import { PrismaClient, CloudProvider, ChargeCategory, Severity, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'default',
      primaryColor: '#3B82F6',
      currency: 'USD',
    },
  });

  // Create admin user (password: nimbus2024)
  // In production, use bcrypt hashed passwords
  await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@nimbus.dev', tenantId: tenant.id } },
    update: {},
    create: {
      email: 'admin@nimbus.dev',
      name: 'Admin User',
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  });

  // Create sample cloud accounts
  const awsAccount = await prisma.cloudAccount.upsert({
    where: {
      tenantId_provider_externalId: {
        tenantId: tenant.id,
        provider: CloudProvider.AWS,
        externalId: '123456789012',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Production AWS',
      provider: CloudProvider.AWS,
      externalId: '123456789012',
      credentialsEnc: 'placeholder-encrypted',
      status: 'CONNECTED',
      lastSyncAt: new Date(),
    },
  });

  const azureAccount = await prisma.cloudAccount.upsert({
    where: {
      tenantId_provider_externalId: {
        tenantId: tenant.id,
        provider: CloudProvider.AZURE,
        externalId: 'sub-abc-def-123',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Azure Enterprise',
      provider: CloudProvider.AZURE,
      externalId: 'sub-abc-def-123',
      credentialsEnc: 'placeholder-encrypted',
      status: 'CONNECTED',
      lastSyncAt: new Date(),
    },
  });

  // Seed sample cost line items (last 3 months)
  const now = new Date();
  const services = [
    { service: 'Amazon EC2', provider: CloudProvider.AWS, category: 'Compute', account: awsAccount },
    { service: 'Amazon S3', provider: CloudProvider.AWS, category: 'Storage', account: awsAccount },
    { service: 'Amazon RDS', provider: CloudProvider.AWS, category: 'Database', account: awsAccount },
    { service: 'Azure Virtual Machines', provider: CloudProvider.AZURE, category: 'Compute', account: azureAccount },
    { service: 'Azure SQL Database', provider: CloudProvider.AZURE, category: 'Database', account: azureAccount },
  ];

  const lineItems = [];
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);

    for (const svc of services) {
      const baseCost = 1000 + Math.random() * 5000;
      lineItems.push({
        tenantId: tenant.id,
        cloudAccountId: svc.account.id,
        billingPeriodStart: start,
        billingPeriodEnd: end,
        chargeCategory: ChargeCategory.USAGE,
        chargeType: 'Usage',
        billedCost: baseCost,
        effectiveCost: baseCost * 0.92,
        billingCurrency: 'USD',
        serviceCategory: svc.category,
        serviceName: svc.service,
        regionId: svc.provider === CloudProvider.AWS ? 'us-east-1' : 'eastus',
        regionName: svc.provider === CloudProvider.AWS ? 'US East (N. Virginia)' : 'East US',
        providerName: svc.provider,
        tags: { environment: 'production', team: 'platform' },
      });
    }
  }

  await prisma.costLineItem.createMany({
    data: lineItems,
    skipDuplicates: true,
  });

  // Seed recommendations
  await prisma.recommendation.createMany({
    data: [
      {
        tenantId: tenant.id,
        category: 'RIGHTSIZING',
        title: 'Rightsize underutilized EC2 instances',
        description: '12 EC2 instances have average CPU utilization below 10% over the past 14 days. Consider downsizing to smaller instance types.',
        provider: CloudProvider.AWS,
        resourceIds: ['i-0abc123', 'i-0def456'],
        estimatedSavings: 2840,
        severity: Severity.HIGH,
      },
      {
        tenantId: tenant.id,
        category: 'IDLE_RESOURCES',
        title: 'Delete unattached Azure managed disks',
        description: '8 managed disks are not attached to any virtual machine and have been idle for over 30 days.',
        provider: CloudProvider.AZURE,
        resourceIds: ['disk-001', 'disk-002'],
        estimatedSavings: 1560,
        severity: Severity.MEDIUM,
      },
      {
        tenantId: tenant.id,
        category: 'RESERVED_INSTANCES',
        title: 'Convert on-demand EC2 to Reserved Instances',
        description: '5 EC2 instances have been running consistently for 6+ months and would benefit from 1-year RI commitment.',
        provider: CloudProvider.AWS,
        resourceIds: ['i-0ghi789'],
        estimatedSavings: 4200,
        severity: Severity.HIGH,
      },
    ],
    skipDuplicates: true,
  });

  // Seed budgets
  await prisma.budget.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'AWS Production',
        amount: 25000,
        period: 'MONTHLY',
        provider: CloudProvider.AWS,
      },
      {
        tenantId: tenant.id,
        name: 'Azure Development',
        amount: 10000,
        period: 'MONTHLY',
        provider: CloudProvider.AZURE,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
