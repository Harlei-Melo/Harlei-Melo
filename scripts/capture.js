import puppeteer from "puppeteer";
import GIFEncoder from "gif-encoder";
import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

// --- CONFIGURAÇÕES ---
const WIDTH = 800; // Largura do GIF
const HEIGHT = 450; // Altura do GIF
const FRAMES = 60; // Total de frames (loop suave)
const DURATION = 2; // Segundos de loop
const OUTPUT_FILE = "github-profile.gif";
const URL = "http://127.0.0.1:5173";

async function capture() {
  console.log("🚀 Iniciando Protocolo de Captura...");

  // 1. Inicia o Browser com configurações de segurança para CI/CD
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // <--- MODIFICAÇÃO IMPORTANTE AQUI
  });
  const page = await browser.newPage();

  // Define o tamanho EXATO da viewport
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  console.log(`🔗 Conectando a ${URL}...`);
  try {
    await page.goto(URL, { waitUntil: "networkidle0" });
  } catch (e) {
    console.error(
      "❌ Erro: O servidor Vite parece desligado. Rode 'npm run dev' em outro terminal primeiro!",
    );
    process.exit(1);
  }

  // Prepara o GIF Encoder
  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const fileStream = fs.createWriteStream(OUTPUT_FILE);

  // Pipe: Encoder -> Arquivo
  encoder.pipe(fileStream);
  encoder.writeHeader();
  encoder.setRepeat(0); // 0 = Loop infinito
  encoder.setDelay((DURATION / FRAMES) * 1000); // Delay em ms
  encoder.setQuality(10); // Qualidade (10 é bom compromisso, 1 é melhor mas lento)

  // Oculta barras de rolagem e define flag de captura
  await page.evaluate(() => {
    document.body.style.overflow = "hidden";
    document.body.style.background = "#000";
    window.isCapturing = true; // Trava o useFrame do React
  });

  console.log("🎥 Gravando frames...");

  for (let i = 0; i < FRAMES; i++) {
    // Calcula o tempo exato deste frame
    const time = (i / FRAMES) * (Math.PI * 2); // Ciclo perfeito para funções trigonométricas

    // Manda o React ir para esse tempo exato
    await page.evaluate((t) => {
      if (window.seekAnimation) window.seekAnimation(t);
    }, time);

    // Tira o screenshot (Buffer)
    const screenshotBuffer = await page.screenshot({
      type: "png",
      omitBackground: true,
    });

    // Decodifica o PNG para obter os pixels brutos (RGBA)
    const pixels = await new Promise((resolve, reject) => {
      new PNG().parse(screenshotBuffer, (error, data) => {
        if (error) reject(error);
        else resolve(data.data); // data.data é o Uint8Array de pixels
      });
    });

    // Adiciona o frame ao GIF
    encoder.addFrame(pixels);

    // Barra de progresso simples
    process.stdout.write(`\r📸 Processando Frame ${i + 1}/${FRAMES}`);
  }

  encoder.finish();
  await browser.close();

  console.log(
    `\n\n✅ Sucesso Absoluto! GIF salvo em: ${path.resolve(OUTPUT_FILE)}`,
  );
  console.log(
    `📂 Tamanho: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`,
  );
}

capture();
