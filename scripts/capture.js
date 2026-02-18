import puppeteer from "puppeteer";
import GIFEncoder from "gif-encoder";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

// Configurações
const WIDTH = 800;
const HEIGHT = 450;

// CÁLCULO DO NOVO CICLO:
// 5 Cores * 5 Segundos cada = 25 Segundos de Loop
const DURATION = 25;

// 25s * 15fps = 375 frames
// 15fps é suficiente para slow motion e mantém o GIF leve
const FRAMES = 375;

const OUTPUT_FILE = "github-profile.gif";
const URL = "http://127.0.0.1:5173";

async function capture() {
  console.log("🚀 Iniciando Captura Cinematic Slow (25s Loop)...");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: WIDTH, height: HEIGHT });

  console.log(`🔗 Conectando a ${URL}...`);
  try {
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (e) {
    console.error("❌ ERRO CONEXÃO:");
    console.error(e);
    await browser.close();
    process.exit(1);
  }

  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const fileStream = fs.createWriteStream(OUTPUT_FILE);

  encoder.pipe(fileStream);
  encoder.writeHeader();
  encoder.setRepeat(0);
  encoder.setDelay((DURATION / FRAMES) * 1000);
  encoder.setQuality(10);

  await page.evaluate(() => {
    document.body.style.overflow = "hidden";
    document.body.style.background = "#000";
    window.isCapturing = true;
  });

  console.log("🎥 Gravando frames...");

  for (let i = 0; i < FRAMES; i++) {
    const time = (i / FRAMES) * DURATION;

    await page.evaluate((t) => {
      if (window.seekAnimation) window.seekAnimation(t);
    }, time);

    const screenshotBuffer = await page.screenshot({
      type: "png",
      omitBackground: true,
    });

    const pixels = await new Promise((resolve, reject) => {
      new PNG().parse(screenshotBuffer, (error, data) => {
        if (error) reject(error);
        else resolve(data.data);
      });
    });

    encoder.addFrame(pixels);
    process.stdout.write(`\r📸 Frame ${i + 1}/${FRAMES}`);
  }

  encoder.finish();
  await browser.close();
  console.log(`\n✅ GIF Salvo: ${path.resolve(OUTPUT_FILE)}`);
}

capture();
