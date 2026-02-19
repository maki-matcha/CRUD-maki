// backend/models/Bug.js
const mongoose = require('mongoose');

const BugSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  reporter: String,
  severity: { 
    type: String, 
    enum: ['Blocker', 'Critical', 'High', 'Medium', 'Low'],
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },
  affectedFile: { type: String, default: 'No file specified' },
  // Store the actual file path or URL if you have file uploads later
  fileUrl: String, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bug', BugSchema);