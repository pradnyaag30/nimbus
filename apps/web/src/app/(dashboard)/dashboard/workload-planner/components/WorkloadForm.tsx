'use client';

import { useState } from 'react';
import { Cpu, HardDrive, Database, Globe, Play } from 'lucide-react';
import type { WorkloadDefinition } from '@/lib/cloud/pricing/types';

interface WorkloadFormProps {
  regions: { label: string; value: string }[];
  onSubmit: (workload: WorkloadDefinition) => void;
  loading: boolean;
}

type Step = 'compute' | 'storage' | 'database' | 'networking';

const STEPS: { id: Step; label: string; icon: typeof Cpu }[] = [
  { id: 'compute', label: 'Compute', icon: Cpu },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'networking', label: 'Networking', icon: Globe },
];

export function WorkloadForm({ regions, onSubmit, loading }: WorkloadFormProps) {
  const [name, setName] = useState('My Workload');
  const [region, setRegion] = useState('us-east');
  const [enabledSteps, setEnabledSteps] = useState<Set<Step>>(new Set(['compute']));

  // Compute
  const [vcpus, setVcpus] = useState(4);
  const [memoryGb, setMemoryGb] = useState(16);
  const [os, setOs] = useState<'linux' | 'windows'>('linux');
  const [instanceCount, setInstanceCount] = useState(1);
  const [hoursPerMonth, setHoursPerMonth] = useState(744);

  // Storage
  const [storageSizeGb, setStorageSizeGb] = useState(100);
  const [storageType, setStorageType] = useState<'ssd' | 'hdd' | 'archive'>('ssd');

  // Database
  const [dbEngine, setDbEngine] = useState<'postgresql' | 'mysql' | 'sqlserver' | 'oracle'>('postgresql');
  const [dbVcpus, setDbVcpus] = useState(2);
  const [dbMemoryGb, setDbMemoryGb] = useState(8);
  const [dbStorageGb, setDbStorageGb] = useState(100);
  const [multiAz, setMultiAz] = useState(false);

  // Networking
  const [dataTransferGb, setDataTransferGb] = useState(100);
  const [loadBalancers, setLoadBalancers] = useState(1);

  const toggleStep = (step: Step) => {
    setEnabledSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const handleSubmit = () => {
    const workload: WorkloadDefinition = {
      name,
      regions: [region],
      ...(enabledSteps.has('compute') && {
        compute: { vcpus, memoryGb, os, instanceCount, hoursPerMonth },
      }),
      ...(enabledSteps.has('storage') && {
        storage: { sizeGb: storageSizeGb, storageType },
      }),
      ...(enabledSteps.has('database') && {
        database: { engine: dbEngine, vcpus: dbVcpus, memoryGb: dbMemoryGb, storageGb: dbStorageGb, multiAz },
      }),
      ...(enabledSteps.has('networking') && {
        networking: { dataTransferOutGb: dataTransferGb, loadBalancerCount: loadBalancers },
      }),
    };
    onSubmit(workload);
  };

  return (
    <div className="space-y-6">
      {/* Workload Name + Region */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Workload Configuration</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Workload Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {regions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step Toggles */}
      <div className="flex gap-2">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => toggleStep(step.id)}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              enabledSteps.has(step.id)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <step.icon className="h-4 w-4" />
            {step.label}
          </button>
        ))}
      </div>

      {/* Compute Section */}
      {enabledSteps.has('compute') && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Compute</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm text-muted-foreground">vCPUs</label>
              <input type="number" value={vcpus} min={1} max={512} onChange={(e) => setVcpus(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Memory (GB)</label>
              <input type="number" value={memoryGb} min={1} max={4096} onChange={(e) => setMemoryGb(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">OS</label>
              <select value={os} onChange={(e) => setOs(e.target.value as 'linux' | 'windows')} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Instance Count</label>
              <input type="number" value={instanceCount} min={1} max={1000} onChange={(e) => setInstanceCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Hours/Month</label>
              <input type="number" value={hoursPerMonth} min={1} max={744} onChange={(e) => setHoursPerMonth(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Storage Section */}
      {enabledSteps.has('storage') && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Storage</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Size (GB)</label>
              <input type="number" value={storageSizeGb} min={1} onChange={(e) => setStorageSizeGb(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <select value={storageType} onChange={(e) => setStorageType(e.target.value as 'ssd' | 'hdd' | 'archive')} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="ssd">SSD (High Performance)</option>
                <option value="hdd">HDD (Standard)</option>
                <option value="archive">Archive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Database Section */}
      {enabledSteps.has('database') && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Database</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm text-muted-foreground">Engine</label>
              <select value={dbEngine} onChange={(e) => setDbEngine(e.target.value as typeof dbEngine)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlserver">SQL Server</option>
                <option value="oracle">Oracle</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">vCPUs</label>
              <input type="number" value={dbVcpus} min={1} onChange={(e) => setDbVcpus(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Memory (GB)</label>
              <input type="number" value={dbMemoryGb} min={1} onChange={(e) => setDbMemoryGb(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Storage (GB)</label>
              <input type="number" value={dbStorageGb} min={10} onChange={(e) => setDbStorageGb(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input type="checkbox" id="multiAz" checked={multiAz} onChange={(e) => setMultiAz(e.target.checked)} className="h-4 w-4 rounded border" />
              <label htmlFor="multiAz" className="text-sm font-medium">Multi-AZ / High Availability</label>
            </div>
          </div>
        </div>
      )}

      {/* Networking Section */}
      {enabledSteps.has('networking') && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Networking</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Data Transfer Out (GB/month)</label>
              <input type="number" value={dataTransferGb} min={0} onChange={(e) => setDataTransferGb(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Load Balancers</label>
              <input type="number" value={loadBalancers} min={0} onChange={(e) => setLoadBalancers(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || enabledSteps.size === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        {loading ? 'Comparing...' : 'Compare Across Clouds'}
      </button>
    </div>
  );
}
