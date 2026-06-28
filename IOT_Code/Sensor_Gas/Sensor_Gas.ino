#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>
#include "mbedtls/aes.h"
#include "base64.h"

// ==================== KONFIGURASI WiFi & MQTT ====================
const char* ssid = "Galaxy A717B3C";
const char* password = "kepowaee";
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "iot/data";
const char* mqtt_command_topic = "esp32/command";

// ==================== KONFIGURASI SECURITY (AES-128) ====================
const char* aes_key = "1234567890123456"; // 16 bytes key
const char* aes_iv  = "1234567890123456"; // 16 bytes IV

// ==================== KONFIGURASI PIN ====================
const int PIN_MQ2 = 36;      // Sensor MQ-2 (analog input)
const int PIN_BUZZER = 25;    // Buzzer output

// ==================== THRESHOLD GAS (PPM) ====================
const float GAS_THRESHOLD = 250.0f;     // Batas WASPADA
const float DANGER_THRESHOLD = 400.0f;  // Batas BAHAYA (buzzer aktif)

// ==================== VARIABEL GLOBAL ====================
WiFiClient espClient;
PubSubClient client(espClient);

bool buzzerMuted = false;    // Apakah buzzer di-mute dari dashboard
bool alarmActive = false;    // Apakah alarm sedang aktif (gas >= DANGER)
float lastPpm = 0.0f;
int lastRaw = 0;
float lastVoltage = 0.0f;

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 1000;  // Kirim data tiap 1 detik

// ==================== FUNGSI ENKRIPSI AES-128-CBC ====================
String encryptAES(String plainText) {
  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_enc(&aes, (const unsigned char*)aes_key, 128);

  // PKCS7 Padding
  int plain_len = plainText.length();
  int pad_len = 16 - (plain_len % 16);
  int cipher_len = plain_len + pad_len;
  
  unsigned char* input = (unsigned char*)malloc(cipher_len);
  memcpy(input, plainText.c_str(), plain_len);
  for (int i = plain_len; i < cipher_len; i++) {
    input[i] = pad_len;
  }

  unsigned char* output = (unsigned char*)malloc(cipher_len);
  unsigned char iv[16];
  memcpy(iv, aes_iv, 16);

  // Jalankan enkripsi CBC
  mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, cipher_len, iv, input, output);
  
  // Encode ke Base64
  String base64_encoded = base64::encode(output, cipher_len);
  
  // Bersihkan memory
  free(input);
  free(output);
  mbedtls_aes_free(&aes);

  // Hilangkan karakter baris baru yang dihasilkan encoder base64
  base64_encoded.replace("\n", "");
  base64_encoded.replace("\r", "");
  
  return base64_encoded;
}

// ==================== KONEKSI WiFi ====================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("[WiFi] Menghubungkan ke WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] Terhubung! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[WiFi] Gagal terhubung ke WiFi");
  }
}

// ==================== KONEKSI MQTT ====================
void reconnectMqtt() {
  if (client.connected()) return;

  Serial.println("[MQTT] Mencoba koneksi MQTT...");
  String clientId = "ESP32Gas-";
  clientId += String(random(0xffff), HEX);

  if (client.connect(clientId.c_str())) {
    Serial.println("[MQTT] Terhubung ke broker");
    client.subscribe(mqtt_command_topic);
    Serial.print("[MQTT] Subscribe ke: ");
    Serial.println(mqtt_command_topic);
  } else {
    Serial.print("[MQTT] Gagal, rc=");
    Serial.println(client.state());
  }
}

// ==================== CALLBACK MQTT (Terima Command dari Dashboard) ====================
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("[MQTT] Command diterima: ");
  Serial.println(message);

  if (message.equalsIgnoreCase("mute")) {
    // Matikan buzzer (dari tombol "Matikan Buzzer" di dashboard)
    buzzerMuted = true;
    digitalWrite(PIN_BUZZER, LOW);
    Serial.println("[BUZZER] Di-mute dari dashboard");

  } else if (message.equalsIgnoreCase("unmute")) {
    // Aktifkan kembali buzzer
    buzzerMuted = false;
    Serial.println("[BUZZER] Unmute - buzzer aktif kembali");

  } else if (message.equalsIgnoreCase("reset")) {
    // Reset semua state alarm (dari tombol "Reset Buzzer" di dashboard)
    buzzerMuted = false;
    alarmActive = false;
    digitalWrite(PIN_BUZZER, LOW);
    Serial.println("[BUZZER] Reset alarm - semua state direset");
  }
}

// ==================== BACA SENSOR GAS ====================
float readGasPpm(int rawValue) {
  float voltage = (rawValue / 4095.0f) * 3.3f;
  float ratio = (3.3f - voltage) / voltage;
  if (ratio <= 0.0f) ratio = 0.01f;

  float ppm = 116.6f * pow(ratio, -2.769f);
  ppm = constrain(ppm, 0.0f, 1000.0f);

  return ppm;
}

// ==================== KONTROL BUZZER ====================
void handleBuzzer() {
  // Buzzer nyala HANYA jika alarm aktif DAN tidak di-mute
  if (alarmActive && !buzzerMuted) {
    digitalWrite(PIN_BUZZER, HIGH);
  } else {
    digitalWrite(PIN_BUZZER, LOW);
  }
}

// ==================== TENTUKAN STATUS GAS ====================
const char* getGasStatus(float ppm) {
  if (ppm >= DANGER_THRESHOLD) return "BAHAYA";
  if (ppm >= GAS_THRESHOLD) return "WASPADA";
  return "AMAN";
}

// ==================== PUBLISH DATA MENTAH KE MQTT DENGAN ENKRIPSI ====================
void publishSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!client.connected()) return;

  // Baca sensor
  int raw = analogRead(PIN_MQ2);
  float voltage = (raw / 4095.0f) * 3.3f;
  float ppm = readGasPpm(raw);

  // Simpan untuk referensi
  lastRaw = raw;
  lastVoltage = voltage;
  lastPpm = ppm;

  // Tentukan status dan alarm
  const char* status = getGasStatus(ppm);

  if (ppm >= DANGER_THRESHOLD) {
    alarmActive = true;
  } else if (ppm < GAS_THRESHOLD) {
    // Gas kembali aman -> otomatis reset alarm & unmute
    alarmActive = false;
    buzzerMuted = false;
  }

  // Buzzer aktif = alarm aktif DAN tidak di-mute
  bool buzzerIsActive = (alarmActive && !buzzerMuted);

  // Ambil timestamp NTP
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char timeString[32];
  strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);

  // Bangun JSON plaintext data mentah lengkap
  String plaintextPayload = "{";
  plaintextPayload += "\"raw\":" + String(raw);
  plaintextPayload += ",\"voltage\":" + String(voltage, 3);
  plaintextPayload += ",\"ppm\":" + String(ppm, 2);
  plaintextPayload += ",\"status\":\"" + String(status) + "\"";
  plaintextPayload += ",\"alarm\":" + String(alarmActive ? "true" : "false");
  plaintextPayload += ",\"buzzerMuted\":" + String(buzzerMuted ? "true" : "false");
  plaintextPayload += ",\"buzzerActive\":" + String(buzzerIsActive ? "true" : "false");
  plaintextPayload += ",\"threshold_warning\":" + String((int)GAS_THRESHOLD);
  plaintextPayload += ",\"threshold_danger\":" + String((int)DANGER_THRESHOLD);
  plaintextPayload += ",\"timestamp\":\"" + String(timeString) + "\"";
  plaintextPayload += "}";

  // Enkripsi payload plaintext dengan AES-128-CBC
  String ciphertext = encryptAES(plaintextPayload);

  // Bungkus ciphertext ke dalam JSON pembungkus luar
  String finalPayload = "{\"ciphertext\":\"" + ciphertext + "\"}";

  // Publish ke MQTT
  bool ok = client.publish(mqtt_topic, finalPayload.c_str());

  // Log ke Serial Monitor
  Serial.print("[MQTT ENCRYPTED] ");
  Serial.print(ok ? "OK" : "FAIL");
  Serial.print(" | Ciphertext Length: ");
  Serial.println(ciphertext.length());
  
  Serial.print("  -> Plaintext: ");
  Serial.println(plaintextPayload);
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sistem Deteksi Gas MQ-2 dengan Enkripsi AES-128-CBC ===");
  Serial.println("Threshold WASPADA : " + String((int)GAS_THRESHOLD) + " ppm");
  Serial.println("Threshold BAHAYA  : " + String((int)DANGER_THRESHOLD) + " ppm");

  // Setup pin
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // Setup WiFi & MQTT
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  // Setup NTP time
  configTime(0, 0, "pool.ntp.org");

  // Koneksi awal
  connectWiFi();
  reconnectMqtt();

  Serial.println("=== Setup selesai, mulai monitoring ===\n");
}

// ==================== LOOP UTAMA ====================
void loop() {
  // Jaga koneksi WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Jaga koneksi MQTT
  if (WiFi.status() == WL_CONNECTED && !client.connected()) {
    reconnectMqtt();
  }

  // Proses pesan MQTT masuk
  if (client.connected()) {
    client.loop();
  }

  // Publish data sensor tiap PUBLISH_INTERVAL (1 detik)
  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = millis();
    publishSensorData();
  }

  // Kontrol buzzer
  handleBuzzer();

  delay(50);
}
