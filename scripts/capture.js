import puppeteer from "puppeteer";
import GIFEncoder from "gif-encoder";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

// --- CONFIGURAÇÕES DO CICLO COMPLETO ---
const WIDTH = 800;
const HEIGHT = 450;

// Ajustado para capturar todas as cores (5 techs * 3s = 15s)
const DURATION = 15;
// 15s * 20fps = 300 frames (Qualidade fluida, tamanho aceitável)
const FRAMES = 300;

const OUTPUT_FILE = "github-profile.gif";
// Mantivemos o IP direto para garantir conexão no GitHub Actions
const URL = "http://127.0.0.1:5173";

async function capture() {
  console.log("🚀 Iniciando Protocolo de Captura (Full Cycle)...");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: WIDTH, height: HEIGHT });

  console.log(`🔗 Conectando a ${URL}...`);
  try {
    // Timeout robusto para garantir que o servidor (http-server) responda
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (e) {
    console.error("❌ ERRO FATAL AO CONECTAR:");
    console.error(e);
    await browser.close();
    process.exit(1);
  }

  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const fileStream = fs.createWriteStream(OUTPUT_FILE);

  encoder.pipe(fileStream);
  encoder.writeHeader();
  encoder.setRepeat(0); // Loop infinito
  encoder.setDelay((DURATION / FRAMES) * 1000); // Delay calculado automaticamente
  encoder.setQuality(10); // 10 é um bom equilíbrio entre tamanho e qualidade

  // Prepara a página para gravação (fundo preto, sem scroll)
  await page.evaluate(() => {
    document.body.style.overflow = "hidden";
    document.body.style.background = "#000";
    window.isCapturing = true; // Trava o loop de renderização do React
  });

  console.log("🎥 Gravando frames...");

  for (let i = 0; i < FRAMES; i++) {
    // Mapeia o progresso do frame (0 a 1) para o ciclo total de tempo (0 a 15s)
    // Nota: Multiplicamos por DURATION aqui se o seu shader usa segundos reais,
    // ou mantemos a lógica de fase se o shader espera uTime.
    // Como seu shader usa 'uTime' em segundos, vamos passar o tempo real:
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
    process.stdout.write(`\r📸 Processando Frame ${i + 1}/${FRAMES}`);
  }

  encoder.finish();
  await browser.close();

  console.log(
    `\n\n✅ Sucesso Absoluto! GIF salvo em: ${path.resolve(OUTPUT_FILE)}`,
  );
}

capture();
