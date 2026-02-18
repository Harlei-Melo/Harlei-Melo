import Scene from "./components/Scene";
import "./App.css";

function App() {
  // Sem estados, sem textos, sem HUD. Apenas a Cena.
  return (
    <div className="canvas-container">
      <Scene />
    </div>
  );
}

export default App;
