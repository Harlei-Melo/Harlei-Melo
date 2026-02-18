import fs from "fs";
import "dotenv/config";

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;

async function fetchGithubData() {
  if (!TOKEN || !USERNAME) return { color: "#00B4AB" };

  const query = `query($login: String!) {user(login: $login) {repositories(first: 20, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {nodes {languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {edges {node {name color}}}}}}}`;

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

    // Lógica de cor (mantida)
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
        .edges[0].node.color || "#00B4AB";

    return { color };
  } catch (e) {
    return { color: "#00B4AB" };
  }
}

(async () => {
  const { color } = await fetchGithubData();
  console.log(`🎨 Gerando Buraco Negro com a cor: ${color}`);

  // Gera estrelas aleatórias
  let stars = "";
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 400;
    const r = Math.random() * 1.5;
    const opacity = Math.random();
    // Animação de piscar individual
    const duration = 2 + Math.random() * 3;
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}">
                <animate attributeName="opacity" values="${opacity};0;${opacity}" dur="${duration}s" repeatCount="indefinite" />
              </circle>`;
  }

  const svgContent = `
  <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <radialGradient id="holeGradient">
        <stop offset="70%" stop-color="black" />
        <stop offset="95%" stop-color="${color}" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </radialGradient>
    </defs>

    <rect width="800" height="400" fill="#0d1117" />
    
    ${stars}

    <g transform="translate(400, 200)">
      
      <g opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
        <ellipse rx="160" ry="40" fill="none" stroke="${color}" stroke-width="2" filter="url(#glow)" opacity="0.3" />
        <ellipse rx="140" ry="35" fill="none" stroke="${color}" stroke-width="4" filter="url(#glow)" opacity="0.5" />
        <ellipse rx="110" ry="25" fill="none" stroke="white" stroke-width="1" opacity="0.2" />
      </g>

      <circle r="60" fill="black" stroke="${color}" stroke-width="3" filter="url(#glow)">
         <animate attributeName="r" values="60;62;60" dur="4s" repeatCount="indefinite" />
      </circle>

    </g>

    <text x="20" y="380" fill="${color}" font-family="monospace" font-size="14" opacity="0.8">
      Dominant Language: ${color} (Detected)
    </text>
  </svg>
  `;

  fs.writeFileSync("github-profile.svg", svgContent.trim());
  console.log("✅ github-profile.svg gerado com sucesso!");
})();
