export default function AIAssistant({
  recommendation,
}) {
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
        🤖 Rekomendasi AI Gemini
      </h2>

      <p
        style={{
          marginTop: "10px",
          fontSize: "16px",
        }}
      >
        {recommendation}
      </p>
    </div>
  );
}