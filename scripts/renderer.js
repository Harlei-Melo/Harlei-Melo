// scripts/renderer.js

// Função para gerar estrelas com brilho variável
const generateStars = (width, height, count) => {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5;
    const opacity = Math.random();
    const duration = 2 + Math.random() * 4;
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}">
      <animate attributeName="opacity" values="${opacity};0.1;${opacity}" dur="${duration}s" repeatCount="indefinite" />
    </circle>`;
  }
  return stars;
};

// Função principal de renderização
export const renderBlackHole = (username, color) => {
  const width = 800;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  
  // Cores derivadas para gradientes
  const colorBright = '#ffffff'; // Núcleo quente
  const colorDeep = color;       // Cor da linguagem

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #050505; border-radius: 6px;">
    <defs>
      <filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feGaussianBlur stdDeviation="10" result="softBlur" />
        <feMerge>
          <feMergeNode in="softBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <linearGradient id="diskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${colorDeep}" stop-opacity="0.1" />
        <stop offset="40%" stop-color="${colorDeep}" stop-opacity="0.8" />
        <stop offset="50%" stop-color="${colorBright}" stop-opacity="1" />
        <stop offset="60%" stop-color="${colorDeep}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${colorDeep}" stop-opacity="0.1" />
      </linearGradient>

      <radialGradient id="sphereGrad" cx="50%" cy="50%" r="50%">
        <stop offset="85%" stop-color="black" />
        <stop offset="100%" stop-color="${colorDeep}" stop-opacity="0.3" />
      </radialGradient>
    </defs>

    ${generateStars(width, height, 100)}

    <g transform="translate(${cx}, ${cy})">

      <g filter="url(#neonGlow)" opacity="0.6">
        <path d="M -200 10 Q 0 -180 200 10 L 180 20 Q 0 -140 -180 20 Z" fill="url(#diskGrad)" opacity="0.4">
           <animate attributeName="opacity" values="0.3;0.5;0.3" dur="5s" repeatCount="indefinite" />
        </path>
         <path d="M -180 15 Q 0 120 180 15 L 160 10 Q 0 90 -160 10 Z" fill="url(#diskGrad)" opacity="0.3" />
      </g>

      <circle r="75" fill="black" stroke="${colorBright}" stroke-width="1" opacity="1">
         <animate attributeName="stroke-width" values="1;2;1" dur="3s" repeatCount="indefinite" />
         <animate attributeName="stroke" values="${colorBright};${colorDeep};${colorBright}" dur="8s" repeatCount="indefinite" />
      </circle>

      <g transform="rotate(10)">
        <g filter="url(#neonGlow)">
          ${generateAccretionRings(colorDeep)}
        </g>
      </g>

    </g>
    
    <text x="780" y="380" text-anchor="end" fill="white" font-family="monospace" font-size="10" opacity="0.2">
      SINGULARITY // ${color}
    </text>
  </svg>
  `;
};

// Gerador de anéis orbitais com física simulada (Dash Offset Animation)
const generateAccretionRings = (color) => {
  let rings = '';
  // Criamos vários anéis elípticos
  // rx = largura, ry = altura (achatada para perspectiva)
  const config = [
    { rx: 110, ry: 20, width: 4, speed: 20, opacity: 0.9 },
    { rx: 140, ry: 28, width: 8, speed: 35, opacity: 0.6 },
    { rx: 180, ry: 35, width: 2, speed: 50, opacity: 0.4 },
    { rx: 220, ry: 45, width: 1, speed: 60, opacity: 0.2 },
  ];

  config.forEach((c) => {
    // Cálculo do dasharray para parecer matéria girando
    const dash = c.rx * 2; 
    rings += `
      <ellipse rx="${c.rx}" ry="${c.ry}" fill="none" stroke="url(#diskGrad)" stroke-width="${c.width}" opacity="${c.opacity}">
        <animate attributeName="stroke-dasharray" values="${dash} ${dash}; ${dash/2} ${dash/2}" dur="${c.speed}s" repeatCount="indefinite" />
        <animate attributeName="stroke-dashoffset" from="${dash * 10}" to="0" dur="${c.speed}s" repeatCount="indefinite" />
      </ellipse>
    `;
  });
  
  return rings;
};