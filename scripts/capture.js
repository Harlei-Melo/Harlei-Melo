import puppeteer from "puppeteer";
import GIFEncoder from "gif-encoder";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

const WIDTH = 800;
const HEIGHT = 450;

// 5 Cores * 6 Segundos = 30 Segundos de Loop Completo
const DURATION = 30;

// 30s * 12fps = 360 frames
// 12 FPS é suficiente para "Cinematic Feel" e mantém o arquivo leve (<10MB)
const FRAMES = 360;

const OUTPUT_FILE = "github-profile.gif";
const URL = "http://127.0.0.1:5173";

async function capture() {
  console.log("🚀 Iniciando Captura Slow-Motion (30s Loop)...");

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
    window.isCapturing = true; // Trava o loop do React
  });

  console.log("🎥 Gravando frames...");

  for (let i = 0; i < FRAMES; i++) {
    // Calculamos o tempo exato
    const time = (i / FRAMES) * DURATION;

    await page.evaluate((t) => {
      // O shader espera receber o tempo já processado para rotação
      // Mas nossa função updateColor dentro do BlackHole espera o tempo "cru"
      // Então passamos o tempo simulado da animação
      // Nota: No BlackHole.jsx, ajustamos o seekAnimation para lidar com isso.
      if (window.seekAnimation) window.seekAnimation(t * 0.1); // *0.1 simula o safeSpeed
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
