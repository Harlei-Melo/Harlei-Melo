// ARQUIVO: src/components/StarField.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const StarField = () => {
  const meshRef = useRef();

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform float uTime;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // --- CORREÇÃO AQUI ---
    float StarLayer(vec2 uv) {
        vec2 grid = fract(uv) - 0.5; // Centraliza o sistema de coordenadas na célula
        vec2 id = floor(uv);
        float n = random(id);
        
        float brightness = 0.0;
        // Aumentei um pouco a chance de aparecer estrelas (de 0.95 para 0.90)
        if(n > 0.90) { 
            float dist = length(grid);

            // NOVA FÓRMULA: smoothstep cria um círculo perfeito.
            // O brilho vai de 1.0 no centro (dist 0.0) até 0.0 na borda (dist 0.05)
            brightness = smoothstep(0.05 * n, 0.0, dist); 

            // Adiciona um "halo" muito suave em volta para dar realismo
            brightness += smoothstep(0.4 * n, 0.0, dist) * 0.1;

            // Piscar
            brightness *= sin(uTime * n * 8.0) * 0.3 + 0.8; 
        }
        return brightness;
    }
    // ---------------------

    void main() {
        // Aumentei a escala global para ter mais estrelas
        vec2 uv = vUv * 15.0; 
        vec3 color = vec3(0.0);

        // Seus multiplicadores (ajustei levemente as escalas para a nova fórmula)
        color += vec3(StarLayer(uv * 1.5)) * 0.35; 
        color += vec3(StarLayer(uv * 3.0 + 5.0)) * 0.4;
        color += vec3(StarLayer(uv * 6.0 + 15.0)) * 0.6;

        // Tom azulado sci-fi
        color *= vec3(0.85, 0.95, 1.0);
        
        // Ajuste final de gama para o fundo ficar bem preto
        color = pow(color, vec3(1.2));

        gl_FragColor = vec4(color, 1.0);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    // Aumentei a escala do plano para cobrir bem a câmera
    <mesh ref={meshRef} position={[0, 0, -15]} scale={[40, 25, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent={true}
        // DepthWrite false é importante para o fundo não bugar com objetos na frente
        depthWrite={false}
      />
    </mesh>
  );
};

export default StarField;
