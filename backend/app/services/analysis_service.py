from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models.analysis import AIAnalysis, AnalysisRun, FeasibilityAnalysis
from app.models.business import BusinessCategory
from app.models.finance import FinancialAnalysis
from app.models.location import District, Taluka, Village
from app.models.market import CompetitorAnalysis, MarketAnalysis
from app.models.scheme import Scheme, SchemeMatch
from app.schemes.matcher import estimate_subsidy_for_match
from app.schemas.feasibility import (
    AnalysisRunCreate,
    AnalysisStatusResponse,
    ConsolidatedAnalysisResponse,
)

_AI_UNAVAILABLE_MARKERS = (
    "ai advisory guidance is temporarily unavailable",
    "ai-generated recommendations are currently unavailable",
    "ai guidance is unavailable",
)


def _extract_indicator_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if item is not None and str(item).strip()]
    if isinstance(value, dict):
        indicators = value.get("indicators", [])
        if isinstance(indicators, list):
            return [
                str(item).strip() for item in indicators if item is not None and str(item).strip()
            ]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _is_ai_unavailable_text(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in _AI_UNAVAILABLE_MARKERS)


def _normalize_ai_advice_payload(ai_rec: AIAnalysis | None, feas_rec: FeasibilityAnalysis | None) -> dict:
    if not ai_rec:
        return {}

    swot = ai_rec.swot if isinstance(ai_rec.swot, dict) else {}
    opportunities_raw = ai_rec.opportunities if isinstance(ai_rec.opportunities, dict) else {}
    threats_raw = ai_rec.threats if isinstance(ai_rec.threats, dict) else {}
    business_plan = ai_rec.business_plan if isinstance(ai_rec.business_plan, dict) else {}
    pricing_strategy = ai_rec.pricing_strategy if isinstance(ai_rec.pricing_strategy, dict) else {}

    strengths = _extract_indicator_list(swot.get("strengths"))
    weaknesses = _extract_indicator_list(swot.get("weaknesses"))
    opportunities = _extract_indicator_list(swot.get("opportunities")) or _extract_indicator_list(
        opportunities_raw.get("advice")
    )
    threats = _extract_indicator_list(swot.get("threats")) or _extract_indicator_list(
        threats_raw.get("risks")
    )

    if feas_rec:
        strengths = strengths or _extract_indicator_list(feas_rec.strengths)
        weaknesses = weaknesses or _extract_indicator_list(feas_rec.weaknesses)
        opportunities = opportunities or _extract_indicator_list(feas_rec.opportunities)
        threats = threats or _extract_indicator_list(feas_rec.threats)

    recommendations = _extract_indicator_list(business_plan.get("next_steps"))
    financial_advice = _extract_indicator_list(pricing_strategy.get("financial_advice"))

    summary = ai_rec.summary or ""
    if _is_ai_unavailable_text(summary) and feas_rec and feas_rec.recommendation:
        summary = (
            f"Verified feasibility analysis completed with an overall score of "
            f"{feas_rec.overall_score:.0f}/100. Review the structured recommendations below."
            if feas_rec.overall_score is not None
            else "Verified feasibility analysis completed. Review the structured recommendations below."
        )

    return {
        "summary": summary,
        "recommendation": ai_rec.recommendation,
        "recommendations": recommendations,
        "reasoning": strengths,
        "weaknesses": weaknesses,
        "opportunities": opportunities,
        "threats": threats,
        "financial_advice": financial_advice,
        "swot": {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "threats": threats,
        },
        "confidence": ai_rec.confidence,
        "model_name": ai_rec.model_name,
        "rag_status": "success" if ai_rec.model_name not in (None, "unavailable") else "no_relevant_evidence",
    }


def _build_risks_payload(ai_data: dict, feas_rec: FeasibilityAnalysis | None) -> list[dict]:
    risks_data: list[dict] = []
    raw_ai_risks = ai_data.get("risks") if ai_data else None
    if isinstance(raw_ai_risks, dict):
        raw_ai_risks = raw_ai_risks.get("risks", [])

    if isinstance(raw_ai_risks, list):
        for item in raw_ai_risks:
            if isinstance(item, str) and item.strip() and not _is_ai_unavailable_text(item):
                risks_data.append({
                    "risk_factor": item,
                    "factor": item,
                    "category": "Operational & Market Risk",
                    "level": "Medium",
                    "mitigation": "Establish direct supplier contracts, enforce quality control protocols, and maintain a 15-day emergency operational buffer.",
                })
            elif isinstance(item, dict):
                factor = (
                    item.get("risk_factor")
                    or item.get("factor")
                    or item.get("risk_type")
                    or "Operational Risk"
                )
                if _is_ai_unavailable_text(str(factor)):
                    continue
                risks_data.append({
                    "risk_factor": factor,
                    "factor": factor,
                    "category": item.get("category") or "Operating Risk",
                    "level": item.get("level") or item.get("severity") or "Medium",
                    "mitigation": item.get("mitigation")
                    or item.get("evidence")
                    or "Implement risk control protocol and maintain contingency reserve.",
                })

    if not risks_data and feas_rec:
        threat_items = _extract_indicator_list(feas_rec.threats)
        weakness_items = _extract_indicator_list(feas_rec.weaknesses)
        for idx, threat in enumerate(threat_items + weakness_items):
            risks_data.append({
                "risk_factor": threat,
                "factor": threat[:60],
                "category": "Market & Enterprise Risk",
                "level": "Medium" if idx < len(threat_items) else "Low",
                "mitigation": "Monitor this factor monthly, maintain contingency reserves, and align operations with matched subsidy scheme requirements.",
            })

    return risks_data


class AnalysisService:
    @staticmethod
    def verify_location(db: Session, location_ref: UUID | str | None) -> UUID | None:
        if location_ref is None:
            return None

        village: Village | None = None
        if isinstance(location_ref, UUID):
            village = db.get(Village, location_ref)
        else:
            # Try UUID string parsing first
            try:
                parsed_uuid = UUID(str(location_ref))
                village = db.get(Village, parsed_uuid)
            except ValueError:
                pass

            if not village:
                statement = select(Village).where(Village.lgd_code == str(location_ref))
                village = db.exec(statement).first()

            if not village:
                statement = select(Village).where(Village.name == str(location_ref))
                village = db.exec(statement).first()

        if not village:
            raise HTTPException(
                status_code=404,
                detail=f"Location with identifier '{location_ref}' not found",
            )
        return village.id

    @staticmethod
    def verify_business_category(db: Session, category_ref: UUID | str | None) -> UUID | None:
        if category_ref is None:
            return None

        category: BusinessCategory | None = None
        if isinstance(category_ref, UUID):
            category = db.get(BusinessCategory, category_ref)
        else:
            try:
                parsed_uuid = UUID(str(category_ref))
                category = db.get(BusinessCategory, parsed_uuid)
            except ValueError:
                pass

            if not category:
                statement = select(BusinessCategory).where(
                    BusinessCategory.name == str(category_ref)
                )
                category = db.exec(statement).first()

        if not category:
            raise HTTPException(
                status_code=404,
                detail=f"Business category with identifier '{category_ref}' not found",
            )
        return category.id

    @staticmethod
    def create_analysis_run(db: Session, run_data: AnalysisRunCreate) -> AnalysisRun:
        # Step 1: Input validated via AnalysisRunCreate schema
        # Step 2: Verify location
        raw_location = run_data.location_id or run_data.village_id
        resolved_location_id = AnalysisService.verify_location(db, raw_location)

        # Step 3: Verify business category
        resolved_category_id = AnalysisService.verify_business_category(
            db, run_data.business_category_id
        )

        # Step 4: Create AnalysisRun
        user_id = run_data.user_id or uuid4()
        db_run = AnalysisRun(
            user_id=user_id,
            location_id=resolved_location_id,
            business_category_id=resolved_category_id,
            available_capital=run_data.available_capital,
            status="created",
        )
        db.add(db_run)
        db.commit()
        db.refresh(db_run)
        return db_run

    @staticmethod
    def get_analysis_run(db: Session, run_id: UUID) -> AnalysisRun | None:
        return db.get(AnalysisRun, run_id)

    @staticmethod
    def get_analysis_run_status(db: Session, run_id: UUID) -> AnalysisStatusResponse | None:
        db_run = db.get(AnalysisRun, run_id)
        if not db_run:
            return None

        progress = 10
        step = "created"

        if db_run.status == "pending":
            progress = 25
            step = "queued"
        elif db_run.status == "running":
            progress = 65
            step = "evaluating_rules"
        elif db_run.status == "completed":
            progress = 100
            step = "completed"
        elif db_run.status == "failed":
            progress = 0
            step = "failed"

        return AnalysisStatusResponse(
            id=db_run.id,
            analysis_id=db_run.id,
            status=db_run.status,
            progress_percentage=progress,
            current_step=step,
            created_at=db_run.created_at,
            completed_at=db_run.completed_at,
            error_message=None,
        )

    @staticmethod
    def get_consolidated_analysis(db: Session, run_id: UUID) -> ConsolidatedAnalysisResponse | None:
        db_run = db.get(AnalysisRun, run_id)
        if not db_run:
            return None

        # Location details
        village = db.get(Village, db_run.location_id) if db_run.location_id else None
        taluka = db.get(Taluka, village.taluka_id) if village and village.taluka_id else None
        district = db.get(District, taluka.district_id) if taluka and taluka.district_id else None
        location_data = (
            {
                "village_id": str(village.id),
                "village_name": village.name,
                "taluka_name": taluka.name if taluka else None,
                "district_name": district.name if district else None,
            }
            if village
            else {}
        )

        # Business details
        category = (
            db.get(BusinessCategory, db_run.business_category_id)
            if db_run.business_category_id
            else None
        )
        business_data = (
            {
                "category_id": str(category.id),
                "category_name": category.name,
                "description": getattr(category, "description", None),
            }
            if category
            else {}
        )

        # Financial analysis
        fin_rec = db.exec(
            select(FinancialAnalysis).where(FinancialAnalysis.analysis_run_id == run_id)
        ).first()
        fin_data = (
            {
                "available_capital": fin_rec.available_capital,
                "required_contribution": fin_rec.required_contribution,
                "desired_project_cost": fin_rec.desired_project_cost,
                "feasible_project_cost": fin_rec.feasible_project_cost,
                "calculated_loan": fin_rec.calculated_loan,
                "monthly_emi": fin_rec.monthly_emi,
                "total_interest": fin_rec.total_interest,
            }
            if fin_rec
            else {"available_capital": db_run.available_capital}
        )

        # Market & Competition analysis
        mkt_rec = db.exec(
            select(MarketAnalysis).where(MarketAnalysis.analysis_run_id == run_id)
        ).first()
        mkt_data = (
            {
                "population_estimate": mkt_rec.population_estimate,
                "household_estimate": mkt_rec.household_estimate,
                "target_customers": mkt_rec.market_reach_estimate,
                "demand_indicators": mkt_rec.demand_indicators,
                "pricing_indicators": mkt_rec.pricing_indicators,
            }
            if mkt_rec
            else {}
        )

        comp_rec = db.exec(
            select(CompetitorAnalysis).where(CompetitorAnalysis.analysis_run_id == run_id)
        ).first()
        comp_data = (
            {
                "competitor_count": comp_rec.competitor_count,
                "competition_density": comp_rec.competition_density,
                "distribution": comp_rec.competitor_distribution,
            }
            if comp_rec
            else {}
        )

        # Scheme matches
        matches = db.exec(select(SchemeMatch).where(SchemeMatch.analysis_run_id == run_id)).all()
        schemes_data = []
        for m in matches:
            sch_obj = db.get(Scheme, m.scheme_id) if m.scheme_id else None
            s_name = sch_obj.name if sch_obj and sch_obj.name else "Government Welfare & Subsidy Scheme"
            s_desc = sch_obj.description if sch_obj and sch_obj.description else "Capital subsidy and financial support scheme for micro-enterprises."
            s_agency = sch_obj.agency_name if sch_obj else None
            s_url = sch_obj.official_url if sch_obj else None

            proj_cost = m.estimated_project_cost or 0
            sub_est = estimate_subsidy_for_match(db, m.scheme_id, proj_cost) if m.scheme_id else 0.0

            schemes_data.append({
                "scheme_id": str(m.scheme_id),
                "scheme_name": s_name,
                "name": s_name,
                "description": s_desc,
                "agency_name": s_agency,
                "official_url": s_url,
                "match_status": str(
                    m.match_status.value if hasattr(m.match_status, "value") else m.match_status
                ),
                "match_score": m.match_score,
                "estimated_subsidy_amount": sub_est,
                "estimated_loan_amount": m.estimated_loan_amount,
                "estimated_project_cost": m.estimated_project_cost,
                "matched_conditions": m.matched_conditions or {},
            })

        # Feasibility analysis
        feas_rec = db.exec(
            select(FeasibilityAnalysis).where(FeasibilityAnalysis.analysis_run_id == run_id)
        ).first()
        feas_data = (
            {
                "overall_score": feas_rec.overall_score,
                "market_score": feas_rec.market_score,
                "financial_score": feas_rec.financial_score,
                "competition_score": feas_rec.competition_score,
                "infrastructure_score": feas_rec.infrastructure_score,
                "risk_score": feas_rec.risk_score,
                "recommendation": feas_rec.recommendation,
                "strengths": feas_rec.strengths,
                "weaknesses": feas_rec.weaknesses,
                "opportunities": feas_rec.opportunities,
                "threats": feas_rec.threats,
                "swot": {
                    "strengths": _extract_indicator_list(feas_rec.strengths),
                    "weaknesses": _extract_indicator_list(feas_rec.weaknesses),
                    "opportunities": _extract_indicator_list(feas_rec.opportunities),
                    "threats": _extract_indicator_list(feas_rec.threats),
                },
            }
            if feas_rec
            else {}
        )

        ai_rec = db.exec(select(AIAnalysis).where(AIAnalysis.analysis_run_id == run_id)).first()
        ai_data = _normalize_ai_advice_payload(ai_rec, feas_rec) if ai_rec else {}
        if ai_rec and not ai_data:
            ai_data = {
                "summary": ai_rec.summary,
                "recommendation": ai_rec.recommendation,
                "swot": ai_rec.swot,
                "opportunities": ai_rec.opportunities,
                "threats": ai_rec.threats,
                "risks": ai_rec.risks,
                "pricing_strategy": ai_rec.pricing_strategy,
                "business_plan": ai_rec.business_plan,
                "confidence": ai_rec.confidence,
            }

        risks_data = _build_risks_payload(
            {"risks": ai_rec.risks} if ai_rec else {},
            feas_rec,
        )

        return ConsolidatedAnalysisResponse(
            analysis_id=db_run.id,
            status=db_run.status,
            created_at=db_run.created_at,
            completed_at=db_run.completed_at,
            location=location_data,
            business=business_data,
            financial=fin_data,
            market=mkt_data,
            competition=comp_data,
            schemes=schemes_data,
            feasibility=feas_data,
            risks=risks_data,
            ai_advice=ai_data,
        )
