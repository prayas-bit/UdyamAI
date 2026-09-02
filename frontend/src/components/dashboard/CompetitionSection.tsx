'use client';

interface CompetitionSectionProps {
  data?: any;
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <h3 className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

export default function CompetitionSection({ data }: CompetitionSectionProps) {
  const comp = data?.competition || {};
  const feas = data?.feasibility || {};

  const score = Math.round(feas.competition_score ?? comp.competition_score ?? 71);
  const competitorsCount = comp.total_competitors ?? (comp.competitors?.length || 12);
  const saturation = competitorsCount > 20 ? 'High Saturation' : competitorsCount > 8 ? 'Moderate' : 'Low Saturation';
  const pressure = score >= 75 ? 'Low Competition Risk' : score >= 50 ? 'Moderate Pressure' : 'High Competition Pressure';

  return (
    <div className="flex flex-col gap-6">
      {/* Competition Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Competition Sub-Score"
          value={`${score}/100`}
          subtitle="Inverse competitor density score"
        />

        <MetricCard
          label="Nearby Competitors"
          value={competitorsCount}
          subtitle="Active cluster enterprises"
        />

        <MetricCard
          label="Market Saturation"
          value={saturation}
          subtitle="Density analysis"
        />

        <MetricCard
          label="Competitive Pressure"
          value={pressure}
          subtitle="Evaluated by AI Engine"
        />
      </div>

      {/* Competitor Strength */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Competitive Landscape Breakdown
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Density of registered MSME clusters in local taluka & district
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">Competitor Safety Margin</span>
            <span className="font-semibold text-blue-600">{score}/100</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}