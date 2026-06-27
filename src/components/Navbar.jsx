import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaUserCircle,
  FaWifi,
} from "react-icons/fa";

import "./../style/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Apakah Anda yakin ingin logout?"
    );

    if (confirmLogout) {
      navigate("/");
    }
  };

  const now = new Date();

  const date = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const time = now.toLocaleTimeString("id-ID");

  return (
    <nav className="navbar">

      <div className="navbar-left">

        <h2>
          🔥 Gas Leak Detection System
        </h2>

        <span>
          IoT Monitoring Dashboard
        </span>

      </div>

      <div className="navbar-center">

        <div className="datetime">

          <p>{date}</p>

          <strong>{time}</strong>

        </div>

      </div>

      <div className="navbar-right">

        <div className="status">

          <FaWifi color="#22c55e" />

          <span>ONLINE</span>

        </div>

        <div className="user">

          <FaUserCircle />

          <span>Admin</span>

        </div>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >

          <FaSignOutAlt />

          Logout

        </button>

      </div>

    </nav>
  );
}