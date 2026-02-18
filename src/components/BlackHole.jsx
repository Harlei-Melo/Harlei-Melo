import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Agora aceitamos props!
const BlackHole = ({ color = "#ffaa00", speed = 1.0 }) => {
  const diskRef = useRef();

  // Convertemos a cor hexadecimal para objeto THREE.Color apenas quando ela muda
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

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
    uniform vec3 uColor;

    // (Mantenha as funções de noise iguais ao anterior...)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 center = vec2(0.5);
      vec2 toCenter = vUv - center;
      float angle = atan(toCenter.y, toCenter.x);
      float radius = length(toCenter);

      // A velocidade do noise agora depende da prop 'speed'
      float noiseVal = snoise(vec2(angle * 6.0 - uTime * 2.0, radius * 10.0));
      
      vec3 finalColor = uColor * (1.0 + noiseVal * 0.5);
      float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      
      gl_FragColor = vec4(finalColor * 4.0, alpha); 
    }
  `;

  useFrame((state) => {
    if (diskRef.current) {
      // Rotação física baseada na atividade (speed)
      diskRef.current.rotation.z -= 0.002 * speed;

      // Velocidade do plasma no shader
      diskRef.current.material.uniforms.uTime.value =
        state.clock.elapsedTime * speed;

      // Atualiza a cor se ela mudar
      diskRef.current.material.uniforms.uColor.value.copy(threeColor);
    }
  });

  return (
    <group rotation={[1.2, 0, 0]}>
      <mesh>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial color="black" />
      </mesh>

      <mesh ref={diskRef}>
        <torusGeometry args={[3, 0.8, 2, 100]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) }, // Valor inicial
          }}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default BlackHole;
