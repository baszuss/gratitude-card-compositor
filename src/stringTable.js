// src/stringTable.js
//
// Copy strings from the locked SOP (section 3.2). Employee name/title/specialty
// are NEVER translated — only these chrome strings differ by language.

const STRINGS = {
  en: {
    brand_word: "Gratitude",
    brand_sub: "MOVEMENT™",
    tagline: "COMPASSION. APPRECIATION. PURPOSE.",
    question_lead: "Did {first} make you",
    question_hero: "FEEL AMAZING",
    question_today: "today?",
    scan_cta: "SCAN HERE TO SAY THANK YOU!",
    tip_note:
      "After sharing your Thank You, you may have the option to leave an optional digital gratuity.",
    footer_thanks: "Thank you for being part of the Gratitude Movement.",
    learn_headline: "Interested in learning more?",
    learn_small: "Scan to learn more about the Gratitude Movement.",
    icon_service: "GREAT SERVICE",
    icon_people: "GREAT PEOPLE",
    icon_together: "STRONGER TOGETHER",
  },
  es: {
    // Translate the name as "Movement of Gratitude" (head noun + de + gratitude),
    // not English word order. Same pattern later: FR Mouvement de Gratitude, PT Movimento de Gratidão.
    brand_word: "Movimiento",
    brand_sub: "DE GRATITUD™",
    tagline: "COMPASIÓN. APRECIO. PROPÓSITO.",
    question_lead: "¿{first} te hizo",
    question_hero: "SENTIR INCREÍBLE",
    question_today: "hoy?",
    scan_cta: "¡ESCANEA AQUÍ PARA DAR LAS GRACIAS!",
    tip_note:
      "Después de compartir tu agradecimiento, puedes dejar una propina digital opcional.",
    footer_thanks: "Gracias por ser parte del Movimiento de Gratitud.",
    learn_headline: "¿Quieres saber más?",
    learn_small: "Escanea para conocer el Movimiento de Gratitud.",
    icon_service: "GRAN SERVICIO",
    icon_people: "GRAN EQUIPO",
    icon_together: "MÁS FUERTES JUNTOS",
  },
};

/**
 * Resolves the copy strings for one language, substituting {first} into
 * question_lead. This is the ONLY string that needs merge-field substitution;
 * everything else is used as-is.
 */
function getResolvedStrings(lang, firstName) {
  const s = STRINGS[lang];
  if (!s) throw new Error(`Unknown lang "${lang}" — expected "en" or "es"`);
  return {
    ...s,
    question_lead: s.question_lead.replace("{first}", escapeHtml(firstName)),
  };
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Jocelyn 14 Sep 2026: Hairsalon / HairSalón → two words on cards. */
function formatPropertyDisplayName(name, lang) {
  const salon = lang === "es" ? "Hair Salón" : "Hair Salon";
  return String(name || "").replace(/Hair\s*sal[oó]n/gi, salon);
}

module.exports = { getResolvedStrings, escapeHtml, formatPropertyDisplayName };
