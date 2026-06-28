import { useState } from "react";
import {
  sendMuteCommand,
  sendResetCommand,
} from "../services/mqttService";

export default function MuteAlarmButton() {
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMute = () => {
    setLoading(true);
    try {
      sendMuteCommand();
      setMuted(true);
    } catch (err) {
      console.error("Gagal mengirim mute:", err);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setLoading(true);
    try {
      sendResetCommand();
      setMuted(false);
    } catch (err) {
      console.error("Gagal mengirim reset:", err);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "15px",
        boxShadow: "0 5px 15px rgba(0,0,0,.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ marginBottom: "16px", fontSize: "18px" }}>
        🔊 Kontrol Buzzer
      </h2>

      {/* Status Buzzer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderRadius: "10px",
          backgroundColor: muted ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)",
          border: `1px solid ${muted ? "rgba(245, 158, 11, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
          marginBottom: "20px",
        }}
      >
        <span style={{ fontSize: "24px" }}>{muted ? "🔇" : "🔔"}</span>
        <div>
          <div
            style={{
              fontWeight: "bold",
              color: muted ? "#f59e0b" : "#22c55e",
              fontSize: "14px",
            }}
          >
            {muted ? "Buzzer Dimatikan" : "Buzzer Aktif"}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            Status saat ini
          </div>
        </div>
      </div>

      {/* Tombol Kontrol */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        {/* Tombol Matikan Buzzer */}
        <button
          onClick={handleMute}
          disabled={loading || muted}
          style={{
            background: muted
              ? "#d1d5db"
              : "linear-gradient(135deg, #dc2626, #b91c1c)",
            color: muted ? "#9ca3af" : "#fff",
            border: "none",
            padding: "14px 20px",
            borderRadius: "10px",
            cursor: loading || muted ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s ease",
            boxShadow: muted ? "none" : "0 4px 12px rgba(220, 38, 38, 0.3)",
          }}
        >
          🔇 Matikan Buzzer
        </button>

        {/* Tombol Reset Buzzer */}
        <button
          onClick={handleReset}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#fff",
            border: "none",
            padding: "14px 20px",
            borderRadius: "10px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          }}
        >
          🔄 Reset Buzzer
        </button>
      </div>

      {/* Info */}
      <div
        style={{
          marginTop: "16px",
          padding: "10px 14px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: "1.5",
        }}
      >
        <strong>Info:</strong>
        <br />
        • <strong>Matikan</strong> — mematikan buzzer saat alarm berbunyi
        <br />
        • <strong>Reset</strong> — reset alarm & aktifkan kembali buzzer
      </div>
    </div>
  );
}