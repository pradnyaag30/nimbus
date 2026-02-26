'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X, Shield, ShieldOff } from 'lucide-react';
import type { TagMappingRecord } from '@/lib/cloud/tags/types';

interface TagMappingTableProps {
  mappings: TagMappingRecord[];
  onAdd: (mapping: {
    dimensionName: string;
    cloudTagKey: string;
    provider: string;
    dimensionDescription?: string;
    isRequired: boolean;
    isActive: boolean;
  }) => void;
  onUpdate: (id: string, data: Partial<TagMappingRecord>) => void;
  onDelete: (id: string) => void;
}

const PROVIDERS = ['AWS', 'AZURE', 'GCP', 'OCI', 'KUBERNETES'] as const;

export function TagMappingTable({ mappings, onAdd, onUpdate, onDelete }: TagMappingTableProps) {
  const [showAddRow, setShowAddRow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newMapping, setNewMapping] = useState({
    dimensionName: '',
    cloudTagKey: '',
    provider: 'AWS' as string,
    dimensionDescription: '',
    isRequired: false,
    isActive: true,
  });
  const [editData, setEditData] = useState<Partial<TagMappingRecord>>({});

  const handleAdd = () => {
    if (!newMapping.dimensionName.trim() || !newMapping.cloudTagKey.trim()) return;
    onAdd(newMapping);
    setNewMapping({ dimensionName: '', cloudTagKey: '', provider: 'AWS', dimensionDescription: '', isRequired: false, isActive: true });
    setShowAddRow(false);
  };

  const handleStartEdit = (mapping: TagMappingRecord) => {
    setEditId(mapping.id);
    setEditData({ dimensionName: mapping.dimensionName, cloudTagKey: mapping.cloudTagKey, isRequired: mapping.isRequired, isActive: mapping.isActive });
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, editData);
    setEditId(null);
    setEditData({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Tag Mappings</h3>
          <p className="text-sm text-muted-foreground">
            Map cloud provider tags to standardized business dimensions for cross-cloud normalization.
          </p>
        </div>
        <button
          onClick={() => setShowAddRow(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Mapping
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Dimension</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Cloud Tag Key</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Provider</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Required</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Add Row */}
            {showAddRow && (
              <tr className="border-b bg-primary/5">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newMapping.dimensionName}
                    onChange={(e) => setNewMapping((p) => ({ ...p, dimensionName: e.target.value }))}
                    placeholder="e.g. Environment"
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newMapping.cloudTagKey}
                    onChange={(e) => setNewMapping((p) => ({ ...p, cloudTagKey: e.target.value }))}
                    placeholder="e.g. env"
                    className="w-full rounded border bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={newMapping.provider}
                    onChange={(e) => setNewMapping((p) => ({ ...p, provider: e.target.value }))}
                    className="rounded border bg-background px-2 py-1 text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={newMapping.isRequired}
                    onChange={(e) => setNewMapping((p) => ({ ...p, isRequired: e.target.checked }))}
                    className="h-4 w-4 rounded border"
                  />
                </td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={handleAdd} className="rounded p-1 hover:bg-green-100 dark:hover:bg-green-900/30">
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button onClick={() => setShowAddRow(false)} className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/30">
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing Mappings */}
            {mappings.map((mapping) => (
              <tr key={mapping.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  {editId === mapping.id ? (
                    <input
                      type="text"
                      value={editData.dimensionName ?? mapping.dimensionName}
                      onChange={(e) => setEditData((p) => ({ ...p, dimensionName: e.target.value }))}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  ) : (
                    <div>
                      <p className="font-medium">{mapping.dimensionName}</p>
                      {mapping.dimensionDescription && (
                        <p className="text-xs text-muted-foreground">{mapping.dimensionDescription}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === mapping.id ? (
                    <input
                      type="text"
                      value={editData.cloudTagKey ?? mapping.cloudTagKey}
                      onChange={(e) => setEditData((p) => ({ ...p, cloudTagKey: e.target.value }))}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-mono text-xs">{mapping.cloudTagKey}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {mapping.provider}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editId === mapping.id ? (
                    <input
                      type="checkbox"
                      checked={editData.isRequired ?? mapping.isRequired}
                      onChange={(e) => setEditData((p) => ({ ...p, isRequired: e.target.checked }))}
                      className="h-4 w-4 rounded border"
                    />
                  ) : mapping.isRequired ? (
                    <Shield className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ShieldOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      mapping.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {mapping.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === mapping.id ? (
                    <div className="inline-flex gap-1">
                      <button onClick={() => handleSaveEdit(mapping.id)} className="rounded p-1 hover:bg-green-100 dark:hover:bg-green-900/30">
                        <Check className="h-4 w-4 text-green-600" />
                      </button>
                      <button onClick={() => { setEditId(null); setEditData({}); }} className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/30">
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex gap-1">
                      <button onClick={() => handleStartEdit(mapping)} className="rounded p-1 hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => onDelete(mapping.id)} className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/30">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {mappings.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No tag mappings configured. Click &quot;Add Mapping&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
