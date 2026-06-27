const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    default: 'gas-detector',
    trim: true,
  },
  status: {
    type: String,
    enum: ['safe', 'warning', 'alarm', 'offline'],
    default: 'offline',
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  location: {
    type: String,
    default: '',
    trim: true,
  },
  gasType: {
    type: String,
    default: 'LPG',
    trim: true,
  },
  thresholdGas: {
    type: Number,
    default: 400,
  },
  alarmEnabled: {
    type: Boolean,
    default: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Device', deviceSchema);
