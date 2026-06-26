export default function GasGauge({
  gas,
}) {
  let color = "blue";

  if (gas >= 300)
    color = "orange";

  if (gas >= 600)
    color = "red";

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      <h2>Level Gas</h2>

      <div
        style={{
          width: "100%",
          height: "30px",
          background: "#ddd",
          borderRadius: "20px",
        }}
      >
        <div
          style={{
            width: `${gas / 10}%`,
            height: "30px",
            background: color,
            borderRadius: "20px",
          }}
        />
      </div>

      <p>{gas} ppm</p>
    </div>
  );
}