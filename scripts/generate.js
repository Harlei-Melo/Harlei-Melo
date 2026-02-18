// scripts/generate.js
import fs from "fs";
import "dotenv/config";
import { renderBlackHole } from "./renderer.js";

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || "Traveler";

async function fetchGithubData() {
  if (!TOKEN) return { color: "#b392f0" }; // Cor Fallback

  const query = `query($login: String!) {user(login: $login) {repositories(first: 50, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {nodes {languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {edges {node {name color}}}}}}}`;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: USERNAME } }),
    });
    const json = await res.json();

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
        .edges[0].node.color || "#b392f0";

    return { color };
  } catch (e) {
    return { color: "#b392f0" };
  }
}

(async () => {
  console.log("🔭 Iniciando telescópio de eventos...");
  const { color } = await fetchGithubData();

  console.log(`🎨 Detectado espectro de cor: ${color}`);
  const svg = renderBlackHole(USERNAME, color);

  fs.writeFileSync("github-profile.svg", svg.trim());
  console.log("✅ Renderização concluída: github-profile.svg");
})();
