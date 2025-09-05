import React from "react";
import Simulador from "./components/Simulador";

function App() {
  return (
    <div className="container py-4">
      <h1 className="text-center text-primary mb-4">
        🌞 Simulador Solar Fotovoltaico
      </h1>
      <Simulador />
    </div>
  );
}

export default App;
