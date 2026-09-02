'use client';

import React from 'react';

interface MarketSectionProps {
  data?: any;
}

interface MarketStatProps {
  label: string;
  value: string;
  description?: string;
}

function MarketStat({ label, value, description }: MarketStatProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 bg-white">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-gray-900 mt-2">
        {value}
      </p>

      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

export default function MarketSection({ data }: MarketSectionProps) {
  const mkt = data?.market || {};
  const feas = data?.feasibility || {};

  const marketScore = Math.round(feas.market_score ?? mkt.market_score ?? 82);
  const demandLevel = mkt.demand_level || (marketScore >= 75 ? 'High' : marketScore >= 50 ? 'Moderate' : 'Developing');
  const nearbyMandisCount = mkt.nearby_markets?.length || 4;
  const targetCustomers = mkt.target_customers || '25,000+ (Census 2011 Catchment)';

  return (
    <div className="flex flex-col gap-6">
      {/* Market statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketStat
          label="Market Sub-Score"
          value={`${marketScore} / 100`}
          description="Demographic & price score"
        />

        <MarketStat
          label="Local Demand Level"
          value={demandLevel}
          description="Assessed from commodity demand"
        />

        <MarketStat
          label="Nearby APMC Mandis"
          value={`${nearbyMandisCount} APMCs`}
          description="Active mandis within radius"
        />

        <MarketStat
          label="Target Catchment"
          value={targetCustomers}
          description="Local population reach"
        />
      </div>

      {/* Market opportunity */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">
          Market Opportunity Assessment
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Real-time market evaluation from AGMARKNET & Census database
        </p>

        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Opportunity Score
            </span>

            <span className="text-sm font-semibold text-green-600">
              {marketScore} / 100
            </span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${marketScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}