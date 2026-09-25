"""Pan-India conversational AI advisor for the floating chatbot and chat page."""

from __future__ import annotations

import logging

from app.ai import llm
from app.ai.llm import LLMError
from app.schemas.chat import ChatTurn

logger = logging.getLogger(__name__)

_MAX_HISTORY = 8

_FALLBACK_REPLIES = {
    "en": (
        "I am the UdyamAI pan-India assistant. I can help you explore business feasibility, "
        "nearby markets, competitors, APMC mandis, central & state government schemes "
        "(PMEGP, PMFME, MUDRA, PM Vishwakarma, Stand-Up India), and financial planning across all Indian states. "
        "Run an analysis from Onboarding for your district/village to get location-specific scores, "
        "then open the Dashboard for market, map, scheme, and risk details. "
        "The live AI advisor is temporarily connecting — ask again in a moment."
    ),
    "hi": (
        "मैं उद्यमएआई अखिल भारतीय (Pan-India) सहायक हूँ। मैं पूरे भारत के सभी राज्यों और जिलों में "
        "व्यवसाय व्यवहार्यता, निकटतम मंडियों, प्रतिस्पर्धियों, सरकारी योजनाओं "
        "(पीएमईजीपी, पीएमएफएमई, मुद्रा, पीएम विश्वकर्मा) और वित्तीय योजना में मदद कर सकता हूँ। "
        "अपने स्थान के विशिष्ट स्कोर के लिए ऑनबोर्डिंग से विश्लेषण चलाएँ, फिर डैशबोर्ड देखें। "
        "लाइव एआई सलाहकार से जुड़ रहा है — थोड़ी देर बाद पुनः पूछें।"
    ),
    "mr": (
        "मी उद्यमएआय अखिल भारतीय (Pan-India) सल्लागार आहे. भारतातील सर्व राज्ये आणि जिल्ह्यांमध्ये "
        "व्यवसाय व्यवहार्यता, जवळचे बाजार, स्थानिक मंडई, शासकीय योजना "
        "(पीएमईजीपी, पीएमएफएमई, मुद्रा, पीएम विश्वकर्मा) आणि आर्थिक नियोजनात मी मदत करू शकतो. "
        "आपल्या परिसरासाठी अचूक विश्लेषण मिळवण्यासाठी ऑनबोर्डिंग करा आणि डॅशबोर्ड तपासा. "
        "लाइव्ह एआय सल्लागार जोडला जात आहे — कृपया पुन्हा विचारा."
    ),
}


def fallback_reply(language: str) -> str:
    """Canned per-language reply used when the LLM is unavailable."""
    return _FALLBACK_REPLIES.get(language, _FALLBACK_REPLIES["en"])


def _build_prompt(message: str, history: list[ChatTurn], language: str) -> str:
    history_lines: list[str] = []
    for turn in history[-_MAX_HISTORY:]:
        speaker = "User" if turn.role == "user" else "Assistant"
        history_lines.append(f"{speaker}: {turn.content.strip()}")
    history_block = "\n".join(history_lines) if history_lines else "(no prior turns)"

    return f"""You are UdyamAI, a knowledgeable and concise AI business & financial advisor for rural, semi-urban, and micro-entrepreneurs across ALL states and union territories of India (including Maharashtra, Uttar Pradesh, Bihar, Tamil Nadu, Karnataka, Gujarat, Rajasthan, Madhya Pradesh, West Bengal, Andhra Pradesh, Telangana, Punjab, Haryana, Odisha, Kerala, Assam, and others).

Your domain expertise covers:
- Business feasibility, setup costs, working capital, break-even analysis, and ROI for micro/small businesses.
- Pan-India APMC mandis, local market linkages, direct competitors, raw material availability, and rural infrastructure.
- Central Government Schemes across India: PMEGP (15-35% subsidy up to ₹50L), PMFME (35% subsidy up to ₹10L for food processing), PM MUDRA (Shishu/Kishore/Tarun loans up to ₹10L/₹20L), PM Vishwakarma (artisans & craftsmen support), Stand-Up India, Agri Infrastructure Fund (AIF), Kisan Credit Card (KCC), NABARD rural schemes, PM SVANidhi, and CGTMSE collateral-free credit.
- State Government Schemes: Specific state subsidies, DIC programs, and state industrial development incentives for all Indian states.
- Credit readiness, bank loan documentation, DPR (Detailed Project Report) guidance, and risk management.
- How to use UdyamAI: Select location in Onboarding → Run AI Feasibility Engine → Explore Dossier, Map, Schemes, Financial Hub & Download Dossier.

Rules:
- Give accurate, practical, and grounded business advice suitable for Indian rural and micro entrepreneurs.
- Keep answers concise, clear, and structured (typically 2–6 sentences or clear bullet points) unless in-depth explanation is requested.
- If specific local prices or subsidies vary by state/district, provide the standard range and encourage the user to verify in the UdyamAI Dashboard or local District Industries Centre (DIC) / bank branch.
- Reply entirely in the user's requested language.
- Language code: {language} (en = English, hi = Hindi, mr = Marathi).
- If language is hi, write in fluent, natural Hindi (Devanagari). If mr, write in fluent, natural Marathi (Devanagari).

Conversation so far:
{history_block}

User: {message.strip()}
Assistant:"""


def generate_chat_reply(
    message: str,
    history: list[ChatTurn] | None = None,
    language: str = "en",
) -> tuple[str, bool]:
    """Return (reply_text, provider_available)."""
    fallback = fallback_reply(language)
    try:
        reply = llm.generate(_build_prompt(message, history or [], language)).strip()
        if reply:
            return reply, True
        logger.warning("Chat LLM returned empty text")
        return fallback, False
    except LLMError as exc:
        logger.warning("Chat LLM unavailable: %s", exc)
        return fallback, False
    except Exception:
        logger.exception("Chat generation failed")
        return fallback, False
