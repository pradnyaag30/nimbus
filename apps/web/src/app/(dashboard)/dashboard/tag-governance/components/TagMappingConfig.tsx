'use client';

import { useState, useCallback } from 'react';
import type { TagMappingRecord } from '@/lib/cloud/tags/types';
import { TagMappingTable } from './TagMappingTable';

interface TagMappingConfigProps {
  initialMappings: TagMappingRecord[];
}

export function TagMappingConfig({ initialMappings }: TagMappingConfigProps) {
  const [mappings, setMappings] = useState<TagMappingRecord[]>(initialMappings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback(async (data: {
    dimensionName: string;
    cloudTagKey: string;
    provider: string;
    dimensionDescription?: string;
    isRequired: boolean;
    isActive: boolean;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/tags/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create mapping');
      const { mapping } = await res.json();
      setMappings((prev) => [...prev, mapping]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mapping');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, data: Partial<TagMappingRecord>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/tags/mappings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update mapping');
      const { mapping } = await res.json();
      setMappings((prev) => prev.map((m) => (m.id === id ? mapping : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mapping');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/tags/mappings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete mapping');
      setMappings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mapping');
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {saving && (
        <div className="text-xs text-muted-foreground">Saving...</div>
      )}
      <TagMappingTable
        mappings={mappings}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
