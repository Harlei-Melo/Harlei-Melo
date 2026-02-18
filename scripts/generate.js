import fs from "fs";
import "dotenv/config";

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || "SpaceExplorer";

async function fetchGithubData() {
  if (!TOKEN) return { color: "#4F46E5", langName: "Unknown" }; // Cor fallback (Indigo)

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
      "N/A",
    );
    const color =
      repos.find((r) => r.languages.edges[0]?.node.name === topLang)?.languages
        .edges[0].node.color || "#4F46E5";

    return { color, langName: topLang };
  } catch (e) {
    return { color: "#4F46E5", langName: "Error" };
  }
}

// Função auxiliar para gerar estrelas
function generateStars(count, speedBase, opacityBase, sizeBase) {
  let stars = "";
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 850 - 25; // Margem de sangria
    const y = Math.random() * 450 - 25;
    const r = Math.random() * sizeBase;
    const opacity = Math.random() * opacityBase + 0.1;
    const duration = speedBase + Math.random() * 5;
    const delay = Math.random() * -5;
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}">
                <animate attributeName="opacity" values="${opacity};${opacity * 0.2};${opacity}" dur="${duration}s" begin="${delay}s" repeatCount="indefinite" />
              </circle>`;
  }
  return stars;
}

(async () => {
  const { color, langName } = await fetchGithubData();
  console.log(`🎨 Gerando Design High-End com a cor: ${color}`);

  // Gerando 3 camadas de estrelas para profundidade
  const starsBack = generateStars(100, 8, 0.4, 1.2);
  const starsMid = generateStars(50, 5, 0.7, 1.8);
  const starsFront = generateStars(20, 3, 1.0, 2.5);

  const svgContent = `
  <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="background-color: #030610; border-radius: 12px;">
    <defs>
      <filter id="superGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur1" />
        <feGaussianBlur stdDeviation="8" result="blur2" />
        <feGaussianBlur stdDeviation="16" result="blur3" />
        <feMerge>
          <feMergeNode in="blur3"/>
          <feMergeNode in="blur2"/>
          <feMergeNode in="blur1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <radialGradient id="diskGradient">
        <stop offset="40%" stop-color="${color}" stop-opacity="0" />
        <stop offset="60%" stop-color="${color}" stop-opacity="0.8" />
        <stop offset="75%" stop-color="white" stop-opacity="0.9" />
        <stop offset="90%" stop-color="${color}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
      </radialGradient>

      <linearGradient id="flareGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0" />
        <stop offset="40%" stop-color="${color}" stop-opacity="0.6" />
        <stop offset="50%" stop-color="white" stop-opacity="1" />
        <stop offset="60%" stop-color="${color}" stop-opacity="0.6" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
      </linearGradient>
    </defs>

    <radialGradient id="bgVignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0a0e1f" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#000000" stop-opacity="1" />
    </radialGradient>
    <rect width="800" height="400" fill="url(#bgVignette)" />
    
    <g>${starsBack}</g>
    <g>${starsMid}</g>
    
    <g transform="translate(400, 200)">
      
      <g filter="url(#superGlow)" opacity="0.9">
        <g>
           <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="60s" repeatCount="indefinite" />
           <ellipse rx="180" ry="45" fill="url(#diskGradient)" opacity="0.5" />
        </g>
        <g>
           <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="35s" repeatCount="indefinite" />
           <ellipse rx="160" ry="35" fill="url(#diskGradient)" opacity="0.7" />
           <ellipse rx="165" ry="38" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="5, 10" opacity="0.4" />
        </g>
        <g>
           <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
           <ellipse rx="130" ry="25" fill="url(#diskGradient)" stroke="white" stroke-width="1" opacity="0.9" />
        </g>
      </g>

      <rect x="-300" y="-2" width="600" height="4" fill="url(#flareGradient)" opacity="0.7" filter="url(#superGlow)">
        <animate attributeName="opacity" values="0.6;0.8;0.6" dur="5s" repeatCount="indefinite" />
      </rect>

      <circle r="70" fill="#000000" stroke="${color}" stroke-width="4" filter="url(#superGlow)">
         <animate attributeName="r" values="70;71;70" dur="3s" repeatCount="indefinite" />
         <animate attributeName="stroke-width" values="4;6;4" dur="3s" repeatCount="indefinite" />
      </circle>

    </g>

    <g>${starsFront}</g>

    <g transform="translate(30, 360)">
        <path d="M 0 20 L 20 20 L 30 0" fill="none" stroke="${color}" stroke-width="2" opacity="0.7" />
        <rect x="0" y="0" width="4" height="20" fill="${color}" opacity="0.8" />
        
        <text x="40" y="15" fill="white" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-weight="300" font-size="12" letter-spacing="2" opacity="0.7">
            DOMINANT LANGUAGE DETECTED
        </text>
        <text x="40" y="32" fill="${color}" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-weight="bold" font-size="16" letter-spacing="1" filter="url(#superGlow)">
            ${langName.toUpperCase()} <tspan fill="white" opacity="0.5">///</tspan> ACTIVE
        </text>
    </g>
    
    <text x="780" y="385" text-anchor="end" fill="white" font-family="monospace" font-size="10" opacity="0.3">
      GALAXY.SYS // USER: ${USERNAME.toUpperCase()}
    </text>
  </svg>
  `;

  fs.writeFileSync("github-profile.svg", svgContent.trim());
  console.log("✨ Design High-End gerado com sucesso!");
})();
