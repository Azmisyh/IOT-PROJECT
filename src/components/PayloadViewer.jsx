import { useState } from "react";

export default function PayloadViewer({ payload }) {
  const [showPayload, setShowPayload] = useState(false);

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
        🔐 Payload MQTT
      </h2>

      <button
        onClick={() => setShowPayload(!showPayload)}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          padding: "12px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {showPayload
          ? "Sembunyikan Payload"
          : "Lihat Payload"}
      </button>

      {showPayload && (
        <pre
          style={{
            marginTop: "20px",
            background: "#f3f4f6",
            padding: "15px",
            borderRadius: "10px",
            overflow: "auto",
            color: "#2563eb",
            fontWeight: "bold",
          }}
        >
          {payload}
        </pre>
      )}
    </div>
  );
}