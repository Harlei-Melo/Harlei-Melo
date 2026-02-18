import fs from "fs";
import "dotenv/config";

const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || "User";

async function fetchGithubData() {
  if (!TOKEN) return { color: "#6e40c9" }; // Roxo padrão se falhar

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

    // Lógica para detectar cor dominante
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
        .edges[0].node.color || "#6e40c9";

    return { color };
  } catch (e) {
    return { color: "#6e40c9" };
  }
}

// --- MATEMÁTICA: Gerador de Espiral Logarítmica ---
// Gera um caminho SVG que começa longe e cai para o centro
function calculateSpiralPath(
  startRadius,
  endRadius,
  rotations,
  startAngleOffset,
) {
  let path = `M `;
  const points = 100; // Resolução da curva
  const angleStep = (Math.PI * 2 * rotations) / points;

  // Parâmetro de decaimento logarítmico
  // r = a * e^(k * theta)
  // Calculamos k para que no final das rotações, o raio seja endRadius
  const totalAngle = Math.PI * 2 * rotations;
  const k = Math.log(endRadius / startRadius) / totalAngle;

  for (let i = 0; i <= points; i++) {
    const theta = i * angleStep;
    const radius = startRadius * Math.exp(k * theta);

    // Aplicar rotação inicial e achatamento para perspectiva 3D (elipse)
    const finalAngle = theta + startAngleOffset;
    const x = Math.cos(finalAngle) * radius;
    const y = Math.sin(finalAngle) * radius * 0.25; // 0.25 achata o Y (perspectiva de disco)

    // Adiciona ao caminho SVG
    path += `${400 + x} ${200 + y} `;
    if (i < points) path += `L `;
  }
  return path;
}

// Gera estrelas de fundo estáticas e piscantes
function generateStars(count) {
  let stars = "";
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 800;
    const y = Math.random() * 400;
    const r = Math.random() * 1.2;
    const opacity = Math.random() * 0.8;
    // Cintilação
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}">
       <animate attributeName="opacity" values="${opacity};${opacity * 0.3};${opacity}" dur="${Math.random() * 3 + 2}s" repeatCount="indefinite" />
    </circle>`;
  }
  return stars;
}

(async () => {
  const { color } = await fetchGithubData();
  console.log(`🌌 Gerando Vórtice Matemático com a cor: ${color}`);

  // 1. Gerar Braços da Espiral (O Vórtice)
  // Criamos vários caminhos espirais rotacionados para preencher o disco
  let accretionDisk = "";
  const arms = 12; // Quantidade de braços na espiral

  for (let i = 0; i < arms; i++) {
    const angleOffset = ((Math.PI * 2) / arms) * i;
    // Espiral vai do raio 300 (fora) até 65 (perto do horizonte de eventos)
    const pathData = calculateSpiralPath(350, 65, 1.5, angleOffset);

    // Animação de Fluxo: Stroke-dashoffset faz a linha "andar" para dentro
    // Stroke-width variável para parecer que afina ao cair
    accretionDisk += `
      <path d="${pathData}" fill="none" stroke="${color}" stroke-width="${Math.random() * 2 + 0.5}" stroke-linecap="round" opacity="0.6">
        <animate attributeName="stroke-dasharray" values="0 100; 50 150; 0 100" dur="${Math.random() * 5 + 5}s" repeatCount="indefinite" />
        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="${Math.random() * 3 + 4}s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.8;0" dur="${Math.random() * 3 + 4}s" repeatCount="indefinite" />
      </path>
    `;
  }

  // 2. O Horizonte de Eventos (O Buraco Negro)
  // Um brilho atrás e o círculo preto na frente
  const blackHole = `
    <ellipse cx="400" cy="200" rx="72" ry="18" fill="none" stroke="${color}" stroke-width="2" filter="url(#glow)">
       <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4s" repeatCount="indefinite" />
    </ellipse>
    
    <ellipse cx="400" cy="200" rx="65" ry="16" fill="#000000" stroke="${color}" stroke-width="1" />
  `;

  const svgContent = `
  <svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="background-color: #050505; border-radius: 6px;">
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <linearGradient id="doppler" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.2" />
        <stop offset="50%" stop-color="${color}" stop-opacity="1" /> <stop offset="100%" stop-color="${color}" stop-opacity="0.2" />
      </linearGradient>
    </defs>

    ${generateStars(80)}

    <g filter="url(#glow)">
      ${accretionDisk}
    </g>

    ${blackHole}
    
    </svg>
  `;

  fs.writeFileSync("github-profile.svg", svgContent.trim());
  console.log("Math-based Vortex Generated! 🕳️");
})();
