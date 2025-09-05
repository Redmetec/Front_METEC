import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
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
    anios_deduccion_renta: 3,
    anios_leasing: 10,
    tasa_leasing: 0.08
  });

  const [resultado, setResultado] = useState(null);
  const [verConBeneficios, setVerConBeneficios] = useState(false);
  const [verLeasing, setVerLeasing] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const handleChange = e => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('http://127.0.0.1:8000/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setResultado(data);
    setVerConBeneficios(false);
    setVerLeasing(false);
  };

  useEffect(() => {
    if (resultado && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      let flujos, label, color, indicadores;

      if (verLeasing && verConBeneficios) {
        flujos = resultado.flujos_leasing_con_bt;
        indicadores = resultado.leasing_con_bt;
        label = "Leasing + Beneficios";
        color = "purple";
      } else if (verLeasing) {
        flujos = resultado.flujos_leasing_sin_bt;
        indicadores = resultado.leasing_sin_bt;
        label = "Solo Leasing";
        color = "orange";
      } else if (verConBeneficios) {
        flujos = resultado.flujos_con_bt;
        indicadores = resultado.con_bt;
        label = "Solo Beneficios";
        color = "green";
      } else {
        flujos = resultado.flujos_sin_bt;
        indicadores = resultado.sin_bt;
        label = "Sin Beneficios ni Leasing";
        color = "blue";
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: flujos.map((_, i) => i),
          datasets: [{
            label,
            data: flujos,
            borderColor: color,
            backgroundColor: color === "blue" ? "rgba(0,123,255,0.1)" :
                             color === "green" ? "rgba(40,167,69,0.1)" :
                             color === "orange" ? "rgba(255,165,0,0.1)" :
                             "rgba(128,0,128,0.1)",
            fill: true,
            tension: 0.4,
            cubicInterpolationMode: 'monotone',
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: 'Flujo de Caja Anual del Proyecto'
            }
          },
          scales: {
            y: {
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
  }, [resultado, verConBeneficios, verLeasing]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Resultados Financieros Proyecto FV", 14, 15);
    doc.autoTable({
      head: [Object.keys(resultado.tabla_resultados[0])],
      body: resultado.tabla_resultados.map(row => Object.values(row))
    });
    doc.save("resultado_fv.pdf");
  };

  const exportCSV = () => {
    const rows = [Object.keys(resultado.tabla_resultados[0])];
    resultado.tabla_resultados.forEach(r => rows.push(Object.values(r)));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, "resultado_fv.csv");
  };

  return (
    <div className="simulador-container">
      <h2 className="text-primary fw-bold mb-4">Simulador Financiero FV</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map(key => (
          <div className="mb-3" key={key}>
            <label className="form-label">
              {key.replace(/_/g, ' ').replace(/anios/g, 'años')}
            </label>
            <input
              type="number"
              step="any"
              name={key}
              className="form-control"
              value={formData[key]}
              onChange={handleChange}
              min={key.includes("anios") ? 1 : undefined}
              required
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary w-100">Calcular Flujo</button>
      </form>

      {resultado && (
        <>
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

          <div className="form-check mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="verLeasing"
              checked={verLeasing}
              onChange={() => setVerLeasing(!verLeasing)}
            />
            <label className="form-check-label" htmlFor="verLeasing">
              Ver resultados con leasing
            </label>
          </div>
        </>
      )}

      {resultado && (
        <div className="mt-4">
          <canvas ref={chartRef} width="600" height="300" />

          <h5 className="mt-4 fw-bold">📊 Resultados Detallados</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-sm mt-2">
              <thead className="table-light">
                <tr>
                  {Object.keys(resultado.tabla_resultados[0]).map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultado.tabla_resultados.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={exportPDF} className="btn btn-danger me-2">Exportar PDF</button>
          <button onClick={exportCSV} className="btn btn-success">Exportar CSV</button>
        </div>
      )}
    </div>
  );
};

export default Simulador;
