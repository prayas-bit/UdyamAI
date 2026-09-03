const API_BASE_URL =
  process.env.API_URL || 'http://localhost:8000';

export interface District {
  id: string;
  name: string;
  state?: string;
  lgd_code?: number | string;
}

export interface Taluka {
  id: string;
  name: string;
  district_id: string;
  lgd_code?: number | string;
}

export interface Village {
  id: string;
  name: string;
  taluka_id: string;
  district_id?: string;
  lgd_code?: number | string;
  pin_code?: string;
}


export interface BusinessCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
}

export interface StartAnalysisRequest {
  user_id?: string | null;
  location_id?: string | null;
  village_id: string;
  business_category_id: string;
  available_capital: number;
  desired_project_cost: number;
  language?: 'en' | 'hi' | 'mr';
}

export interface ConsolidatedAnalysisData {
  analysis_id: string;
  status: string;
  created_at?: string;
  completed_at?: string;
  location?: {
    id?: string;
    name?: string;
    district_name?: string;
    taluka_name?: string;
    village_name?: string;
  };
  business?: {
    category_id?: string;
    category_name?: string;
  };
  financial?: {
    own_capital?: number;
    project_cost?: number;
    loan_required?: number;
    subsidy_estimated?: number;
    break_even_months?: number;
    monthly_revenue?: number;
    monthly_expenses?: number;
    monthly_net_profit?: number;
    dscr?: number;
  };
  market?: {
    market_score?: number;
    demand_level?: string;
    nearby_markets?: any[];
    commodity_prices?: any[];
  };
  competition?: {
    competition_score?: number;
    total_competitors?: number;
    competitors?: any[];
  };
  schemes?: Array<{
    scheme_id?: string;
    scheme_name?: string;
    match_status?: string;
    match_score?: number;
    estimated_subsidy_amount?: number;
    details?: any;
  }>;
  feasibility?: {
    overall_score?: number;
    market_score?: number;
    financial_score?: number;
    competition_score?: number;
    infrastructure_score?: number;
    risk_score?: number;
    swot?: {
      strengths?: string[];
      weaknesses?: string[];
      opportunities?: string[];
      threats?: string[];
    };
    recommendation?: string;
  };
  ai_advice?: {
    summary?: string;
    recommendation?: string;
    recommendations?: string[];
    reasoning?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    financial_advice?: string[];
    swot?: {
      strengths?: string[];
      weaknesses?: string[];
      opportunities?: string[];
      threats?: string[];
    };
    risk_mitigation_plan?: string[];
    schemes_guidance?: string[];
    rag_status?: string;
    evidence_chunks?: any[];
  };
  risks?: Array<{
    risk_factor?: string;
    factor?: string;
    category?: string;
    level?: string;
    severity?: string;
    mitigation?: string;
  }>;
}

export async function getDistricts(): Promise<District[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/locations/districts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch districts from API, using fallback:', err);
    return [];
  }
}

export async function getTalukas(districtId?: string): Promise<Taluka[]> {
  try {
    const url = districtId
      ? `${API_BASE_URL}/api/v1/locations/talukas?district_id=${districtId}`
      : `${API_BASE_URL}/api/v1/locations/talukas`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch talukas from API:', err);
    return [];
  }
}

export async function getVillages(talukaId?: string): Promise<Village[]> {
  try {
    const url = talukaId
      ? `${API_BASE_URL}/api/v1/locations/villages?taluka_id=${talukaId}`
      : `${API_BASE_URL}/api/v1/locations/villages`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch villages from API:', err);
    return [];
  }
}

export async function getBusinessCategories(): Promise<BusinessCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/business-categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch business categories from API:', err);
    return [];
  }
}

export async function startAnalysis(data: StartAnalysisRequest) {
  const payload = {
    user_id: data.user_id || null,
    location_id: data.location_id || data.village_id,
    village_id: data.village_id,
    business_category_id: data.business_category_id,
    available_capital: data.available_capital,
    desired_project_cost: data.desired_project_cost,
    language: data.language || 'en',
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Analysis API error:', response.status, errorText);
    throw new Error(
      `Analysis submission failed (${response.status}): ${errorText}`
    );
  }
  return response.json();
}

export async function getAnalysisStatus(analysisId: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getConsolidatedAnalysis(analysisId: string): Promise<ConsolidatedAnalysisData> {
  const res = await fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}/consolidated`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function downloadAnalysisPdf(analysisId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/analysis/${analysisId}/report/pdf`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `PDF download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `udyam-feasibility-${analysisId.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getSchemes() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/schemes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch schemes from API:', err);
    return [];
  }
}