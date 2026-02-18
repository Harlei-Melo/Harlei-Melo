// scripts/renderer.js

// 1. Simulação de Fluxo de Matéria (Spaghettification)
// Partículas que se alongam e aceleram em direção ao centro
const generateSpaghettiStars = (count, cx, cy) => {
  let stars = "";
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const startDist = 200 + Math.random() * 200;
    const duration = 2 + Math.random() * 3;
    const delay = -(Math.random() * 10);

    stars += `
      <ellipse fill="white" opacity="0">
        <animateMotion 
          path="M ${Math.cos(angle) * startDist} ${Math.sin(angle) * startDist} L 0 0" 
          dur="${duration}s" 
          begin="${delay}s" 
          repeatCount="indefinite" 
          keyPoints="0;1" 
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.42 0 1 1"
        />
        <animate attributeName="rx" values="1;1;4;0" dur="${duration}s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="ry" values="1;1;0.5;0" dur="${duration}s" begin="${delay}s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.8;0" dur="${duration}s" begin="${delay}s" repeatCount="indefinite" />
      </ellipse>
    `;
  }
  return stars;
};

export const renderBlackHole = (username, color) => {
  const width = 800;
  const height = 450;
  const cx = width / 2;
  const cy = height / 2;
  const accent = color || "#ff4d00";

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: #000;">
    <defs>
      <filter id="plasmaNoise" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed="1">
          <animate attributeName="seed" from="1" to="100" dur="60s" repeatCount="indefinite" />
        </feTurbulence>
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feDisplacementMap in="SourceGraphic" scale="20" />
      </filter>

      <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="15" result="blur1" />
        <feGaussianBlur stdDeviation="5" result="blur2" />
        <feMerge>
          <feMergeNode in="blur1" />
          <feMergeNode in="blur2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <radialGradient id="singularityGrad">
        <stop offset="92%" stop-color="#000" />
        <stop offset="95%" stop-color="${accent}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#000" />
      </radialGradient>
    </defs>

    <g transform="translate(${cx}, ${cy})">
      ${generateSpaghettiStars(60, cx, cy)}
    </g>

    <g transform="translate(${cx}, ${cy})">
      
      <path d="M -220 0 C -220 -150 220 -150 220 0 L 200 0 C 200 -120 -200 -120 -200 0 Z" 
            fill="${accent}" filter="url(#plasmaNoise)" opacity="0.6">
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="8s" repeatCount="indefinite" />
      </path>

      <g filter="url(#bloom)">
        <ellipse rx="250" ry="12" fill="none" stroke="${accent}" stroke-width="25" opacity="0.8" filter="url(#plasmaNoise)" />
        <ellipse rx="240" ry="8" fill="none" stroke="white" stroke-width="2" opacity="0.5" />
      </g>

      <circle r="82" fill="none" stroke="white" stroke-width="0.5" opacity="0.9">
        <animate attributeName="r" values="81.5;82.5;81.5" dur="0.1s" repeatCount="indefinite" />
      </circle>

      <circle r="80" fill="url(#singularityGrad)" />
      <circle r="78" fill="black" />

      <circle r="120" fill="${accent}" opacity="0.05" filter="url(#bloom)" />
    </g>
  </svg>
  `;
};
