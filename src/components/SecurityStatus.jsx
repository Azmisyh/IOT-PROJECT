export default function SecurityStatus({ isEncrypted }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "220px",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <h3>🔒 Keamanan Data</h3>

      <h2
        style={{
          color: isEncrypted ? "#22c55e" : "#eab308",
          marginTop: "10px",
        }}
      >
        {isEncrypted ? "AES-128-CBC Aktif" : "Menghubungkan..."}
      </h2>

      <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "5px" }}>
        {isEncrypted 
          ? "Data MQTT didekripsi aman end-to-end." 
          : "Menunggu enkripsi dari sensor..."}
      </p>
    </div>
  );
}