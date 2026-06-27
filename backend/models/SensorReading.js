const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  deviceName: {
    type: String,
    default: '',
    trim: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  payload: {
    type: Object,
    required: true,
    default: {},
  },
  gasValuePPM: {
    type: Number,
    default: null,
  },
  gasType: {
    type: String,
    default: 'LPG',
    trim: true,
  },
  alarmActive: {
    type: Boolean,
    default: false,
  },
  batteryVoltage: {
    type: Number,
    default: null,
  },
  temperature: {
    type: Number,
    default: null,
  },
  humidity: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
