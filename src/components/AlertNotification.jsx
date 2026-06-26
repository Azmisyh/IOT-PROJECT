export default function AlertNotification({
  status,
}) {
  if (status !== "BAHAYA")
    return null;

  return (
    <div
      style={{
        backgroundColor: "#dc2626",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontWeight: "bold",
      }}
    >
      ⚠️ PERINGATAN!
      Kebocoran Gas Terdeteksi
    </div>
  );
}