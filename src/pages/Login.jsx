import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
        }}
      >
        <h2>Login</h2>

        <input
          type="text"
          placeholder="Username"
          style={{
            display: "block",
            marginBottom: "10px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          style={{
            display: "block",
            marginBottom: "10px",
          }}
        />

        <button type="submit">
          Login
        </button>
      </form>
    </div>
  );
}