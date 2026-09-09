// src/render.js
const { chromium } = require("playwright");

/**
 * Renders one HTML string to a 5x7in PDF buffer.
 * Per SOP 3.4: 5in x 7in, 0 margin, print background graphics, 300 DPI equivalent.
 */
async function renderPdf(html) {
  const browser = await chromium.launch({
    // Required in most containerized environments (Railway, Docker, etc.) —
    // Chromium refuses to launch as root without these flags.
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage({
      deviceScaleFactor: 3, // 300 DPI equivalent, per SOP
    });
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      width: "5in",
      height: "7in",
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      printBackground: true,
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { renderPdf };
