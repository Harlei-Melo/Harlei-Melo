// ARQUIVO: src/App.jsx
import { useMemo } from "react";
import Scene from "./components/Scene"; // Importa a cena corretamente
import "./index.css";

function App() {
  // Ler parâmetros da URL para saber cor e velocidade
  const params = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);

    return {
      // Se tiver cor na URL usa, se não usa laranja (#ffaa00)
      color: searchParams.get("color")
        ? "#" + searchParams.get("color")
        : "#ffaa00",

      // Se tiver activity na URL usa, se não usa 1.0
      activity: parseFloat(searchParams.get("activity")) || 1.0,
    };
  }, []);

  // Passa os dados lidos para a Cena 3D
  return <Scene color={params.color} speed={params.activity} />;
}

export default App;
