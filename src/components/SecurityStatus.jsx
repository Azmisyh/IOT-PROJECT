export default function SecurityStatus() {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "220px",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h3>🔒 Security</h3>

      <h2
        style={{
          color: "green",
        }}
      >
        AES-128 Aktif
      </h2>

      <p>
        Data MQTT terenkripsi
      </p>
    </div>
  );
}