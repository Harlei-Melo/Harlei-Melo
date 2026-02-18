import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import BlackHole from './BlackHole';
import StarField from './StarField';

const Scene = ({ color, speed }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas 
        gl={{ preserveDrawingBuffer: true }} 
        camera={{ position: [0, 0, 8], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <StarField />
        <BlackHole color={color} speed={speed} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
export default Scene;