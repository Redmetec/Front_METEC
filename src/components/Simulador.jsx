import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import './Simulador.css';

Chart.register(annotationPlugin);

const Simulador = () => {
  const [formData, setFormData] = useState({
    generacion_anual_kwh: 7500,
    porcentaje_autoconsumo: 0.2,
    consumo_anual_usuario: 6000,
    precio_compra_kwh: 950,
    crecimiento_energia: 0.08,
    precio_bolsa: 400,
    crecimiento_bolsa: 0.08,
    componente_comercializacion: 60,
    capex: 22000000,
    opex_anual: 1000000,
    horizonte_anios: 25,
    tasa_descuento: 0.10,
    anios_deduccion_renta: 3
  });

  const [resultado, setResultado] = useState(null);
  const [verConBeneficios, setVerConBeneficios] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const handleChange = e => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('https://cash-48v3.onrender.com/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setResultado(data);
    setVerConBeneficios(false);
  };

  useEffect(() => {
    if (resultado && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      const flujos = verConBeneficios ? resultado.flujos_con_bt : resultado.flujos_sin_bt;
      const payback = verConBeneficios ? resultado.payback_year_con_bt : resultado.payback_year;
      const color = verConBeneficios ? 'blue' : 'blue';
      const label = verConBeneficios ? 'Flujo con Beneficios' : 'Flujo sin Beneficios';

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: flujos.map((_, i) => i),
          datasets: [{
            label,
            data: flujos,
            borderColor: color,
            backgroundColor: color === 'green' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(0, 123, 255, 0.2)',
            fill: true,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: 'Flujo de Caja Anual del Proyecto'
            },
            annotation: {
              annotations: {
                paybackLine: {
                  type: 'line',
                  scaleID: 'x',
                  value: payback,
                  borderColor: verConBeneficios ? 'lime' : 'red',
                  borderWidth: 2,
                  label: {
                    content: verConBeneficios ? 'Payback con BT' : 'Payback sin BT',
                    enabled: true,
                    position: 'start'
                  }
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: { display: true, text: 'COP' }
            },
            x: {
              title: { display: true, text: 'Año' },
              ticks: {
                callback: function (value) {
                  return 'Año ' + value;
                }
              }
            }
          }
        }
      });
    }
  }, [resultado, verConBeneficios]);

  return (
    <div className="simulador-container">
      <h2 className="text-primary fw-bold mb-4">Simulador Financiero FV</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map(key => (
          <div className="mb-3" key={key}>
          <label className="form-label">
  {key
    .replace(/_/g, ' ')
    .replace(/anios/g, 'años') // ← corrige "anios" a "años"
}
</label>
      
              <input
              type="number"
              step="any"
              name={key}
              className="form-control"
              value={formData[key]}
              onChange={handleChange}
              min={key === "anios_deduccion_renta" ? 1 : undefined}
              max={key === "anios_deduccion_renta" ? 15 : undefined}
              required
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary w-100">Calcular Flujo</button>
      </form>

      {resultado && (
        <div className="form-check mt-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="verConBeneficios"
            checked={verConBeneficios}
            onChange={() => setVerConBeneficios(!verConBeneficios)}
          />
          <label className="form-check-label" htmlFor="verConBeneficios">
            Ver resultados con beneficios tributarios
          </label>
        </div>
      )}

      {resultado && (
  <div className="mt-4">
    <div className="card shadow-sm border-0 bg-light">
      <div className="card-body">
        <h5 className="card-title fw-bold mb-4 text-primary">📊 Resultado Financiero</h5>

        <p><strong>VPN:</strong> ${(verConBeneficios ? resultado.vpn_con_bt : resultado.vpn_sin_bt).toLocaleString()} COP</p>
        <p><strong>TIR:</strong> {verConBeneficios ? resultado.tir_con_bt : resultado.tir_sin_bt} %</p>
        <p><strong>Payback:</strong> Año {verConBeneficios ? resultado.payback_year_con_bt : resultado.payback_year}</p>
        
        <hr />

        <p><strong>Ingreso por generación año 1:</strong> ${resultado.ingreso_total_anual.toLocaleString()} COP</p>
        <p><strong>Autoconsumo:</strong> ${resultado.autoconsumo_anual.toLocaleString()}</p>
        <p><strong>Excedente 1:</strong> ${resultado.excedente1_anual.toLocaleString()}</p>
        <p><strong>Excedente 2:</strong> ${resultado.excedente2_anual.toLocaleString()}</p>

        {verConBeneficios && (
          <>
            <hr />
            <p><strong>Depreciación acelerada año 1:</strong> ${resultado.beneficio_depreciacion_anio1.toLocaleString()}</p>
            <p><strong>Deducción renta año 1:</strong> ${resultado.beneficio_renta_anio1.toLocaleString()}</p>
            <p><strong>Total beneficios tributarios año 1:</strong> ${resultado.beneficio_total_anio1.toLocaleString()}</p>
          </>
        )}
      </div>
    </div>

    <canvas ref={chartRef} width="600" height="300" className="mt-4" />
  </div>
)}

    </div>
  );
};

export default Simulador;
