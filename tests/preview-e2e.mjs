import { chromium } from "playwright";
import assert from "node:assert/strict";

const url = "https://nexus-ai-git-feat-nexus-futuristic-open-chat-simi23.vercel.app";
const redPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAK0lEQVR4nO3NQQEAAATAQATRP5QwSvC7BdjldMdn9XoHAAAAAAAAAAAAhy3SgAFYpLG4gwAAAABJRU5ErkJggg==", "base64");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.querySelector("#providerStatus")?.textContent.includes("OpenRouter"), { timeout: 30000 });

  await page.locator("#prompt").fill("Responde exactamente E2E_UI_OK y nada más.");
  await page.locator("#sendBtn").click();
  assert.equal(await page.locator("#sendBtn").isDisabled(), true, "Enviar debe bloquearse mientras responde");
  await page.waitForFunction(() => document.querySelector("#chatlog")?.innerText.includes("E2E_UI_OK"), { timeout: 90000 });
  await page.waitForFunction(() => !document.querySelector("#sendBtn")?.disabled, { timeout: 10000 });

  await page.locator("#fileInput").setInputFiles({ name: "prueba-roja.png", mimeType: "image/png", buffer: redPng });
  await page.waitForFunction(() => document.querySelector("#filelist")?.innerText.includes("Imagen optimizada"), { timeout: 30000 });
  await page.locator("#prompt").fill("¿Qué color predomina en la imagen adjunta? Responde con una sola palabra.");
  await page.locator("#sendBtn").click();
  assert.equal(await page.locator("#sendBtn").isDisabled(), true, "Enviar debe bloquearse durante el análisis de imagen");
  await page.waitForFunction(() => document.querySelector("#chatlog")?.innerText.toLowerCase().includes("roj"), { timeout: 90000 });
  await page.waitForFunction(() => !document.querySelector("#sendBtn")?.disabled, { timeout: 10000 });

  const fitsMobile = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert.equal(fitsMobile, true, "La interfaz móvil no debe generar scroll horizontal");
  assert.deepEqual(errors, [], "La página no debe lanzar errores JavaScript");
  console.log("Mobile UI, chat streaming, send lock, image attachment and visual analysis: PASS");
} finally {
  await browser.close();
}
