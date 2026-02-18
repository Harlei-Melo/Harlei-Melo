// scripts/renderer.js

// 1. Gerador de Partículas de Matéria (Poeira Cósmica)
// Menores, mais rápidas e com rastros (trails) para realismo
const generateDust = (count, width, height) => {
  let dust = "";
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < count; i++) {
    // Distribuição não-uniforme (mais densa perto do centro)
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 250;
    const r = Math.random() * 0.8 + 0.2;
    const dur = 4 + Math.random() * 6;
    const delay = -(Math.random() * 10);

    dust += `
      <circle r="${r}" fill="white" opacity="0.6">
        <animateMotion 
          path="M ${Math.cos(angle) * dist} ${Math.sin(angle) * dist} Q ${Math.cos(angle + 1) * dist * 0.5} ${Math.sin(angle + 1) * dist * 0.5} 0 0" 
          dur="${dur}s" 
          begin="${delay}s" 
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 1 1"
        />
        <animate attributeName="opacity" values="0;0.8;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
      </circle>
    `;
  }
  return dust;
};

export const renderBlackHole = (username, color) => {
  const width = 850;
  const height = 450;
  const cx = width / 2;
  const cy = height / 2;

  // Cor base ajustada para luminosidade
  const mainColor = color || "#ff6600";
  // Lado "Blue Shift" (Aproximação - Mais quente/branco)
  const dopplerBright = "#ffffff";

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: #030303;">
    <defs>
      <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <filter id="intenseBloom" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="12" result="blur1" />
        <feGaussianBlur stdDeviation="25" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <linearGradient id="dopplerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${dopplerBright}" stop-opacity="0.9" />
        <stop offset="30%" stop-color="${mainColor}" stop-opacity="0.8" />
        <stop offset="70%" stop-color="${mainColor}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.1" />
      </linearGradient>

      <linearGradient id="lensingGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="${mainColor}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${mainColor}" stop-opacity="0.0" />
      </linearGradient>
      
      <mask id="holeMask">
        <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
        <circle cx="${cx}"Kf cy="${cy}" r="78" fill="black" />
      </mask>
    </defs>

    <g transform="translate(${cx}, ${cy})">
       ${generateDust(50, width, height)}
    </g>

    <g transform="translate(${cx}, ${cy})" filter="url(#intenseBloom)">
      
      <path d="M -240 0 C -220 -160 220 -160 240 0 L 220 0 C 200 -130 -200 -130 -220 0 Z" 
            fill="url(#lensingGrad)" opacity="0.6">
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="6s" repeatCount="indefinite" />
      </path>

      <ellipse rx="260" ry="18" fill="none" stroke="url(#dopplerGrad)" stroke-width="28" mask="url(#holeMask)">
         <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="20s" repeatCount="indefinite" />
      </ellipse>
      
      <ellipse rx="100" ry="85" fill="none" stroke="white" stroke-width="1.5" opacity="0.4" filter="url(#softGlow)">
         <animate attributeName="opacity" values="0.3;0.6;0.3" dur="0.15s" repeatCount="indefinite" />
      </ellipse>

    </g>

    <circle cx="${cx}" cy="${cy}" r="79" fill="black" />
    
    <circle cx="${cx}" cy="${cy}" r="80" fill="none" stroke="white" stroke-width="1" opacity="0.8" filter="url(#softGlow)" />

  </svg>
  `;
};
