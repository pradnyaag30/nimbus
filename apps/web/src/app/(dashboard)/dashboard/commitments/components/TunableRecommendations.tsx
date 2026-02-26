'use client';

import { useState } from 'react';
import type { RIPurchaseRecommendation, SPPurchaseRecommendation } from '@/lib/cloud/aws-costs';

interface TunableRecommendationsProps {
  riRecommendations: RIPurchaseRecommendation[];
  spRecommendations: SPPurchaseRecommendation[];
  format: (value: number) => string;
}

export function TunableRecommendations({
  riRecommendations,
  spRecommendations,
  format,
}: TunableRecommendationsProps) {
  const [term, setTerm] = useState('ONE_YEAR');
  const [payment, setPayment] = useState('NO_UPFRONT');
  const [lookback, setLookback] = useState('SIXTY_DAYS');
  const [loading, setLoading] = useState(false);
  const [riRecs, setRiRecs] = useState(riRecommendations);
  const [spRecs, setSpRecs] = useState(spRecommendations);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/commitments/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termInYears: term,
          paymentOption: payment,
          lookbackPeriod: lookback,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setRiRecs(data.riRecommendations || []);
        setSpRecs(data.spRecommendations || []);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  };

  const totalRISavings = riRecs.reduce((sum, r) => sum + r.estimatedMonthlySavings, 0);
  const totalSPSavings = spRecs.reduce((sum, r) => sum + r.estimatedMonthlySavings, 0);

  return (
    <div className="space-y-6">
      {/* Tuning Controls */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Recommendation Parameters</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Adjust parameters to match your commitment strategy. Changes will re-query AWS Cost Explorer.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="ONE_YEAR">1 Year</option>
              <option value="THREE_YEARS">3 Years</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Option</label>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="NO_UPFRONT">No Upfront</option>
              <option value="PARTIAL_UPFRONT">Partial Upfront</option>
              <option value="ALL_UPFRONT">All Upfront</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Lookback Period</label>
            <select
              value={lookback}
              onChange={(e) => setLookback(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="SEVEN_DAYS">7 Days</option>
              <option value="THIRTY_DAYS">30 Days</option>
              <option value="SIXTY_DAYS">60 Days</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Recommendations'}
          </button>
        </div>
      </div>

      {/* RI Recommendations */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Reserved Instance Recommendations</h3>
            <span className="text-sm font-medium text-green-600">
              Potential savings: {format(totalRISavings)}/mo
            </span>
          </div>
        </div>
        {riRecs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No RI purchase recommendations for current parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Instance Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Est. Monthly Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {riRecs.map((rec, i) => (
                  <tr key={`ri-${i}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium">{rec.instanceType}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                      {format(rec.estimatedMonthlySavings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SP Recommendations */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Savings Plans Recommendations</h3>
            <span className="text-sm font-medium text-green-600">
              Potential savings: {format(totalSPSavings)}/mo
            </span>
          </div>
        </div>
        {spRecs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No Savings Plans purchase recommendations for current parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Est. Monthly Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {spRecs.map((rec, i) => (
                  <tr key={`sp-${i}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm font-medium">{rec.savingsPlanType}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                      {format(rec.estimatedMonthlySavings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
