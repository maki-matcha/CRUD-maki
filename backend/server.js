const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// correct path to user model inside models directory
const User = require('./models/User.js');
const app = express();

app.use(express.json());
app.use(cors());

// --- BUG MODEL ---
const BugSchema = new mongoose.Schema({
  title: String,
  description: String,
  severity: String,
  status: { type: String, default: 'Open' },
  affectedFile: String,
  reporter: String,
  createdAt: { type: Date, default: Date.now }
});
const Bug = mongoose.model('Bug', BugSchema);

// --- AUTH ROUTES ---

// Registration: Saves username, email, password, and role
app.post('/api/signup', async (req, res) => {
  console.log('Signup request body:', req.body);
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Signup denied - email already exists:', email);
      return res.status(400).json({ message: "Email already registered" });
    }
    
    const newUser = new User({ username, email, password, role });
    const saved = await newUser.save();
    console.log('User saved to database:', saved);
    // debug: count total users after insertion
    const count = await User.countDocuments();
    console.log(`Total users in DB: ${count}`);
    res.status(201).json({ user: { username, email, role } });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login: Verifies user via email
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    
    res.json({ user: { username: user.username, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- BUG ROUTES ---
app.get('/api/bugs', async (req, res) => {
  const bugs = await Bug.find().sort({ createdAt: -1 });
  res.json(bugs);
});

app.post('/api/bugs', async (req, res) => {
  const newBug = new Bug(req.body);
  await newBug.save();
  res.json(newBug);
});

app.patch('/api/bugs/:id', async (req, res) => {
  const updated = await Bug.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(updated);
});

app.delete('/api/bugs/:id', async (req, res) => {
  await Bug.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

mongoose.connect('mongodb://localhost:27017/strikelog')
  .then(() => {
    console.log("Connected to MongoDB at mongodb://localhost:27017/strikelog");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch(err => console.error('Mongo connection error:', err));

// --- DEBUG ROUTES ---
// quick endpoint to inspect users (not for production)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});