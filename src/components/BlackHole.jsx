import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const TECH_STACK = [
  { name: "FLUTTER", color: "#02569B" },
  { name: "JAVASCRIPT", color: "#F7DF1E" },
  { name: "PYTHON", color: "#3776AB" },
  { name: "REACT", color: "#61DAFB" },
  { name: "GLSL", color: "#ff5500" },
];

const BlackHole = ({ speed = 1.0 }) => {
  const meshRef = useRef();
  const { viewport } = useThree();

  // CONFIGURAÇÃO DE TEMPO (SLOW MOTION)
  const CYCLE_DURATION = 6.0; // 6 segundos por cor (Total 30s)

  // Limitador de velocidade bem baixo para rotação pesada
  const safeSpeed = useMemo(() => {
    // Multiplicamos por 0.1 para garantir que seja LENTO
    return Math.max(0.1, Math.min(speed, 2.0)) * 0.35;
  }, [speed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(TECH_STACK[0].color) },
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

    mat2 rotate(float a) { float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }
    vec2 hash2(vec2 p) { vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
    float noise(vec2 p) { vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(dot(-1.+2.*hash2(i+vec2(0.,0.)),f-vec2(0.,0.)),dot(-1.+2.*hash2(i+vec2(1.,0.)),f-vec2(1.,0.)),u.x),mix(dot(-1.+2.*hash2(i+vec2(0.,1.)),f-vec2(0.,1.)),dot(-1.+2.*hash2(i+vec2(1.,1.)),f-vec2(1.,1.)),u.x),u.y)*.5+.5; }
    float fbm(vec2 p) { float total=0., amp=.55; mat2 rot=rotate(.5); for(int i=0;i<4;i++){ total+=noise(p)*amp; p*=2.; p*=rot; amp*=.5; } return total; }
    vec3 StarLayer(vec2 uv, float scale, float flare, float prob) { vec3 col=vec3(0.); vec2 gv=fract(uv*scale)-.5; vec2 id=floor(uv*scale); for(int y=-1;y<=1;y++){ for(int x=-1;x<=1;x++){ vec2 off=vec2(x,y); vec2 n=hash2(id+off); if(n.x>prob)continue; vec2 pos=off+sin(n*uTime)*.1; float d=length(gv-pos); float star=(n.x*.06+.005)/d; star*=sin(uTime*2.+n.y*10.)*.5+1.; star*=smoothstep(1.,.1,d); col+=mix(vec3(1.),uColor,n.y*.5)*star*flare; } } return col; }
    
    void main() {
        vec2 uv=(vUv-.5)*2.; uv.x*=uResolution.x/uResolution.y; uv*=1.1;
        float r=length(uv); float twist=log(r+.001)*1.5-uTime*.2;
        vec2 flow=uv*rotate(twist);
        float arms=smoothstep(.2,.8,sin(atan(flow.y,flow.x)*2.)*1.5+2.5);
        float dens=pow(fbm(flow*3.)*arms*mix(1.,.5,smoothstep(.3,.7,fbm(flow*6.+uTime*.1)))*smoothstep(.22,.42,r)*smoothstep(1.5,.5,r),1.2)*2.5;
        vec3 col=mix(mix(vec3(.05,.02,.05),uColor,smoothstep(0.,.6,dens)),mix(uColor,vec3(1.),.7),smoothstep(.6,1.2,dens)*smoothstep(.5,0.,r))*dens;
        col+=StarLayer(flow,8.,.8,.15)*(dens+.2)+StarLayer(flow,15.,.4,.3)*(dens+.1);
        col+=vec3(1.,.98,.9)*(0.008/abs(r-.22-.005))*(.6+smoothstep(0.,1.,sin(atan(flow.y,flow.x)*3.+1.))*.8);
        gl_FragColor=vec4(pow(col*smoothstep(.215,.22,r),vec3(.85)),1.);
    }
  `;

  // Função auxiliar para calcular a cor baseada no tempo
  const updateColor = (time) => {
    const totalIndex = Math.floor(time / CYCLE_DURATION);
    const currentIndex = totalIndex % TECH_STACK.length;
    const nextIndex = (currentIndex + 1) % TECH_STACK.length;
    const mixFactor = (time % CYCLE_DURATION) / CYCLE_DURATION;

    const currentColor = new THREE.Color(TECH_STACK[currentIndex].color);
    const nextColor = new THREE.Color(TECH_STACK[nextIndex].color);

    meshRef.current.material.uniforms.uColor.value
      .copy(currentColor)
      .lerp(nextColor, mixFactor);
  };

  // EXPOMOS ESSA FUNÇÃO PARA O PUPPETEER CONTROLAR A COR TAMBÉM
  useEffect(() => {
    window.seekAnimation = (time) => {
      if (meshRef.current) {
        // Atualiza rotação
        meshRef.current.material.uniforms.uTime.value = time;
        // Atualiza cor (Sincronizado!)
        // Multiplicamos por um fator para o ciclo de cor ter velocidade independente da rotação
        // Aqui usamos o 'time' puro para cor, mas para rotação usamos o time vindo do loop
        updateColor(time / safeSpeed);
      }
    };
  }, [safeSpeed]); // Re-cria se a velocidade mudar

  useFrame((state) => {
    // Só roda se NÃO estivermos gravando (o Puppeteer assume se isCapturing for true)
    if (meshRef.current && !window.isCapturing) {
      const time = state.clock.elapsedTime;

      // Rotação (Afetada pelo speed)
      meshRef.current.material.uniforms.uTime.value = time * safeSpeed;

      // Cor (Tempo real, independente da rotação)
      updateColor(time);
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
