'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import Header from '@/components/ui/Header';
import DashboardNav, { DashboardSection } from '@/components/dashboard/DashboardNav';
import FinancialSection from '@/components/dashboard/FinancialSection';
import MarketSection from '@/components/dashboard/MarketSection';
import CompetitionSection from '@/components/dashboard/CompetitionSection';
import SchemeSection from '@/components/dashboard/SchemeSection';
import RiskSection from '@/components/dashboard/RiskSection';
import MapContainer from '@/components/maps/MapContainer';
import { getConsolidatedAnalysis, downloadAnalysisPdf, ConsolidatedAnalysisData } from '@/lib/api';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [data, setData] = useState<ConsolidatedAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const analysisId = searchParams.get('analysis_id') || (typeof window !== 'undefined' ? localStorage.getItem('udyam_active_analysis_id') : null);

  useEffect(() => {
    async function loadAnalysis() {
      if (!analysisId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getConsolidatedAnalysis(analysisId);
        setData(res);
      } catch (err) {
        console.warn('Failed to fetch consolidated analysis, using dynamic calculated state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [analysisId]);

  const feas = data?.feasibility || {};
  const overallScore = feas.overall_score != null ? Math.round(feas.overall_score) : null;
  const marketScore = feas.market_score != null ? Math.round(feas.market_score) : null;
  const financialScore = feas.financial_score != null ? Math.round(feas.financial_score) : null;
  const competitionScore = feas.competition_score != null ? Math.round(feas.competition_score) : null;
  const riskScore = feas.risk_score != null ? Math.round(feas.risk_score) : null;

  const riskLevel =
    riskScore == null ? 'Unknown' : riskScore >= 70 ? 'Low' : riskScore >= 40 ? 'Medium' : 'High';
  const label =
    overallScore == null
      ? 'Awaiting analysis'
      : overallScore >= 75
        ? 'Highly Feasible'
        : overallScore >= 50
          ? 'Moderately Feasible'
          : 'High Risk Feasibility';

  const locName = data?.location
    ? `${data.location.village_name || data.location.name || ''}${data.location.district_name ? `, ${data.location.district_name}` : ''}`.trim()
    : '';
  const bizName = data?.business?.category_name || '';

  const advisorSummary = data?.ai_advice?.summary || feas.recommendation || '';
  const advisorRecommendations =
    data?.ai_advice?.recommendations ||
    data?.ai_advice?.financial_advice ||
    (data?.ai_advice?.recommendation ? [data.ai_advice.recommendation] : []);

  async function handleDownloadPdf() {
    if (!analysisId) return;
    try {
      setPdfLoading(true);
      setPdfError(null);
      await downloadAnalysisPdf(analysisId);
    } catch (err: any) {
      setPdfError(err?.message || 'Failed to download PDF report.');
    } finally {
      setPdfLoading(false);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  }

  function getRiskColor(level: string) {
    switch (level) {
      case 'Low':
        return 'text-green-700 bg-green-100';
      case 'Medium':
        return 'text-amber-700 bg-amber-100';
      case 'High':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  }

  function ScoreCard({ label, score }: { label: string; score: number }) {
    return (
      <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2 bg-white shadow-sm">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold rounded-md px-2 ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-600 font-medium">Fetching real-time UdyamAI analysis results...</p>
      </div>
    );
  }

  if (!analysisId || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <Header />
        <p className="mt-8 text-slate-700 font-medium">No analysis found. Run a feasibility assessment from onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="p-6 max-w-5xl mx-auto flex flex-col gap-4 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Feasibility Dashboard</h1>
            <p className="text-gray-600 mt-1 font-medium">
              {bizName || 'Business category pending'} •{' '}
              <span className="text-blue-600 font-semibold">{locName || 'Location pending'}</span>
            </p>
          </div>
          {analysisId && (
            <div className="mt-2 sm:mt-0 text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border text-slate-600">
              ID: {String(analysisId).slice(0, 8)}...
            </div>
          )}
        </div>

        <DashboardNav activeSection={activeSection} onSectionChange={setActiveSection} />

        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Overall feasibility banner */}
            <div className="rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white shadow-sm gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Overall Feasibility Index</span>
                <div className="text-4xl font-bold mt-1 text-slate-900">
                  {overallScore != null ? `${overallScore}/100` : '—'}
                </div>
                <span className="text-blue-700 font-semibold">{label}</span>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${getRiskColor(riskLevel)}`}>
                {riskLevel} Risk Profile
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {marketScore != null && <ScoreCard label="Market Demand Score" score={marketScore} />}
              {financialScore != null && <ScoreCard label="Financial Feasibility" score={financialScore} />}
              {competitionScore != null && <ScoreCard label="Competition Margin" score={competitionScore} />}
            </div>

            {/* AI Advisor Recommendations (RAG Evidence Driven) */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">UdyamAI Advisor Guidance (RAG Verified)</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 font-normal">
                {advisorSummary || 'Advisor guidance will appear here after analysis completes.'}
              </p>
              {data?.ai_advice?.recommendation && (
                <p className="mt-3 text-sm font-medium text-slate-800">
                  {data.ai_advice.recommendation}
                </p>
              )}
              {advisorRecommendations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Strategic Recommendations</h4>
                  <ul className="list-disc list-inside text-sm text-slate-800 space-y-1">
                    {advisorRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'financial' && <FinancialSection data={data} />}
        {activeSection === 'market' && <MarketSection data={data} />}
        {activeSection === 'competition' && <CompetitionSection data={data} />}
        {activeSection === 'map' && <MapContainer title="Location & APMC Mandi Spatial Coverage" />}
        {activeSection === 'schemes' && <SchemeSection data={data} />}
        {activeSection === 'risks' && <RiskSection data={data} />}
        {activeSection === 'report' && (
          <div className="rounded-xl border border-gray-200 p-8 bg-white shadow-sm text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Comprehensive Feasibility PDF Report</h3>
            <p className="text-sm text-slate-500 mb-4">Complete financial model, market spatial graphs, and scheme application forms.</p>
            {pdfError && (
              <p className="text-sm text-red-600 mb-3">{pdfError}</p>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={!analysisId || pdfLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {pdfLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                'Download Official PDF Report'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}