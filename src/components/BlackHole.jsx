import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const BlackHole = ({ color = "#ffaa00", speed = 1.0 }) => {
  const meshRef = useRef();
  const { viewport } = useThree();

  // Converte cor hex para RGB normalizado
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uResolution: {
        value: new THREE.Vector2(viewport.width, viewport.height),
      },
    }),
    [],
  );

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
    uniform vec2 uResolution;
    uniform vec3 uColor;

    #define PI 3.14159265359

    // --- FUNÇÕES UTILITÁRIAS ---
    mat2 rotate(float a) {
        float s = sin(a), c = cos(a);
        return mat2(c, -s, s, c);
    }

    vec2 hash2(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xx + p3.yz) * p3.zy);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float n = mix(mix(dot(-1. + 2. * hash2(i + vec2(0., 0.)), f - vec2(0., 0.)),
                          dot(-1. + 2. * hash2(i + vec2(1., 0.)), f - vec2(1., 0.)), u.x),
                      mix(dot(-1. + 2. * hash2(i + vec2(0., 1.)), f - vec2(0., 1.)),
                          dot(-1. + 2. * hash2(i + vec2(1., 1.)), f - vec2(1., 1.)), u.x), u.y);
        return .5 + .5 * n;
    }

    float fbm(vec2 p) {
        float total = 0.;
        float amp = .55;
        mat2 rot = rotate(.5);
        for (int i = 0; i < 4; i++) {
            float n = noise(p);
            total += n * amp;
            p *= 2.;
            p *= rot;
            amp *= .5;
        }
        return total;
    }

    vec3 StarLayer(vec2 uv, float scale, float flare, float probability) {
        vec3 col = vec3(0.);
        vec2 gv = fract(uv * scale) - .5;
        vec2 id = floor(uv * scale);
        
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 offset = vec2(float(x), float(y));
                vec2 n = hash2(id + offset);
                if (n.x > probability) continue;
                
                vec2 pos = offset + sin(n * uTime * 1.) * .1;
                float d = length(gv - pos);
                float size = n.x * .06 + .005;
                float star = size / d;
                float twinkle = sin(uTime * 2. + n.y * 10.) * .5 + 1.;
                star *= twinkle * smoothstep(1., .1, d);
                
                vec3 color = mix(vec3(1.), uColor, n.y * 0.5); 
                col += color * star * flare;
            }
        }
        return col;
    }

    void main() {
        // Normaliza coordenadas (-1 a 1) corrigindo aspect ratio
        vec2 uv = (vUv - 0.5) * 2.0;
        uv.x *= uResolution.x / uResolution.y;

        uv *= 1.1; 
        uv.y -= 0.0;

        float r = length(uv);
        float radius = 0.22; 

        // Rotação de Domínio
        float twist = log(r + 0.001) * 1.5 - uTime * 0.2;
        vec2 flowUV = uv * rotate(twist);

        // Formato dos Braços
        float spiralAngle = atan(flowUV.y, flowUV.x);
        float arms = sin(spiralAngle * 2.0); 
        arms = arms * 1.5 + 2.5;
        arms = smoothstep(0.2, 0.8, arms);

        // Textura de Gás e Poeira
        float gas = fbm(flowUV * 3.0);
        float dust = fbm(flowUV * 6.0 + uTime * 0.1);

        float density = gas * arms;
        density *= mix(1.0, 0.5, smoothstep(0.3, 0.7, dust));
        density *= smoothstep(radius, radius + 0.2, r); 
        density *= smoothstep(1.5, 0.5, r); 
        density = pow(density, 1.2) * 2.5;

        // Estrelas
        vec3 stars = StarLayer(flowUV, 8.0, 0.8, 0.15);
        vec3 microStars = StarLayer(flowUV, 15.0, 0.4, 0.3);
        stars *= (density + 0.2);
        microStars *= (density + 0.1);

        // Cores Dinâmicas
        vec3 colDeep = vec3(0.05, 0.02, 0.05); 
        vec3 colMain = uColor;                 
        vec3 colCore = mix(uColor, vec3(1.0), 0.7); 

        vec3 gasColor = mix(colDeep, colMain, smoothstep(0.0, 0.6, density));
        gasColor = mix(gasColor, colCore, smoothstep(0.6, 1.2, density) * smoothstep(0.5, 0.0, r));

        vec3 finalColor = gasColor * density;
        finalColor += stars;
        finalColor += microStars;

        // Anel de Fótons
        float photonRing = 0.008 / abs(r - radius - 0.005);
        float armContact = smoothstep(0.0, 1.0, sin(spiralAngle * 3.0 + 1.0));
        photonRing *= (0.6 + armContact * 0.8);
        finalColor += vec3(1.0, 0.98, 0.9) * photonRing;

        // Horizonte de Eventos
        float eventHorizon = smoothstep(radius - 0.005, radius, r);
        finalColor *= eventHorizon;

        finalColor = pow(finalColor, vec3(0.85));

        gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value =
        state.clock.elapsedTime * speed;
      meshRef.current.material.uniforms.uColor.value.lerp(threeColor, 0.1);

      // Atualiza a resolução caso a janela mude de tamanho
      meshRef.current.material.uniforms.uResolution.value.set(
        viewport.width,
        viewport.height,
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

export default BlackHole;
