import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AlertNotification from "../components/AlertNotification";
import AIAssistant from "../components/AIAssistant";
import SecurityStatus from "../components/SecurityStatus";
import GasChart from "../components/GasChart";
import PayloadViewer from "../components/PayloadViewer";
import MuteAlarmButton from "../components/MuteAlarmButton";

import { getGeminiRecommendation } from "../services/geminiService";

export default function Dashboard() {
  const navigate = useNavigate();

  const [gas, setGas] = useState(150);
  const [status, setStatus] = useState("AMAN");
  const [history, setHistory] = useState([]);

  const [aiRecommendation, setAiRecommendation] =
    useState("Kondisi ruangan aman.");

  const encryptedPayload =
    "8fA92KxM7sDf98KjA71LsPwQ2Xz";

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Apakah Anda yakin ingin logout?"
    );

    if (confirmLogout) {
      navigate("/");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const gasValue = Math.floor(
        Math.random() * 1000
      );

      setGas(gasValue);

      let currentStatus = "";

      if (gasValue < 300) {
        currentStatus = "AMAN";
      } else if (gasValue < 600) {
        currentStatus = "WASPADA";
      } else {
        currentStatus = "BAHAYA";
      }

      setStatus(currentStatus);

      setAiRecommendation(
        getGeminiRecommendation(
          currentStatus
        )
      );

      const newData = {
        time: new Date().toLocaleTimeString(),
        gas: gasValue,
        status: currentStatus,
      };

      setHistory((prev) => [
        newData,
        ...prev.slice(0, 19),
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "20px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          padding: "15px 25px",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>
          Sistem Deteksi Kebocoran Gas
        </h2>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* ALERT */}
      <AlertNotification
        status={status}
      />

      {/* CARD MONITORING */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {/* KADAR GAS */}
        <div
          style={{
            flex: 1,
            minWidth: "220px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow:
              "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Kadar Gas</h3>

          <h1
            style={{
              color: "#2563eb",
            }}
          >
            {gas} ppm
          </h1>
        </div>

        {/* STATUS */}
        <div
          style={{
            flex: 1,
            minWidth: "220px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow:
              "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Status</h3>

          <h1
            style={{
              color:
                status === "AMAN"
                  ? "#2563eb"
                  : status === "WASPADA"
                  ? "#f59e0b"
                  : "#dc2626",
            }}
          >
            {status}
          </h1>
        </div>

        {/* KONEKSI */}
        <div
          style={{
            flex: 1,
            minWidth: "220px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow:
              "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Koneksi</h3>

          <h1
            style={{
              color: "green",
            }}
          >
            ONLINE
          </h1>
        </div>

        {/* SECURITY */}
        <SecurityStatus />
      </div>

      {/* AI GEMINI */}
      <AIAssistant
        recommendation={
          aiRecommendation
        }
      />

      {/* GRAFIK */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
          boxShadow:
            "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <GasChart history={history} />
      </div>

      {/* PAYLOAD MQTT */}
      <PayloadViewer
        payload={encryptedPayload}
      />

      {/* MUTE ALARM */}
      <MuteAlarmButton />

      {/* TABEL RIWAYAT */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          marginTop: "20px",
          boxShadow:
            "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>
          Riwayat Pembacaan Sensor
        </h2>

        <table
          width="100%"
          border="1"
          style={{
            borderCollapse:
              "collapse",
            marginTop: "15px",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor:
                  "#2563eb",
                color: "white",
              }}
            >
              <th
                style={{
                  padding: "10px",
                }}
              >
                Waktu
              </th>

              <th
                style={{
                  padding: "10px",
                }}
              >
                Kadar Gas
              </th>

              <th
                style={{
                  padding: "10px",
                }}
              >
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {history.map(
              (item, index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding: "10px",
                    }}
                  >
                    {item.time}
                  </td>

                  <td
                    style={{
                      padding: "10px",
                    }}
                  >
                    {item.gas} ppm
                  </td>

                  <td
                    style={{
                      padding: "10px",
                      color:
                        item.status ===
                        "AMAN"
                          ? "#2563eb"
                          : item.status ===
                            "WASPADA"
                          ? "#f59e0b"
                          : "#dc2626",
                      fontWeight:
                        "bold",
                    }}
                  >
                    {item.status}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}