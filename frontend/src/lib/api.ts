const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

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
  latitude?: number | null;
  longitude?: number | null;
}

export interface NearbyVillage {
  id: string;
  name: string;
  district_id: string;
  taluka_id: string;
  pin_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_meters: number;
}

export interface NearbyBusiness {
  id: string;
  name?: string | null;
  category?: string | null;
  business_category_id?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_meters: number;
}

export interface NearbyMarket {
  id: string;
  name?: string | null;
  market_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_meters: number;
}

export interface NearbyFacility {
  id: string;
  name?: string | null;
  facility_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number | null;
  distance_meters: number;
}


export interface VillageMarketAnalysis {
  village_id?: string;
  village_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  nearby_markets?: Array<{ name?: string; distance_km?: number; market_type?: string }>;
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
    village_id?: string;
    name?: string;
    district_name?: string;
    taluka_name?: string;
    village_name?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  business?: {
    category_id?: string;
    category_name?: string;
  };
  financial?: {
    available_capital?: number;
    required_contribution?: number;
    desired_project_cost?: number;
    feasible_project_cost?: number;
    calculated_loan?: number;
    monthly_emi?: number;
    total_interest?: number;
    total_repayment?: number;
    working_capital?: number;
    monthly_revenue?: number;
    monthly_operating_cost?: number;
    monthly_profit?: number;
    break_even_months?: number;
    repayment_capacity?: number;
    interest_rate?: number;
    tenure_months?: number;
    margin_gap?: number;
  };
  market?: {
    market_score?: number;
    demand_level?: string;
    population_estimate?: number;
    household_estimate?: number;
    target_customers?: number;
    demand_indicators?: Record<string, any>;
    pricing_indicators?: Record<string, any>;
    radius_km?: number;
    data_confidence?: string;
    nearby_markets?: any[];
    commodity_prices?: any[];
  };
  competition?: {
    competition_score?: number;
    competitor_count?: number;
    competition_density?: number;
    competitor_distribution?: Record<string, any>;
    identified_gaps?: Record<string, any>;
    radius_km?: number;
    data_confidence?: string;
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
    market_advice?: string[];
    competition_advice?: string[];
    scheme_advice?: string[];
    risks?: string[];
    confidence?: string;
    model_name?: string;
    prompt_version?: string;
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
    evidence?: any[];
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

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  provider_available: boolean;
}

export async function sendChatMessage(
  message: string,
  history: ChatTurn[] = [],
  language: 'en' | 'hi' | 'mr' = 'en',
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, language }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Chat failed (${res.status})`);
    }
    return res.json();
  } finally {
    window.clearTimeout(timer);
  }
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

function buildGeoQuery(
  lat: number,
  lng: number,
  radiusKm: number,
  extra?: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_km: String(radiusKm),
    limit: '100',
  });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value != null && value !== '') params.set(key, String(value));
    }
  }
  return params.toString();
}

export async function getNearbyMarkets(
  lat: number,
  lng: number,
  radiusKm = 25,
  marketType?: string,
): Promise<NearbyMarket[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/locations/nearby/markets?${buildGeoQuery(lat, lng, radiusKm, {
      market_type: marketType,
    })}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch nearby markets (${res.status})`);
  return res.json();
}

export async function getNearbyBusinesses(
  lat: number,
  lng: number,
  radiusKm = 10,
  categoryId?: string,
): Promise<NearbyBusiness[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/locations/nearby/businesses?${buildGeoQuery(lat, lng, radiusKm, {
      category_id: categoryId,
    })}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch nearby businesses (${res.status})`);
  return res.json();
}

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  radiusKm = 10,
  facilityType?: string,
): Promise<NearbyFacility[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/locations/nearby/facilities?${buildGeoQuery(lat, lng, radiusKm, {
      facility_type: facilityType,
    })}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch nearby facilities (${res.status})`);
  return res.json();
}

export async function getNearbyVillages(
  lat: number,
  lng: number,
  radiusKm = 10,
): Promise<NearbyVillage[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/locations/nearby/villages?${buildGeoQuery(lat, lng, radiusKm)}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch nearby villages (${res.status})`);
  return res.json();
}

export async function getVillageMarketAnalysis(
  villageId: string,
  categoryId?: string,
): Promise<VillageMarketAnalysis> {
  const params = new URLSearchParams();
  if (categoryId) params.set('business_category_id', categoryId);
  const query = params.toString();
  const res = await fetch(
    `${API_BASE_URL}/api/v1/markets/analyze/${villageId}${query ? `?${query}` : ''}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch village market analysis (${res.status})`);
  return res.json();
}

function formatKm(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export { formatKm };