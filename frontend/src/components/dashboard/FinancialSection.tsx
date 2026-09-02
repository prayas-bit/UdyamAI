'use client';

import ChartCard from '@/components/charts/ChartCard';

interface FinancialSectionProps {
  data?: any;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function FinancialMetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function FinancialSection({ data }: FinancialSectionProps) {
  const fin = data?.financial || {};

  const initialInvestment = fin.project_cost || fin.estimated_project_cost || 800000;
  const ownCapital = fin.own_capital || fin.available_capital || 200000;
  const loanRequired = fin.loan_required || fin.recommended_loan || (initialInvestment - ownCapital);
  const subsidyEstimated = fin.subsidy_estimated || fin.estimated_subsidy || 100000;

  const monthlyRevenue = fin.monthly_revenue || fin.estimated_monthly_revenue || 120000;
  const monthlyExpenses = fin.monthly_expenses || fin.estimated_monthly_expenses || 75000;
  const monthlyProfit = fin.monthly_net_profit || (monthlyRevenue - monthlyExpenses);

  const totalFund = (ownCapital + loanRequired + subsidyEstimated) || 1;
  const fundingData = [
    { label: 'Own Capital', amount: ownCapital, percentage: Math.round((ownCapital / totalFund) * 100) },
    { label: 'Bank Loan Required', amount: loanRequired, percentage: Math.round((loanRequired / totalFund) * 100) },
    { label: 'Government Subsidy (Est.)', amount: subsidyEstimated, percentage: Math.round((subsidyEstimated / totalFund) * 100) },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Financial summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricCard
          label="Initial Investment"
          value={initialInvestment}
        />

        <FinancialMetricCard
          label="Monthly Revenue (Est.)"
          value={monthlyRevenue}
        />

        <FinancialMetricCard
          label="Monthly Operating Cost"
          value={monthlyExpenses}
        />

        <FinancialMetricCard
          label="Monthly Net Profit"
          value={monthlyProfit}
        />
      </div>

      {/* Funding visualization */}
      <ChartCard
        title="Capital & Subsidy Structure"
        subtitle="Dynamic breakdown calculated by UdyamAI Finance Engine"
      >
        <div className="flex flex-col gap-5">
          {fundingData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>

                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${Math.min(100, Math.max(5, item.percentage))}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-xs text-gray-400">
                {item.percentage}% of total funding structure
              </p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}