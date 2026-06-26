import { useState } from "react";
import { sendMuteCommand } from "../services/mqttService";

export default function MuteAlarmButton() {
  const [muted, setMuted] = useState(false);

  const handleMute = () => {
    sendMuteCommand();

    setMuted(true);

    alert(
      "Perintah MQTT dikirim ke ESP32 untuk mematikan buzzer"
    );
  };

  return (
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
      <h2>🔊 Kontrol Alarm</h2>

      <button
        onClick={handleMute}
        disabled={muted}
        style={{
          marginTop: "10px",
          backgroundColor:
            muted ? "gray" : "#dc2626",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {muted
          ? "Buzzer Dimatikan"
          : "🔇 Matikan Buzzer"}
      </button>
    </div>
  );
}