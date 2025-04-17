import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "../CSS/GraphView.css";

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
            backgroundColor: ["#38b6ff", "#ff6384"],
            borderWidth: 1,
            borderColor: "#fff",
            hoverOffset: 15, // This makes the segment "lift" on hover
            hoverBorderColor: "#aaa", // Optional: a soft grey outline when hovering
            hoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#333",
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });    
  }, [genderData, genderCounts]);

  return (
    <div className="graphWrapper liftOnHover">
      <h3 className="graphTitle">Gender Distribution</h3>
      <div className="chartContainer">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default GraphView;
