import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function GasChart({ history }) {
  const labels = history
    .slice()
    .reverse()
    .map((item) => item.time);

  const gasData = history
    .slice()
    .reverse()
    .map((item) => item.gas);

  const data = {
    labels,
    datasets: [
      {
        label: "Kadar Gas (ppm)",
        data: gasData,

        borderWidth: 4,
        tension: 0.4,

        fill: true,

        backgroundColor: "rgba(37,99,235,0.08)",

        pointRadius: 0,
        pointHoverRadius: 6,

        segment: {
          borderColor: (ctx) => {
            const value = ctx.p1.parsed.y;

            if (value < 300) {
              return "#2563eb";
            }

            if (value < 600) {
              return "#f59e0b";
            }

            return "#dc2626";
          },
        },
      },
    ],
  };

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
      },

      title: {
        display: true,
        text: "Grafik Monitoring Kebocoran Gas",
      },

      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            const value = context.raw;

            if (value < 300)
              return "Status: AMAN";

            if (value < 600)
              return "Status: WASPADA";

            return "Status: BAHAYA";
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,
        max: 1000,

        title: {
          display: true,
          text: "PPM",
        },
      },

      x: {
        title: {
          display: true,
          text: "Waktu",
        },
      },
    },
  };

  return (
    <div>
      <div
        style={{
          height: "350px",
        }}
      >
        <Line
          data={data}
          options={options}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          🟦 <strong>AMAN</strong>
        </div>

        <div>
          🟧 <strong>WASPADA</strong>
        </div>

        <div>
          🟥 <strong>BAHAYA</strong>
        </div>
      </div>
    </div>
  );
}