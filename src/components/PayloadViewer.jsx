import { useState } from "react";

export default function PayloadViewer({
  payload,
}) {
  const [showPayload, setShowPayload] =
    useState(false);

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
      <h2>
        🔐 Payload MQTT
      </h2>

      <button
        onClick={() =>
          setShowPayload(
            !showPayload
          )
        }
        style={{
          marginTop: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        {showPayload
          ? "Sembunyikan Payload"
          : "Lihat Payload"}
      </button>

      {showPayload && (
        <pre
          style={{
            marginTop: "15px",
            backgroundColor:
              "#f4f4f4",
            padding: "10px",
            borderRadius: "5px",
            overflow: "auto",
          }}
        >
          {payload}
        </pre>
      )}
    </div>
  );
}