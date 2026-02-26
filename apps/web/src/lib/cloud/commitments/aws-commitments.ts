import type { CommitmentItemData } from './types';

// AWS Savings Plans: @aws-sdk/client-savingsplans (DescribeSavingsPlansCommand)
// AWS Reserved Instances: @aws-sdk/client-ec2 (DescribeReservedInstancesCommand)
//
// In production, install the SDKs and call the APIs directly.
// For demo mode, we return realistic sample data.

// --- Demo Data ---------------------------------------------------------------

function generateDemoSavingsPlans(): CommitmentItemData[] {
  const now = new Date();

  return [
    {
      provider: 'AWS',
      commitmentType: 'SAVINGS_PLAN',
      commitmentId: 'sp-0a1b2c3d4e5f6',
      commitmentName: 'Compute Savings Plan (1yr)',
      serviceType: 'ComputeSavingsPlans',
      instanceFamily: null,
      region: 'us-east-1',
      term: '1yr',
      paymentOption: 'NoUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 185 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 0.50,
      upfrontCost: 0,
      utilizationPercent: 87.3,
      metadata: { savingsPlanId: 'sp-0a1b2c3d4e5f6', currency: 'USD' },
    },
    {
      provider: 'AWS',
      commitmentType: 'SAVINGS_PLAN',
      commitmentId: 'sp-7g8h9i0j1k2l3',
      commitmentName: 'EC2 Instance Savings Plan (3yr)',
      serviceType: 'EC2InstanceSavingsPlans',
      instanceFamily: 'm5',
      region: 'ap-south-1',
      term: '3yr',
      paymentOption: 'PartialUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 1.20,
      upfrontCost: 5256,
      utilizationPercent: 92.1,
      metadata: { savingsPlanId: 'sp-7g8h9i0j1k2l3', currency: 'USD' },
    },
    {
      provider: 'AWS',
      commitmentType: 'SAVINGS_PLAN',
      commitmentId: 'sp-4m5n6o7p8q9r0',
      commitmentName: 'SageMaker Savings Plan (1yr)',
      serviceType: 'SageMakerSavingsPlans',
      instanceFamily: null,
      region: 'us-east-1',
      term: '1yr',
      paymentOption: 'AllUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 65 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 0.25,
      upfrontCost: 2190,
      utilizationPercent: 78.5,
      metadata: { savingsPlanId: 'sp-4m5n6o7p8q9r0', currency: 'USD' },
    },
  ];
}

function generateDemoReservedInstances(): CommitmentItemData[] {
  const now = new Date();

  return [
    {
      provider: 'AWS',
      commitmentType: 'RESERVED_INSTANCE',
      commitmentId: 'ri-a1b2c3d4e5',
      commitmentName: 'RI: m5.xlarge x3',
      serviceType: 'EC2',
      instanceFamily: 'm5',
      region: 'ap-south-1',
      term: '1yr',
      paymentOption: 'NoUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 165 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 0.576,
      upfrontCost: 0,
      utilizationPercent: 95.0,
      metadata: { instanceType: 'm5.xlarge', instanceCount: 3, offeringClass: 'standard' },
    },
    {
      provider: 'AWS',
      commitmentType: 'RESERVED_INSTANCE',
      commitmentId: 'ri-f6g7h8i9j0',
      commitmentName: 'RI: r5.2xlarge x2',
      serviceType: 'EC2',
      instanceFamily: 'r5',
      region: 'us-east-1',
      term: '3yr',
      paymentOption: 'AllUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 695 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 0,
      upfrontCost: 15768,
      utilizationPercent: 88.7,
      metadata: { instanceType: 'r5.2xlarge', instanceCount: 2, offeringClass: 'convertible' },
    },
    {
      provider: 'AWS',
      commitmentType: 'RESERVED_INSTANCE',
      commitmentId: 'ri-k1l2m3n4o5',
      commitmentName: 'RI: db.r5.large x1 (RDS)',
      serviceType: 'RDS',
      instanceFamily: 'r5',
      region: 'ap-south-1',
      term: '1yr',
      paymentOption: 'PartialUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 340 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 0.063,
      upfrontCost: 554,
      utilizationPercent: 100,
      metadata: { instanceType: 'db.r5.large', instanceCount: 1, offeringClass: 'standard' },
    },
    {
      provider: 'AWS',
      commitmentType: 'RESERVED_INSTANCE',
      commitmentId: 'ri-p6q7r8s9t0',
      commitmentName: 'RI: cache.r5.large x2 (ElastiCache)',
      serviceType: 'ElastiCache',
      instanceFamily: 'r5',
      region: 'us-east-1',
      term: '1yr',
      paymentOption: 'NoUpfront',
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 280 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 85 * 24 * 60 * 60 * 1000),
      hourlyCommitment: 0.264,
      upfrontCost: 0,
      utilizationPercent: 72.4,
      metadata: { instanceType: 'cache.r5.large', instanceCount: 2, offeringClass: 'standard' },
    },
  ];
}

// --- Public API --------------------------------------------------------------

export async function listSavingsPlans(): Promise<CommitmentItemData[]> {
  // Production: call DescribeSavingsPlansCommand via @aws-sdk/client-savingsplans
  return generateDemoSavingsPlans();
}

export async function listReservedInstances(): Promise<CommitmentItemData[]> {
  // Production: call DescribeReservedInstancesCommand via @aws-sdk/client-ec2
  return generateDemoReservedInstances();
}

export async function listAllAwsCommitments(): Promise<CommitmentItemData[]> {
  const [savingsPlans, reservedInstances] = await Promise.all([
    listSavingsPlans(),
    listReservedInstances(),
  ]);
  return [...savingsPlans, ...reservedInstances];
}
