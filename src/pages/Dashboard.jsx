import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import AlertNotification from "../components/AlertNotification";
import AIAssistant from "../components/AIAssistant";
import SecurityStatus from "../components/SecurityStatus";
import GasChart from "../components/GasChart";
import PayloadViewer from "../components/PayloadViewer";
import MuteAlarmButton from "../components/MuteAlarmButton";


import { getGeminiRecommendation } from "../services/geminiService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// Tidak ada data dummy — mulai kosong, data datang dari backend/MQTT

function parsePayload(payload) {
  if (typeof payload === "object" && payload !== null) {
    return payload;
  }

  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return { value: payload };
    }
  }

  return { value: payload };
}

function mapReadingToDashboard(reading) {
  const payload = parsePayload(reading?.payload);

  const gasValue = Number(
    reading?.gasValuePPM ?? payload.gas_ppm ?? payload.kadar_gas ?? payload.gasValue ?? payload.ppm ?? payload.gas ?? payload.value ?? 0
  );

  const numericGas = Number.isFinite(gasValue) ? gasValue : 0;
  const isAlarm = reading?.alarmActive === true || payload.alarm === true || payload.status === "alarm" || payload.status === "BAHAYA" || payload.alarmActive === true;
  const currentStatus = isAlarm ? "BAHAYA" : numericGas >= 400 ? "WASPADA" : "AMAN";

  return {
    gas: numericGas,
    status: currentStatus,
    payload,
    time: new Date(reading?.createdAt || Date.now()).toLocaleTimeString(),
  };
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [gas, setGas] = useState(0);
  const [status, setStatus] = useState("—");
  const [history, setHistory] = useState([]);
  const [payload, setPayload] = useState("Menunggu data dari sensor...");
  const [connectionStatus, setConnectionStatus] = useState("MENGHUBUNG...");

  const [isEncrypted, setIsEncrypted] = useState(false);

  const [aiRecommendation, setAiRecommendation] =
    useState("Memuat rekomendasi AI...");
  const [aiLoading, setAiLoading] = useState(true);

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Apakah Anda yakin ingin logout?"
    );

    if (confirmLogout) {
      navigate("/");
    }
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      setConnectionStatus("ONLINE");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("OFFLINE");
    });

    socket.on("connect_error", () => {
      setConnectionStatus("OFFLINE");
    });

    socket.on("newData", async (data) => {
      const mapped = mapReadingToDashboard(data);
      setGas(mapped.gas);
      setStatus(mapped.status);
      setPayload(JSON.stringify(mapped.payload, null, 2));
      setHistory((prev) => [{ time: mapped.time, gas: mapped.gas, status: mapped.status }, ...prev].slice(0, 50));
      
      // Update status enkripsi secara dinamis dari payload MQTT
      if (mapped.payload && mapped.payload.isEncrypted) {
        setIsEncrypted(true);
      }

      setAiLoading(true);
      const recommendation = await getGeminiRecommendation(mapped.status, mapped.gas);
      setAiRecommendation(recommendation);
      setAiLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load data historis dari API SEKALI saat mount, lalu real-time via Socket.IO
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [latestRes, historyRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/gas-readings/latest`),
          fetch(`${API_BASE_URL}/gas-readings?limit=50`),
        ]);

        if (latestRes.status === "fulfilled" && latestRes.value.ok) {
          const latestReading = await latestRes.value.json();
          const mappedLatest = mapReadingToDashboard(latestReading);

          setGas(mappedLatest.gas);
          setStatus(mappedLatest.status);
          setPayload(JSON.stringify(mappedLatest.payload, null, 2));

          if (mappedLatest.payload && mappedLatest.payload.isEncrypted) {
            setIsEncrypted(true);
          }

          const recommendation = await getGeminiRecommendation(mappedLatest.status, mappedLatest.gas);
          setAiRecommendation(recommendation);
          setAiLoading(false);
        } else {
          setAiRecommendation("Belum ada data sensor.");
          setAiLoading(false);
        }

        if (historyRes.status === "fulfilled" && historyRes.value.ok) {
          const recentData = await historyRes.value.json();
          const mappedHistory = recentData
            .map((item) => ({
              time: new Date(item.createdAt || Date.now()).toLocaleTimeString(),
              gas: Number(item.gasValuePPM ?? 0),
              status: item.alarmActive ? "BAHAYA" : Number(item.gasValuePPM ?? 0) >= 400 ? "WASPADA" : "AMAN",
            }))
            .filter((item) => Number.isFinite(item.gas));

          if (mappedHistory.length > 0) {
            setHistory(mappedHistory.slice(0, 50));
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data awal dari backend:", error);
        setAiRecommendation("Gagal terhubung ke backend.");
        setAiLoading(false);
      }
    };

    loadInitialData();
    // Tidak ada interval — data real-time datang dari Socket.IO di useEffect atas
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
              color: connectionStatus === "ONLINE" ? "green" : "#dc2626",
            }}
          >
            {connectionStatus}
          </h1>
        </div>

        {/* SECURITY */}
        <SecurityStatus isEncrypted={isEncrypted} />
      </div>

      {/* AI GEMINI */}
      <AIAssistant
        recommendation={aiRecommendation}
        loading={aiLoading}
        status={status}
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

      {/* PAYLOAD MQTT & KONTROL ALARM */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginTop: "20px",
    marginBottom: "20px",
    alignItems: "stretch",
  }}
>
  <PayloadViewer payload={payload} />

  <MuteAlarmButton />
</div>

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