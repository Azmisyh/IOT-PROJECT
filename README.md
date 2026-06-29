# **Mikrokontroler**

# **Kelompok 6**

Anggota

Cindy Claudia Septiani - 23552011412

Azmi Syahri Ramadhan - 23552011068

Luthfy Arief - 23552011045

---

# **Sistem Deteksi Kebocoran Gas Berbasis IoT dengan Enkripsi AES-128 & Integrasi Gemini AI**

Proyek ini adalah sistem pemantauan kebocoran gas berbasis Internet of Things (IoT) yang dirancang untuk mendeteksi gas berbahaya (seperti LPG, asap, dll.) secara real-time. Sistem ini mengintegrasikan perangkat keras (ESP32 + MQ-2), broker MQTT, backend server (Node.js), database (MongoDB), dan dashboard frontend (React.js) dengan fitur keamanan enkripsi data end-to-end serta rekomendasi keselamatan pintar menggunakan kecerdasan buatan (Gemini AI).

---

## **📂 Struktur Proyek**

Sistem ini terbagi menjadi tiga komponen utama:
1. **`IOT_Code/`**: Berisi kode pemrograman mikrokontroler (Arduino/ESP32) untuk membaca sensor, mengontrol alarm lokal, mengenkripsi data, dan mengirimkannya melalui MQTT.
2. **`backend/`**: Server Node.js (Express) yang mendekripsi data dari MQTT, menyimpannya di MongoDB, memancarkan data secara real-time ke web menggunakan Socket.io, serta menyediakan rekomendasi keselamatan berbasis Gemini AI.
3. **`src/` & `public/`**: Dashboard frontend berbasis React dan Vite untuk visualisasi data sensor, kontrol alarm jarak jauh (Mute), dan menampilkan rekomendasi dari AI.

---

## **💡 Fitur Utama**

*   **Deteksi Real-Time**: Memantau kadar gas dalam satuan PPM (Parts Per Million) secara instan.
*   **Enkripsi AES-128-CBC**: Mengamankan transmisi data sensor dari ESP32 ke Backend Server untuk mencegah penyadapan data (*eavesdropping*).
*   **Sistem Alarm 3 Tingkat**:
    *   `AMAN` (Gas < 250 PPM) - Kondisi normal.
    *   `WASPADA` (Gas 250 - 400 PPM) - Peringatan visual pada dashboard.
    *   `BAHAYA` (Gas >= 400 PPM) - Buzzer fisik pada ESP32 berbunyi dan alarm visual aktif.
*   **Mute Alarm Nirkabel**: Mematikan suara buzzer fisik ESP32 secara remote langsung dari tombol di Dashboard Web (mengirimkan perintah balik melalui topik MQTT khusus).
*   **Rekomendasi Keselamatan Gemini AI**: Menghasilkan panduan tindakan evakuasi atau pencegahan yang dinamis dan relevan berdasarkan tingkat kebocoran gas menggunakan Google Gemini API.
*   **Visualisasi Grafis**: Grafik riwayat kadar gas untuk menganalisis tren kebocoran.

---

## **⚙️ Arsitektur Aliran Data**

```text
+-------------------+             +-----------------------+             +---------------------------+
|   Perangkat Keras |             |     Broker MQTT       |             |      Server Backend       |
|  - ESP32          |             |   - HiveMQ Broker     |             |  - Node.js & Express      |
|  - Sensor MQ-2    |             |                       |             |  - AES-128 Decryption     |
|  - Buzzer         |             |                       |             |  - MongoDB (Database)     |
|                   |             |                       |             |  - Gemini AI API          |
+---------+---------+             +-----------+-----------+             +-------------+-------------+
          |                                   ^                                       |
          |  1. Publish Data (AES Encrypted)  |   2. Forward Data                     |
          +-----------------------------------+-------------------------------------->+
          |                                                                           |
          |  4. Terima Command Mute           |   3. Publish Command Mute             |
          <-----------------------------------+---------------------------------------+
                                                                                      |
                                                                                      | 4. Kirim Real-Time
                                                                                      |    (Socket.io)
                                                                                      v
                                                                        +-------------+-------------+
                                                                        |    Dashboard Frontend     |
                                                                        |  - React.js & Vite        |
                                                                        |  - Status & Grafik PPM    |
                                                                        |  - Tombol Mute Alarm      |
                                                                        |  - Rekomendasi Gemini AI  |
                                                                        +---------------------------+
```

---

## **🚀 Cara Menjalankan Proyek**

### **1. Konfigurasi Backend**
*   Masuk ke direktori `backend/`.
*   Buat file `.env` (jika belum ada) dan isi dengan konfigurasi berikut:
    ```env
    PORT=3000
    MONGO_URI=mongodb://127.0.0.1:27017/iot
    MQTT_URL=mqtt://broker.hivemq.com
    MQTT_TOPIC=iot/data
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```
*   Instal dependensi dan jalankan server:
    ```bash
    npm install
    npm run dev
    ```

### **2. Konfigurasi Frontend**
*   Kembali ke root direktori proyek.
*   Instal dependensi dan jalankan aplikasi React:
    ```bash
    npm install
    npm run dev
    ```
*   Buka browser pada alamat [http://localhost:5173](http://localhost:5173).

### **3. Mengunggah Kode ESP32**
*   Buka file [Sensor_Gas.ino](file:///a:/IOT%20Project/IOT_Code/Sensor_Gas/Sensor_Gas.ino) menggunakan Arduino IDE.
*   Sesuaikan konfigurasi `ssid` dan `password` WiFi dengan jaringan Anda.
*   Unggah kode ke papan ESP32 Anda.


