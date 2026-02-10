import type { CloudAdapter, FocusCostItem } from './types';
import { AwsAdapter } from './aws';
import { AzureAdapter } from './azure';
import { GcpAdapter } from './gcp';

const adapters: Record<string, CloudAdapter> = {
  AWS: new AwsAdapter(),
  AZURE: new AzureAdapter(),
  GCP: new GcpAdapter(),
};

export function getCloudAdapter(provider: string): CloudAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported cloud provider: ${provider}`);
  }
  return adapter;
}

export type { CloudAdapter, FocusCostItem };
