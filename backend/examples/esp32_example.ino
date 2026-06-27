#include <WiFi.h>
#include <PubSubClient.h>

// ==================== KONFIGURASI WIFI & MQTT ====================
const char* ssid        = "YOUR_WIFI_SSID";
const char* password    = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "broker.hivemq.com";
const int   mqtt_port   = 1883;
const char* publish_topic = "iot";
const char* subscribe_topic = "esp32/command";

// ==================== KONFIGURASI SENSOR MQ2 ====================
const int   PIN_MQ2    = 36;            // Pin analog ADC
const float RL_VALUE   = 10.0;          // Resistor load (kOhm)
const float RO_CLEAN_AIR_FACTOR = 9.83; // Factor untuk udara bersih (MQ2)
const int   CALIBRATION_SAMPLES = 50;
const int   CALIBRATION_INTERVAL = 500;

WiFiClient espClient;
PubSubClient client(espClient);
float Ro = 10.0;

float MQResistanceCalculation(int raw_adc) {
  if (raw_adc == 0) {
    return -1;
  }
  return RL_VALUE * (4095.0 - raw_adc) / raw_adc;
}

float MQCalibration(int mq_pin) {
  float val = 0;
  for (int i = 0; i < CALIBRATION_SAMPLES; i++) {
    val += MQResistanceCalculation(analogRead(mq_pin));
    delay(CALIBRATION_INTERVAL);
  }
  val = val / CALIBRATION_SAMPLES;
  val = val / RO_CLEAN_AIR_FACTOR;
  return val;
}

float MQGetGasPercentage(float rs_ro_ratio, float* pcurve) {
  return pow(10, ((log10(rs_ro_ratio) - pcurve[1]) / pcurve[2]) + pcurve[0]);
}

float getLpgPpm(int raw_adc) {
  float rs = MQResistanceCalculation(raw_adc);
  if (rs < 0 || Ro <= 0) {
    return 0;
  }
  float rs_ro_ratio = rs / Ro;
  float LPGCurve[3] = {2.3, 0.21, -0.47};
  return MQGetGasPercentage(rs_ro_ratio, LPGCurve);
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Received on topic: ");
  Serial.println(topic);
  Serial.print("Message: ");
  Serial.println(message);

  if (String(topic) == subscribe_topic) {
    if (message == "RESET") {
      Serial.println("Command: reset alarm");
    } else if (message == "ON") {
      Serial.println("Command: aktifkan relay / buzzer");
    } else if (message == "OFF") {
      Serial.println("Command: matikan relay / buzzer");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32GasDetector-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.subscribe(subscribe_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MQ2, INPUT);

  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  Serial.println("Calibrating MQ2 sensor...");
  Ro = MQCalibration(PIN_MQ2);
  Serial.print("Calibration completed, Ro = ");
  Serial.print(Ro);
  Serial.println(" kOhm");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 5000) {
    lastPublish = millis();

    int rawValue = analogRead(PIN_MQ2);
    float gasPpm = getLpgPpm(rawValue);
    bool alarm = gasPpm > 400;
    float battery = 3.78;

    String payload = "{\"kadar_gas\":" + String(gasPpm, 2) + ",\"status\":\"" + String(alarm ? "BAHAYA" : "AMAN") + "\",\"batteryVoltage\":" + String(battery, 2) + "}";

    Serial.print("Raw ADC: ");
    Serial.print(rawValue);
    Serial.print(" | LPG ppm: ");
    Serial.println(gasPpm);
    Serial.print("Publishing: ");
    Serial.println(payload);

    client.publish(publish_topic, payload.c_str());
  }
}
