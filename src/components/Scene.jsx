import { Canvas } from "@react-three/fiber";
import BlackHole from "./BlackHole";

const Scene = ({ color, speed }) => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000000" }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 1] }} // Câmera perto para o plano cobrir a tela
      >
        <BlackHole color={color} speed={speed} />
      </Canvas>
    </div>
  );
};

export default Scene;
