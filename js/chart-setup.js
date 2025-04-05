function initChart() {
  const ctx = document.getElementById("packets-chart").getContext("2d");
  packetsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Packets per Second",
          data: [],
          borderColor: "#00BCD4",
          backgroundColor: "rgba(0, 188, 212, 0.2)",
          tension: 0.4,
          fill: true,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Time",
            color: "rgba(255, 255, 255, 0.8)",
            font: {
              size: 12,
              weight: "normal",
            },
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.8)",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 5,
            font: {
              size: 10,
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: "Packets/s",
            color: "rgba(255, 255, 255, 0.8)",
            font: {
              size: 12,
              weight: "normal",
            },
          },
          beginAtZero: true,
          ticks: {
            color: "rgba(255, 255, 255, 0.8)",
            font: {
              size: 10,
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "start",
          labels: {
            color: "rgba(255, 255, 255, 0.8)",
            font: {
              size: 12,
            },
            boxWidth: 15,
            padding: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(30, 30, 30, 0.8)",
          titleColor: "rgba(255, 255, 255, 0.9)",
          bodyColor: "rgba(255, 255, 255, 0.9)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
        },
      },
      animation: {
        duration: 300,
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 5,
        },
      },
    },
  });

  setInterval(updatePacketsPerSecondChart, 1000);
}

function updatePacketsPerSecondChart() {
  if (packetsPerSecond.length === 0) return;

  // Update chart data
  packetsChart.data.labels = packetsPerSecond.map((p) => p.time);
  packetsChart.data.datasets[0].data = packetsPerSecond.map((p) => p.count);
  packetsChart.update("active");
}
