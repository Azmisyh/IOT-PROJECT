import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
const MQTT_COMMAND_TOPIC = "esp32/command";

// Singleton socket connection untuk command MQTT
let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("[MQTT Service] Socket terhubung:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[MQTT Service] Socket terputus");
    });

    socket.on("commandSent", ({ topic, message }) => {
      console.log(`[MQTT Service] Command terkirim: ${topic} -> ${message}`);
    });

    socket.on("error", (err) => {
      console.error("[MQTT Service] Error:", err);
    });
  }
  return socket;
}

/**
 * Kirim command "mute" ke ESP32 via MQTT
 * Mematikan buzzer sementara (alarm tetap aktif, tapi buzzer diam)
 */
export const sendMuteCommand = () => {
  const s = getSocket();
  s.emit("sendCommand", {
    topic: MQTT_COMMAND_TOPIC,
    message: "mute",
  });
  console.log("[MQTT] Mengirim command: mute");
  return true;
};

/**
 * Kirim command "unmute" ke ESP32 via MQTT
 * Mengaktifkan kembali buzzer
 */
export const sendUnmuteCommand = () => {
  const s = getSocket();
  s.emit("sendCommand", {
    topic: MQTT_COMMAND_TOPIC,
    message: "unmute",
  });
  console.log("[MQTT] Mengirim command: unmute");
  return true;
};

/**
 * Kirim command "reset" ke ESP32 via MQTT
 * Reset semua state alarm: buzzerMuted=false, alarmActive=false, buzzer OFF
 */
export const sendResetCommand = () => {
  const s = getSocket();
  s.emit("sendCommand", {
    topic: MQTT_COMMAND_TOPIC,
    message: "reset",
  });
  console.log("[MQTT] Mengirim command: reset");
  return true;
};