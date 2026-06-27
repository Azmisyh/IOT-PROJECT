import { useState } from "react";
import { sendMuteCommand } from "../services/mqttService";

export default function MuteAlarmButton() {
  const [muted, setMuted] = useState(false);

  const handleMute = () => {
    sendMuteCommand();

    setMuted(true);

    alert(
      "Perintah MQTT berhasil dikirim ke ESP32."
    );
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 5px 15px rgba(0,0,0,.1)",
        height: "100%",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>
        🔊 Kontrol Alarm
      </h2>

      <button
        onClick={handleMute}
        disabled={muted}
        style={{
          background: muted
            ? "#9ca3af"
            : "#dc2626",
          color: "#fff",
          border: "none",
          padding: "12px 22px",
          borderRadius: "8px",
          cursor: muted
            ? "not-allowed"
            : "pointer",
          fontWeight: "bold",
          width: "100%",
          fontSize: "16px",
        }}
      >
        {muted
          ? "✅ Buzzer Dimatikan"
          : "🔇 Matikan Buzzer"}
      </button>
    </div>
  );
}