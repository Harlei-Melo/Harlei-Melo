import React, { useState } from "react";
import Scene from "./components/Scene";
import "./App.css"; // Vamos adicionar o CSS aqui

function App() {
  const [activeTech, setActiveTech] = useState({
    name: "INITIALIZING...",
    color: "#ffffff",
  });

  return (
    <div className="terminal-interface">
      {/* CENA 3D (Fundo) */}
      <div className="canvas-layer">
        {/* Passamos a função para receber a tecnologia atual do shader */}
        <Scene onTechChange={setActiveTech} />
      </div>

      {/* HUD (Interface Frontal) */}
      <div className="hud-layer">
        {/* Canto Superior Esquerdo - Status */}
        <div className="hud-panel top-left">
          <div className="label">SYSTEM STATUS</div>
          <div className="value status-active">ONLINE</div>
          <div className="coords">COORD: 45.92.11</div>
        </div>

        {/* Canto Superior Direito - Git Stats Simulados */}
        <div className="hud-panel top-right">
          <div className="label">COMM LINK</div>
          <div className="value">GITHUB_API: CONNECTED</div>
          <div className="bar-graph">
            <div className="bar" style={{ width: "80%" }}></div>
            <div className="bar" style={{ width: "60%" }}></div>
            <div className="bar" style={{ width: "90%" }}></div>
          </div>
        </div>

        {/* Centro Inferior - O NOME DA TECNOLOGIA (O destaque) */}
        <div className="hud-panel bottom-center">
          <div className="scan-line"></div>
          <div className="label">DETECTED SIGNATURE</div>
          <h1
            className="tech-name"
            style={{
              color: activeTech.color,
              textShadow: `0 0 20px ${activeTech.color}`,
            }}
          >
            {activeTech.name}
          </h1>
          <div className="tech-meta">core_module::loaded</div>
        </div>

        {/* Efeitos de Borda (Vignette e Scanlines) */}
        <div className="vignette"></div>
      </div>
    </div>
  );
}

export default App;
