# 🔌 **Dokumentasi Sistem IoT (Mikrokontroler ESP32 & Sensor MQ-2)**

Repositori ini berisi kode program untuk mikrokontroler **ESP32** yang bertugas mendeteksi kadar kebocoran gas menggunakan sensor **MQ-2**, mengendalikan alarm lokal (buzzer), melakukan enkripsi data, dan mengirimkannya ke dashboard melalui protokol **MQTT**.

---

## 🛠️ **Komponen Perangkat Keras**

1.  **ESP32 Development Board** (sebagai pemroses utama dan modul WiFi).
2.  **Sensor Gas MQ-2** (untuk mendeteksi gas LPG, asap, propana, metana, hidrogen, dan karbon monoksida).
3.  **Active Buzzer 5V** (sebagai alarm suara lokal).
4.  **Kabel Jumper** & **Breadboard**.

---

## 🔌 **Skema Pengkabelan (Wiring Diagram)**

Untuk menghindari kesalahan pembacaan sensor (seperti sensor bertindak secara digital/tidak ada fluktuasi), pastikan koneksi kabel mengikuti tabel di bawah ini:

| Komponen | Pin Sensor/Buzzer | Pin ESP32 | Keterangan |
| :--- | :--- | :--- | :--- |
| **Sensor MQ-2** | **VCC** | **5V / VIN** | *Wajib 5V agar pemanas (heater) sensor bekerja optimal.* |
| | **GND** | **GND** | Ground bersama. |
| | **AO (Analog Output)** | **GPIO 35 (Pin 35)** | *Gunakan AO agar mendapatkan nilai fluktuasi analog.* |
| | DO (Digital Output) | *Tidak digunakan* | Biarkan kosong. |
| **Buzzer** | **Kabel Merah (+ / VCC)** | **GPIO 25 (Pin 25)** | Pin kendali alarm suara. |
| | **Kabel Hitam (- / GND)**| **GND** | Ground bersama. |

---

## ⚙️ **Algoritma dan Logika Program**

### **1. Pembacaan Sensor & Konversi PPM**
*   ESP32 membaca tegangan analog dari pin **GPIO 35** (resolusi ADC 12-bit: 0 hingga 4095).
*   Tegangan tersebut dikonversi menjadi nilai **PPM (Parts Per Million)** berdasarkan rumus kurva sensitivitas sensor MQ-2 terhadap gas LPG:
    *   $V_{out} = \frac{\text{Raw ADC}}{4095} \times 3.3\text{V}$
    *   $R_s = \frac{3.3\text{V} - V_{out}}{V_{out}}$
    *   $\text{PPM} = 116.6 \times R_s^{-2.769}$
*   Nilai PPM dibatasi (*constrained*) antara **0.0 hingga 1000.0 PPM**.

### **2. Logika Alarm (Buzzer)**
*   **Aman (PPM < 250)**: Alarm mati.
*   **Waspada (PPM 250 - 399)**: Peringatan visual di dashboard web, buzzer masih mati.
*   **Bahaya (PPM >= 400)**: Alarm aktif, buzzer berbunyi terus-menerus.
*   **Mute Jarak Jauh**: Buzzer dapat dimatikan sementara dari Dashboard Web melalui perintah MQTT tanpa menurunkan status bahaya di layar.

### **3. Keamanan Data (Enkripsi AES-128-CBC)**
*   Sebelum dikirim, data JSON mentah dienkripsi menggunakan algoritma **AES-128-CBC** dengan kunci (*Key*) dan *Initialization Vector* (IV) sepanjang 16 byte.
*   Data hasil enkripsi (*ciphertext*) di-encode ke format **Base64** sebelum dibungkus ke dalam JSON luar untuk dikirim melalui MQTT.

---

## 📨 **Protokol Komunikasi (MQTT)**

*   **Broker**: `broker.hivemq.com` (Port `1883`)
*   **Topik Publish (Mengirim Data)**: `iot/data`
    *   *Payload format*: `{"ciphertext": "Base64_String..."}`
*   **Topik Subscribe (Menerima Perintah)**: `esp32/command`
    *   *Perintah yang didukung*:
        *   `mute` : Mematikan suara buzzer secara paksa.
        *   `unmute` : Mengaktifkan kembali fungsi suara buzzer.
        *   `reset` : Mereset status alarm dan fungsi mute.

---

## 💻 **Persiapan & Pengunggahan Kode**

### **1. Library yang Dibutuhkan di Arduino IDE**
Pastikan library berikut sudah terinstal di Arduino IDE Anda:
*   **PubSubClient** (oleh Nick O'Leary) - untuk komunikasi MQTT.
*   **WiFi** (bawaan paket board ESP32).
*   **base64** (bawaan paket board ESP32).
*   **mbedtls/aes.h** (kriptografi bawaan ESP32 SDK, tidak perlu instal tambahan).

### **2. Langkah Unggah**
1.  Buka file [Sensor_Gas.ino](Sensor_Gas/Sensor_Gas.ino) di Arduino IDE.
2.  Pasang board ESP32 Anda ke komputer via kabel USB.
3.  Pilih port COM dan tipe board yang sesuai (misal: *DOIT ESP32 DEVKIT V1*).
4.  Klik **Upload** (ikon panah kanan).
5.  Buka **Serial Monitor** (baudrate `115200`) untuk melihat log koneksi WiFi, MQTT, dan status enkripsi data.
