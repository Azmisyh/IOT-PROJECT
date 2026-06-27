require('dotenv').config({ override: true });
const dns = require('dns');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const DeviceData = require('./models/DeviceData');
const Device = require('./models/Device');
const SensorReading = require('./models/SensorReading');

const dnsResolvers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsResolvers.length) {
  dns.setServers(dnsResolvers);
}

const app = express();
const server = http.createServer(app);

// CORS configuration: allow comma-separated origins in .env (CORS_ORIGIN)
const rawCors = process.env.CORS_ORIGIN || '';
const corsWhitelist = rawCors.split(',').map(s => s.trim()).filter(Boolean);
const allowAllOrigins = corsWhitelist.length === 0 || (corsWhitelist.length === 1 && corsWhitelist[0] === '*');

const io = new Server(server, {
  cors: {
    origin: allowAllOrigins ? '*' : corsWhitelist,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: !allowAllOrigins,
  },
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iot';
const MQTT_URL = process.env.MQTT_URL || 'mqtt://broker.hivemq.com';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'iot/data,iot';
const MQTT_TOPICS = MQTT_TOPIC.split(',').map((s) => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowAllOrigins) return callback(null, true);
    if (corsWhitelist.indexOf(origin) !== -1) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

function buildPayloadObject(payload) {
  if (typeof payload === 'object' && payload !== null) {
    return payload;
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      return { value: payload };
    }
  }

  return { value: payload };
}

function getGasValue(payload) {
  const rawValue = payload.gas_ppm ?? payload.kadar_gas ?? payload.gasValue ?? payload.ppm ?? payload.gas ?? payload.value;
  const numberValue = Number(rawValue);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getAlarmState(payload, gasValue) {
  if (
    payload.alarm === true ||
    payload.alarmActive === true ||
    payload.status === 'alarm' ||
    payload.status === 'BAHAYA' ||
    payload.status === 'Danger'
  ) {
    return true;
  }

  if (payload.warning === true || payload.status === 'WASPADA') {
    return false;
  }

  if (payload.warning === true) {
    return false;
  }

  if (payload.thresholdGas !== undefined && gasValue !== null) {
    return gasValue >= Number(payload.thresholdGas);
  }

  return false;
}

function getGeminiRecommendation(status) {
  switch ((status || '').toString().toUpperCase()) {
    case 'BAHAYA':
      return 'Segera buka ventilasi, matikan sumber api, dan evakuasi area.';
    case 'WASPADA':
      return 'Periksa area sekitar sensor dan tingkatkan ventilasi.';
    default:
      return 'Kondisi ruangan aman dan terkendali.';
  }
}

async function saveSensorReading({ topic, payload, deviceId = null, deviceName = '' }) {
  const parsedPayload = buildPayloadObject(payload);
  const gasValuePPM = getGasValue(parsedPayload);
  const alarmActive = getAlarmState(parsedPayload, gasValuePPM);

  let device = null;

  if (deviceId) {
    device = await Device.findById(deviceId);
  } else if (topic) {
    device = await Device.findOne({ topic });
  }

  if (!device && topic) {
    device = await Device.create({
      name: deviceName || topic.replace(/^.*\//, '').toUpperCase(),
      topic,
      type: 'gas-detector',
      status: alarmActive ? 'alarm' : 'safe',
      gasType: parsedPayload.gasType || parsedPayload.gas_type || 'LPG',
      thresholdGas: parsedPayload.thresholdGas ?? parsedPayload.threshold ?? 400,
      alarmEnabled: parsedPayload.alarmEnabled ?? parsedPayload.alarm_enabled ?? true,
      metadata: { source: 'mqtt' },
    });
  }

  if (device) {
    device.lastSeen = new Date();
    device.status = alarmActive ? 'alarm' : (gasValuePPM !== null && gasValuePPM > 0 ? 'warning' : 'safe');
    device.gasType = parsedPayload.gasType || parsedPayload.gas_type || device.gasType || 'LPG';
    device.thresholdGas = parsedPayload.thresholdGas ?? parsedPayload.threshold ?? device.thresholdGas ?? 400;
    device.alarmEnabled = parsedPayload.alarmEnabled ?? parsedPayload.alarm_enabled ?? device.alarmEnabled ?? true;
    await device.save();
  }

  const reading = await SensorReading.create({
    deviceId: device?._id || null,
    deviceName: device?.name || deviceName || '',
    topic,
    payload: parsedPayload,
    gasValuePPM,
    gasType: parsedPayload.gasType || parsedPayload.gas_type || 'LPG',
    alarmActive,
    batteryVoltage: parsedPayload.batteryVoltage ?? parsedPayload.battery ?? null,
    temperature: parsedPayload.temperature ?? null,
    humidity: parsedPayload.humidity ?? null,
  });

  return { reading, device };
}

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'IoT backend running' });
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await DeviceData.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { topic, payload } = req.body;
    const record = new DeviceData({ topic, payload });
    await record.save();
    await saveSensorReading({ topic, payload, deviceName: req.body.deviceName || '' });
    io.emit('newData', record);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
});

app.get('/api/devices', async (req, res) => {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil daftar device' });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const { name, type, status, topic, location, gasType, thresholdGas, alarmEnabled, metadata } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ error: 'Nama dan topic device wajib diisi' });
    }

    const device = await Device.create({
      name,
      type: type || 'gas-detector',
      status: status || 'offline',
      topic,
      location: location || '',
      gasType: gasType || 'LPG',
      thresholdGas: thresholdGas ?? 400,
      alarmEnabled: alarmEnabled ?? true,
      metadata: metadata || {},
    });

    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: 'Gagal membuat device' });
  }
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device tidak ditemukan' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil detail device' });
  }
});

app.put('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) {
      return res.status(404).json({ error: 'Device tidak ditemukan' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengupdate device' });
  }
});

app.delete('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device tidak ditemukan' });
    }

    await SensorReading.deleteMany({ deviceId: req.params.id });
    res.json({ message: 'Device berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus device' });
  }
});

app.get('/api/sensor-data', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await SensorReading.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name topic status gasType thresholdGas alarmEnabled');

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data sensor' });
  }
});

app.post('/api/sensor-data', async (req, res) => {
  try {
    const { deviceId, deviceName, topic, payload } = req.body;

    if (!topic || payload === undefined) {
      return res.status(400).json({ error: 'Field topic dan payload wajib diisi' });
    }

    const { reading } = await saveSensorReading({
      topic,
      payload,
      deviceId,
      deviceName,
    });

    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menyimpan data sensor' });
  }
});

app.get('/api/sensor-data/:deviceId', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await SensorReading.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name topic status gasType thresholdGas alarmEnabled');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data sensor per device' });
  }
});

app.get('/api/gas-readings', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await SensorReading.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name topic status gasType thresholdGas alarmEnabled');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data gas' });
  }
});

app.post('/api/gas-readings', async (req, res) => {
  try {
    const { deviceId, deviceName, topic, payload } = req.body;

    if (!topic || payload === undefined) {
      return res.status(400).json({ error: 'Field topic dan payload wajib diisi' });
    }

    const { reading } = await saveSensorReading({
      topic,
      payload,
      deviceId,
      deviceName,
    });

    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Gagal menyimpan data gas' });
  }
});

app.get('/api/gas-readings/:deviceId', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await SensorReading.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name topic status gasType thresholdGas alarmEnabled');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data gas per device' });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    res.json({
      service: 'gas-detector-backend',
      uptime: process.uptime(),
      port: PORT,
      mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      mqttConnected: mqttClient && mqttClient.connected,
      mqttTopic: MQTT_TOPIC,
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal membaca status server' });
  }
});

app.get('/api/gemini', (req, res) => {
  const status = req.query.status || 'AMAN';
  res.json({
    status: status.toString().toUpperCase(),
    recommendation: getGeminiRecommendation(status),
  });
});

app.get('/api/gas-readings/latest', async (req, res) => {
  try {
    const reading = await SensorReading.findOne()
      .sort({ createdAt: -1 })
      .populate('deviceId', 'name topic status gasType thresholdGas alarmEnabled');
    if (!reading) {
      return res.status(404).json({ error: 'Data gas terbaru tidak ditemukan' });
    }
    res.json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data gas terbaru' });
  }
});

app.post('/api/devices/register', async (req, res) => {
  try {
    const { name, topic, location, gasType, thresholdGas } = req.body;
    if (!name || !topic) {
      return res.status(400).json({ error: 'Nama dan topic device wajib diisi' });
    }

    let device = await Device.findOne({ topic });
    if (!device) {
      device = await Device.create({
        name,
        type: 'gas-detector',
        status: 'offline',
        topic,
        location: location || '',
        gasType: gasType || 'LPG',
        thresholdGas: thresholdGas ?? 400,
        alarmEnabled: true,
      });
    }

    res.status(200).json(device);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mendaftarkan device' });
  }
});

app.get('/api/devices/:id/readings', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await SensorReading.find({ deviceId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name topic status gasType thresholdGas alarmEnabled');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data device per device' });
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('sendCommand', ({ topic, message }) => {
    if (topic && message) {
      mqttClient.publish(topic, message, { qos: 0 }, (err) => {
        if (err) {
          console.error('MQTT publish error:', err);
          socket.emit('error', 'Gagal mengirim command MQTT');
        } else {
          socket.emit('commandSent', { topic, message });
        }
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON received:', err.message);
    return res.status(400).json({ error: 'JSON tidak valid. Pastikan body request adalah JSON yang benar.' });
  }
  next(err);
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

let mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on('connect', () => {
  console.log(`Connected to MQTT broker: ${MQTT_URL}`);
  mqttClient.subscribe(MQTT_TOPICS, { qos: 0 }, (err) => {
    if (err) {
      console.error(`Failed subscribing to topics ${MQTT_TOPICS.join(',')}:`, err);
    } else {
      console.log(`Subscribed to MQTT topics: ${MQTT_TOPICS.join(',')}`);
    }
  });
});

mqttClient.on('message', async (topic, messageBuffer) => {
  const message = messageBuffer.toString();
  const payload = message;

  const data = new DeviceData({ topic, payload });
  await data.save().catch((error) => console.error('Failed saving MQTT message:', error));

  await saveSensorReading({ topic, payload: message }).catch((error) => console.error('Failed saving sensor reading:', error));

  io.emit('newData', { topic, payload: message });
  console.log(`MQTT message received: ${topic} -> ${message}`);
});

mqttClient.on('error', (error) => {
  console.error('MQTT client error:', error);
});

function startServer(port) {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = port + 1;
      console.error(`Port ${port} already in use. Trying ${fallbackPort}...`);
      server.close(() => startServer(fallbackPort));
    } else {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log(`Backend berjalan di http://localhost:${port}`);
  });
}

startServer(PORT);
