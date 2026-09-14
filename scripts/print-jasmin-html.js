/**
 * One-off: the already-perfect print/jasmin HTML → two 5×7 PDFs.
 * Relative jasmin.jpg / jasmin-qr.png load via file:// so Playwright sees them.
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const htmlPath = path.resolve(__dirname, "../print/jasmin-emilia-0001.html");
const outDir = path.resolve(__dirname, "../print");
const fileUrl = pathToFileURL(htmlPath).href;

async function pdfForLang(page, lang) {
  await page.evaluate((keep) => {
    document.querySelectorAll("section.sign").forEach((el) => {
      el.style.display = el.getAttribute("lang") === keep ? "" : "none";
    });
    document.body.style.background = "none";
    document.body.style.margin = "0";
  }, lang);

  return page.pdf({
    width: "5in",
    height: "7in",
    margin: { top: "0", bottom: "0", left: "0", right: "0" },
    printBackground: true,
  });
}

(async () => {
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage({ deviceScaleFactor: 3 });
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  const en = await pdfForLang(page, "en");
  const es = await pdfForLang(page, "es");
  await browser.close();

  const enPath = path.join(outDir, "QR_EN_jasmin-emilia-0001.pdf");
  const esPath = path.join(outDir, "QR_ES_jasmin-emilia-0001.pdf");
  fs.writeFileSync(enPath, en);
  fs.writeFileSync(esPath, es);
  console.log(
    JSON.stringify({
      ok: true,
      en_bytes: en.length,
      es_bytes: es.length,
      en: enPath,
      es: esPath,
    }),
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
