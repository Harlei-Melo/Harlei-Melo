import { Canvas } from "@react-three/fiber";
// REMOVI O EFFECT COMPOSER TEMPORARIAMENTE
// import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import BlackHole from "./BlackHole";
import StarField from "./StarField";

const Scene = ({ color, speed }) => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000000" }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 8], fov: 50 }}
        // Força o fundo preto diretamente no WebGL
        onCreated={({ gl }) => {
          gl.setClearColor("#000000");
        }}
      >
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={1.5} />{" "}
        {/* Aumentei a luz já que tiramos o bloom */}
        <pointLight position={[10, 10, 10]} intensity={2} />
        <StarField />
        <BlackHole color={color} speed={speed} />
        {/* O EffectComposer foi removido. 
           O SwiftShader (CPU) não aguenta processar Bloom em modo headless.
           Se funcionar sem ele, sabemos que esse era o problema.
        */}
      </Canvas>
    </div>
  );
};

export default Scene;
