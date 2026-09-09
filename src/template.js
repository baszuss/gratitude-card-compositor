// src/template.js
const fs = require("fs");
const path = require("path");
const { getResolvedStrings, escapeHtml } = require("./stringTable");

const TEMPLATE_PATH = path.join(__dirname, "..", "public", "template.html");
const RAW_TEMPLATE = fs.readFileSync(TEMPLATE_PATH, "utf8");

/**
 * employee = {
 *   full_name, first_name, title, specialty, qr_image_url
 * }
 */
function renderHtmlForLang(lang, employee) {
  const copy = getResolvedStrings(lang, employee.first_name);

  const tokens = {
    LANG: lang,
    EMPLOYEE_NAME: escapeHtml(employee.full_name),
    EMPLOYEE_TITLE: escapeHtml(employee.title),
    EMPLOYEE_SPECIALTY: escapeHtml(employee.specialty || ""),
    QR_IMAGE_SRC: employee.qr_image_url, // trusted HTTPS URL from GHL, not user input
    TAGLINE: copy.tagline,
    QUESTION_LEAD: copy.question_lead,
    QUESTION_HERO: copy.question_hero,
    QUESTION_TODAY: copy.question_today,
    SCAN_CTA: copy.scan_cta,
    TIP_NOTE: copy.tip_note,
    FOOTER_THANKS: copy.footer_thanks,
    ICON_SERVICE: copy.icon_service,
    ICON_PEOPLE: copy.icon_people,
    ICON_TOGETHER: copy.icon_together,
  };

  let html = RAW_TEMPLATE;
  for (const [key, value] of Object.entries(tokens)) {
    html = html.split(`{{${key}}}`).join(value);
  }
  return html;
}

module.exports = { renderHtmlForLang };
