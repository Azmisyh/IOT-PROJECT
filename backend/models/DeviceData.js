const mongoose = require('mongoose');

const deviceDataSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },
  payload: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = mongoose.model('DeviceData', deviceDataSchema);
