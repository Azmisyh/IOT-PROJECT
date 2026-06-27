# Backend untuk Alat Pendeteksi Kebocoran Gas

Backend ini sudah disesuaikan untuk proyek ESP32 pendeteksi kebocoran gas dengan fitur:
- `express` untuk REST API
- `socket.io` untuk realtime
- `mqtt` untuk komunikasi dengan ESP32
- `cors` untuk akses frontend atau aplikasi lain
- `mongoose` untuk menyimpan data ke MongoDB

## Ringkasan

Server ini menyediakan:
- REST API untuk baca dan simpan data
- MQTT subscriber untuk menerima data sensor
- Socket.IO realtime untuk meneruskan data ke frontend atau aplikasi lain
- Koneksi penuh ke MongoDB dengan `mongoose`

## Setup MongoDB

### 1. MongoDB lokal
Jika menggunakan MongoDB lokal, biarkan seperti default pada `.env.example`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/iot
```
Pastikan MongoDB sudah berjalan di mesin kamu.

Jika belum mengaktifkan MongoDB, jalankan:
```powershell
mongod --dbpath "C:\data\db"
```
atau jika pakai layanan Windows, jalankan service MongoDB dari Services.

### 2. MongoDB Atlas atau cloud
Jika kamu pakai MongoDB Atlas, ganti `MONGO_URI` dengan connection string Atlas:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/iot?retryWrites=true&w=majority
```

### 3. Konfigurasi file env
Salin `env.example` ke `.env`:
```powershell
copy .env.example .env
```
Lalu edit nilai berikut:
- `PORT` = port backend berjalan
- `MONGO_URI` = connection string MongoDB
- `MQTT_URL` = broker MQTT
- `MQTT_TOPIC` = topik MQTT untuk data sensor
- `CORS_ORIGIN` = origin yang boleh mengakses backend

## Menjalankan backend

1. Install dependency:
   ```bash
   npm install
   ```
2. Jalankan server:
   ```bash
   npm start
   ```

Jika MongoDB berhasil tersambung, server akan menampilkan pesan koneksi MongoDB di konsol.

## Quick connect: hardware + frontend

1. Pastikan `.env` sudah berisi nilai ini:
   ```env
   MQTT_URL=mqtt://broker.hivemq.com
   MQTT_TOPIC=iot/data
   CORS_ORIGIN=http://localhost:5173
   ```
   - `MQTT_TOPIC` harus sama dengan yang dipakai ESP32.
   - `CORS_ORIGIN` ganti dengan URL frontend kamu.

2. Jalankan backend:
   ```bash
   npm start
   ```

3. Hardware ESP32:
   - `mqtt_server` = `broker.hivemq.com`
   - `publish_topic` = `iot/data`
   - `subscribe_topic` = `esp32/command`
   - contoh payload JSON:
     ```json
     {
       "gas_ppm": 450,
       "gasType": "LPG",
       "alarm": true,
       "batteryVoltage": 3.78,
       "temperature": 29,
       "humidity": 60
     }
     ```
   - ESP32 akan publish ke `iot/data`, lalu backend akan menyimpan data dan mengirim event realtime.

4. Frontend:
   - Ambil data gas terbaru via:
     ```http
     GET http://localhost:3000/api/gas-readings/latest
     ```
   - Ambil daftar semua device:
     ```http
     GET http://localhost:3000/api/devices
     ```
   - Ambil riwayat data device:
     ```http
     GET http://localhost:3000/api/devices/:id/readings
     ```
   - Kalau ingin manual kirim data lewat HTTP:
     ```http
     POST http://localhost:3000/api/gas-readings
     Content-Type: application/json

     {
       "deviceName": "Detector LPG Ruang Tamu",
       "topic": "iot/data",
       "payload": {
         "gas_ppm": 450,
         "gasType": "LPG",
         "alarm": true,
         "batteryVoltage": 3.78,
         "temperature": 29,
         "humidity": 60
       }
     }
     ```

5. Jika frontend menggunakan Socket.IO:
   - connect ke backend `http://localhost:3000`
   - dengarkan event `newData`
   - frontend akan langsung dapat notifikasi data gas baru setiap kali ESP32 publish

## API Documentation

### Base URL
```
http://localhost:3000
```

### GET / 
Status server.

Response:
```json
{
  "status": "OK",
  "message": "IoT backend running"
}
```

### GET /api/data
Mengambil data terbaru dari MongoDB.

Response:
```json
[
  {
    "_id": "...",
    "topic": "iot/data",
    "payload": "{\"temperature\":25}",
    "createdAt": "2026-06-27T..."
  }
]
```

### POST /api/data
Menyimpan data baru ke MongoDB dan mengirim event realtime.

Request body (JSON):
```json
{
  "topic": "iot/data",
  "payload": "{\"temperature\":25}"
}
```

Response:
```json
{
  "_id": "...",
  "topic": "iot/data",
  "payload": "{\"temperature\":25}",
  "createdAt": "2026-06-27T..."
}
```

## Socket.IO Events

### events dari server
- `newData`
  - dikirim ketika data baru tiba dari MQTT atau endpoint `POST /api/data`
  - payload: objek data yang disimpan

### events ke server
- `sendCommand`
  - digunakan frontend atau aplikasi lain untuk publish perintah ke MQTT
  - payload contoh:
    ```json
    {
      "topic": "esp32/command",
      "message": "ON"
    }
    ```

Server akan publish pesan ini ke broker MQTT yang sudah dikonfigurasi.

## Endpoint tambahan untuk device dan data gas

### Device
- `GET /api/devices` -> ambil semua device
- `POST /api/devices` -> buat device baru
- `POST /api/devices/register` -> daftar atau update device dari ESP32
- `GET /api/devices/:id` -> detail device
- `PUT /api/devices/:id` -> update device
- `DELETE /api/devices/:id` -> hapus device
- `GET /api/devices/:id/readings` -> ambil semua data untuk device

Contoh mendaftarkan device gas detector:
```json
{
  "name": "Detector LPG Ruang Tamu",
  "topic": "iot/room1",
  "location": "Ruang Tamu",
  "gasType": "LPG",
  "thresholdGas": 400
}
```

### Data gas
- `GET /api/gas-readings` -> ambil semua data gas terbaru
- `GET /api/gas-readings/latest` -> ambil satu data gas terbaru
- `POST /api/gas-readings` -> simpan data gas
- `GET /api/gas-readings/:deviceId` -> ambil data gas berdasarkan device

Contoh payload yang cocok untuk ESP32 atau frontend:
```json
{
  "deviceName": "Detector LPG Ruang Tamu",
  "topic": "iot/room1",
  "payload": {
    "gas_ppm": 450,
    "gasType": "LPG",
    "alarm": true,
    "batteryVoltage": 3.78,
    "temperature": 29,
    "humidity": 60
  }
}
```

### Status backend
- `GET /api/status` -> cek kondisi backend dan koneksi MQTT/MongoDB

Respon:
```json
{
  "service": "gas-detector-backend",
  "uptime": 123.45,
  "port": 3000,
  "mongoState": "connected",
  "mqttConnected": true,
  "mqttTopic": "iot/data"
}
```

### Ready-to-use API untuk frontend
- frontend bisa memanggil `GET /api/gas-readings/latest` untuk tampilan dashboard real-time
- frontend bisa memanggil `GET /api/devices` dan `GET /api/devices/:id/readings` untuk daftar device dan riwayat
- frontend bisa memanggil `POST /api/gas-readings` untuk kirim data manual atau tes
- hardware ESP32 dapat publish ke MQTT topic atau menggunakan `POST /api/gas-readings` ketika ingin langsung HTTP

## MQTT dan database

- Backend subscribe ke topik `MQTT_TOPIC`.
- Pesan MQTT yang masuk akan disimpan ke koleksi MongoDB `deviceData`.
- Setelah disimpan, backend mengirim event Socket.IO `newData`.

## Contoh koneksi MongoDB

Jika menggunakan MongoDB lokal:
```env
MONGO_URI=mongodb://127.0.0.1:27017/iot
```

Jika menggunakan MongoDB Atlas:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/iot?retryWrites=true&w=majority
```

Jika kamu mendapatkan error `querySrv ECONNREFUSED`, ini biasanya masalah DNS SRV. Tambahkan public DNS resolver ke `.env`:
```env
DNS_SERVERS=8.8.8.8,1.1.1.1
```

Kemudian restart backend:
```bash
npm start
```

## Contoh ESP32
Lihat `examples/esp32_example.ino`.

## Catatan penting

- Pastikan `MONGO_URI` valid agar backend bisa menyimpan data ke MongoDB.
- Gunakan `CORS_ORIGIN` untuk mengizinkan frontend temanmu mengakses API.
- Jika ingin koneksi realtime, frontend harus connect ke Socket.IO di URL backend.
