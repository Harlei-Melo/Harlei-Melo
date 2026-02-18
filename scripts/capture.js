import puppeteer from "puppeteer";
import GifEncoder from "gif-encoder";
import { PNG } from "pngjs";
import fs from "fs";
import "dotenv/config";

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;

// ... (Mantenha a função fetchGithubData igual, não precisa mudar) ...
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
  console.log(`🎬 Iniciando GIF para ${USERNAME}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=swiftshader",
      "--disable-web-security",
      "--mute-audio",
    ],
  });

  const page = await browser.newPage();

  // --- NOVIDADE: O Espião ---
  // Isso vai mostrar no terminal do GitHub Actions qualquer erro do React/Three.js
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.toString()));
  // --------------------------

  await page.setViewport({ width: 800, height: 400, deviceScaleFactor: 1 });

  try {
    const url = `http://127.0.0.1:5173/?color=${color}&activity=${activity}`;
    console.log(`Navegando para: ${url}`);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("⏳ Aguardando renderização (6s)...");
    await new Promise((r) => setTimeout(r, 6000));

    // Verificação de segurança: O Canvas existe?
    const canvasExists = await page.$("canvas");
    if (!canvasExists) {
      console.error(
        "❌ ERRO FATAL: Nenhum elemento <canvas> encontrado na página!",
      );
      // Tira print do erro
      await page.screenshot({ path: "debug-error.png" });
      process.exit(1);
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
