import puppeteer from "puppeteer";
import GifEncoder from "gif-encoder"; // Mudou de 'gifencoder' para 'gif-encoder'
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
  console.log(`🎬 Iniciando GIF (Pure JS) para ${USERNAME} (Cor: #${color})`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=swiftshader",
      "--disable-web-security",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 400 });

  try {
    // Usando IP direto
    await page.goto(
      `http://127.0.0.1:5173/?color=${color}&activity=${activity}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      },
    );

    console.log("⏳ Esperando carregamento (5s)...");
    await new Promise((r) => setTimeout(r, 5000));

    // --- MUDANÇA AQUI: Configuração do gif-encoder ---
    const encoder = new GifEncoder(800, 400);
    const file = fs.createWriteStream("github-profile.gif");
    encoder.pipe(file);

    encoder.setRepeat(0); // Loop infinito
    encoder.setDelay(150); // Delay entre frames
    encoder.setQuality(20); // Qualidade
    encoder.writeHeader(); // Importante: gif-encoder exige escrever o cabeçalho explicitamente

    console.log("🎥 Gravando frames...");
    for (let i = 0; i < 20; i++) {
      const buffer = await page.screenshot({ omitBackground: true });
      const png = PNG.sync.read(buffer);

      // O pngjs retorna RGBA, e o gif-encoder aceita isso perfeitamente
      encoder.addFrame(png.data);

      await new Promise((r) => setTimeout(r, 100));
    }

    encoder.finish();
    console.log("✅ GIF Salvo com sucesso!");
  } catch (e) {
    console.error("❌ Erro:", e);
    process.exit(1);
  }
  await browser.close();
})();
