import puppeteer from "puppeteer";
import GifEncoder from "gif-encoder";
import { PNG } from "pngjs";
import fs from "fs";
import "dotenv/config";

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;

const query = `query($login: String!) {user(login: $login) {contributionsCollection {contributionCalendar {totalContributions}} repositories(first: 20, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {nodes {languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {edges {node {name color}}}}}}}`;

async function fetchGithubData() {
  if (!TOKEN || !USERNAME) return { contributions: 500, color: "#00B4AB" };
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: USERNAME } }),
    });
    const json = await response.json();
    if (json.errors) return { contributions: 0, color: "#ffaa00" };
    const total =
      json.data.user.contributionsCollection.contributionCalendar
        .totalContributions;
    const repos = json.data.user.repositories.nodes;
    const langStats = {};
    repos.forEach((r) => {
      if (r.languages.edges[0])
        langStats[r.languages.edges[0].node.name] =
          (langStats[r.languages.edges[0].node.name] || 0) + 1;
    });
    const topLang = Object.keys(langStats).reduce(
      (a, b) => (langStats[a] > langStats[b] ? a : b),
      "Unknown",
    );
    const color =
      repos.find((r) => r.languages.edges[0]?.node.name === topLang)?.languages
        .edges[0].node.color || "#ffaa00";
    return { contributions: total, color: color };
  } catch (e) {
    return { contributions: 500, color: "#ffaa00" };
  }
}

(async () => {
  const data = await fetchGithubData();
  const activity = Math.min(
    Math.max(data.contributions / 200, 1.0),
    10,
  ).toFixed(2);
  const color = data.color.replace("#", "");
  console.log(`🎬 Iniciando GIF para ${USERNAME} (Modo: ANGLE+SwiftShader)`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      // --- A NOVA ESTRATÉGIA ---
      "--use-gl=angle", // Usa a camada de compatibilidade ANGLE
      "--use-angle=swiftshader", // Força o ANGLE a usar CPU (SwiftShader)
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--disable-web-security",
      "--mute-audio",
    ],
  });

  const page = await browser.newPage();

  // Logs para debug
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.toString()));

  await page.setViewport({ width: 800, height: 400, deviceScaleFactor: 1 });

  try {
    const url = `http://127.0.0.1:5173/?color=${color}&activity=${activity}`;
    console.log(`Navegando para: ${url}`);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("⏳ Aguardando renderização (6s)...");
    await new Promise((r) => setTimeout(r, 6000));

    // Verificação se o WebGL carregou
    const canvasCheck = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return "NO CANVAS";
      const gl = canvas.getContext("webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = debugInfo
          ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          : "Desconhecido";
        return `WEBGL OK (${renderer})`;
      }
      return "WEBGL FALHOU";
    });
    console.log(`STATUS GRÁFICO: ${canvasCheck}`);

    if (canvasCheck.includes("FALHOU")) {
      throw new Error("WebGL não foi ativado pelo navegador.");
    }

    const encoder = new GifEncoder(800, 400);
    const file = fs.createWriteStream("github-profile.gif");
    encoder.pipe(file);
    encoder.setRepeat(0);
    encoder.setDelay(150);
    encoder.setQuality(20);
    encoder.writeHeader();

    console.log("🎥 Gravando frames...");
    for (let i = 0; i < 20; i++) {
      const buffer = await page.screenshot();
      const png = PNG.sync.read(buffer);
      encoder.addFrame(png.data);
      await new Promise((r) => setTimeout(r, 100));
    }

    encoder.finish();
    console.log("✅ GIF Salvo!");
  } catch (e) {
    console.error("❌ Erro no script:", e);
    process.exit(1);
  }
  await browser.close();
})();
