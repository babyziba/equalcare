import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const GraphView = ({
  genderData = { male: 50, female: 50 },
  genderCounts = { male: 0, female: 0 },
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = Object.entries(genderData).map(([key, percent]) => {
      const count = genderCounts[key] || 0;
      return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${count}`;
    });

    const values = Object.values(genderData);

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#38b6ff", "#ff66c4"],
            borderColor: "#fff",
            borderWidth: 2,
            hoverBackgroundColor: ["#acdcf8", "#efb6d9"],
            hoverBorderWidth: 5,
            hoverBorderColor: ["#d9d9d9"],
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "50%",
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Gender Distribution",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = ((value / total) * 100).toFixed(1);
                return `${percent}%`;
              },
              title: function (context) {
                return "";
              },
            },
            backgroundColor: "#2e2e2e",
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 4,
            borderWidth: 1,
            borderColor: "#ccc",
            displayColors: false,
          },
        },
      },
    });

    return () => {
      chartInstance.current.destroy();
    };
  }, [genderData, genderCounts]);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default GraphView;
