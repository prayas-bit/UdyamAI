"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import LocationSelector from "./LocationSelector";
import BusinessSelector from "./BusinessSelector";
import FinancialForm from "./FinancialForm";
import ReviewScreen from "./ReviewScreen";
import WhatYouNeed from "./WhatYouNeed";
import Header from "@/components/ui/Header";

import { startAnalysis } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();

  // Location
  const [districtId, setDistrictId] = useState("");
  const [talukaId, setTalukaId] = useState("");
  const [villageId, setVillageId] = useState("");

  // Business
  const [businessCategoryId, setBusinessCategoryId] = useState("");

  // Financial inputs
  const [capital, setCapital] = useState("");
  const [desiredProjectCost, setDesiredProjectCost] = useState("");

  // Language
  const [language, setLanguage] = useState("en");

  // UI state
  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Review button
  const handleReview = () => {
    setError("");

    if (
      !districtId ||
      !talukaId ||
      !villageId ||
      !businessCategoryId ||
      !capital ||
      Number(capital) < 0
    ) {
      setError("Please fill in all required location, business category, and capital fields.");
      return;
    }

    setShowReview(true);
  };

  // Edit button
  const handleEdit = () => {
    setShowReview(false);
    setError("");
  };

  // Start Analysis via Backend API
  const handleStartAnalysis = async () => {
    setIsSubmitting(true);
    setError("");

    const analysisData = {
      districtId,
      talukaId,
      villageId,
      businessCategoryId,
      capital,
      desiredProjectCost,
      language,
      timestamp: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("udyam_analysis_inputs", JSON.stringify(analysisData));
        localStorage.setItem("udyam_analysis_inputs", JSON.stringify(analysisData));
      }

      // Call backend POST /api/v1/analysis
      const res = await startAnalysis({
        village_id: villageId,
        business_category_id: businessCategoryId,
        available_capital: Number(capital) || 0,
        desired_project_cost: Number(desiredProjectCost) || Number(capital) || 100000,
        language: (language as 'en' | 'hi' | 'mr') || 'en',
      });

      const analysisId = res.id || res.analysis_id;
      if (analysisId) {
        if (typeof window !== "undefined") {
          localStorage.setItem("udyam_active_analysis_id", String(analysisId));
        }
        router.push(`/dashboard?analysis_id=${analysisId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      console.error("Analysis submission error:", e);
      setError(e.message || "Failed to trigger backend feasibility pipeline. Please verify backend connectivity.");
      setIsSubmitting(false);
    }
  };

  // -----------------------------
  // Review Screen
  // -----------------------------
  if (showReview) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
        <ReviewScreen
          district={districtId}
          taluka={talukaId}
          village={villageId}
          business={businessCategoryId}
          capital={capital}
          desiredProjectCost={desiredProjectCost}
          language={language}
          error={error}
          onEdit={handleEdit}
          onStartAnalysis={handleStartAnalysis}
        />
        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm text-white">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mb-4" />
            <h3 className="text-xl font-bold">Running UdyamAI Feasibility Pipeline...</h3>
            <p className="mt-2 text-sm text-slate-300">Evaluating market demand, financial ratios, scheme matching & RAG AI advice.</p>
          </div>
        )}
      </main>
    );
  }

  // -----------------------------
  // Main Onboarding
  // -----------------------------
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <Header />

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Left side */}
          <div>
            <p className="font-medium text-blue-600">
              Smart business guidance
            </p>

            <h1 className="mt-3 text-4xl font-bold leading-tight">
              Make better business decisions with UdyamAI.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Get a real-time data feasibility assessment and discover relevant
              opportunities based on your Maharashtra location, business and capital.
            </p>

            <div className="mt-8">
              <WhatYouNeed />
            </div>
          </div>

          {/* Right side */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Start your analysis
            </h2>

            <div className="mt-6 space-y-8">
              {/* Location */}
              <LocationSelector
                districtId={districtId}
                talukaId={talukaId}
                villageId={villageId}
                setDistrictId={setDistrictId}
                setTalukaId={setTalukaId}
                setVillageId={setVillageId}
              />

              {/* Business */}
              <BusinessSelector
                businessCategoryId={businessCategoryId}
                setBusinessCategoryId={setBusinessCategoryId}
              />

              {/* Financial */}
              <FinancialForm
                capital={capital}
                desiredProjectCost={desiredProjectCost}
                language={language}
                setCapital={setCapital}
                setDesiredProjectCost={setDesiredProjectCost}
                setLanguage={setLanguage}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Review */}
            <button
              type="button"
              onClick={handleReview}
              className="mt-8 w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Review Details →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}