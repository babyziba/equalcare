import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const GraphView = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');


    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const data = {
      labels: ['Male', 'Female'],
      datasets: [
        {
          data: [30, 70],
          backgroundColor: ['#38b6ff', '#ff66c4'],
          borderColor: '#fff',
          borderWidth: 2,
          hoverBackgroundColor: ['#acdcf8', '#efb6d9', ],
          hoverBorderWidth: 5,
          hoverBorderColor: ['#d9d9d9'], 
        },
      ],
    };

    const options = {
      responsive: true,
      cutout: '50%', 
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'gender distrubution'
        }
      },

    };

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data,
      options,
    });

    return () => {
      chartInstance.current.destroy();
    };
  }, []);

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default GraphView;
