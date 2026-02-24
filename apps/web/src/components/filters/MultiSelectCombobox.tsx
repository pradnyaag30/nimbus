'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectComboboxProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelectCombobox({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  label,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [options, search],
  );

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const clearAll = () => {
    onChange([]);
    setSearch('');
  };

  return (
    <div className="relative">
      {label && (
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm transition-colors hover:bg-muted/50"
      >
        <span className="truncate text-left">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {selected.length}
              </span>
              <span className="truncate">
                {selected.length === 1
                  ? options.find((o) => o.value === selected[0])?.label
                  : `${selected.length} selected`}
              </span>
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.stopPropagation(); clearAll(); }
              }}
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-lg border bg-popover shadow-lg">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-8 w-full rounded-md border bg-background px-2.5 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto px-1 pb-1">
              {filtered.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No results found
                </div>
              ) : (
                filtered.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggle(option.value)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })
              )}
            </div>
            {options.length > 3 && (
              <div className="flex items-center justify-between border-t px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onChange(options.map((o) => o.value))}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] font-medium text-muted-foreground hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
