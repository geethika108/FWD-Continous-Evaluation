const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // Change in production

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres', // Change to your PostgreSQL username
  host: 'localhost',
  database: 'devrush_db', // Change to your database name
  password: 'password', // Change to your password
  port: 5432,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Auth routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, score',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, score: user.score } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Challenge routes
app.get('/api/challenges', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM challenges');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/challenges/:id/submit', authenticate, async (req, res) => {
  const { id } = req.params;
  const { time, points } = req.body;

  try {
    // Update user score
    await pool.query(
      'UPDATE users SET score = score + $1, challenges_completed = challenges_completed + 1 WHERE id = $2',
      [points, req.user.id]
    );

    // Insert score record
    await pool.query(
      'INSERT INTO scores (user_id, challenge_id, time_taken, points) VALUES ($1, $2, $3, $4)',
      [req.user.id, id, time, points]
    );

    // Get updated user score
    const userResult = await pool.query('SELECT score FROM users WHERE id = $1', [req.user.id]);
    const newScore = userResult.rows[0].score;

    res.json({ message: 'Score submitted', newScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const users = readData('users.json');
  const leaderboard = users
    .map(u => ({ username: u.username, score: u.score, challenges: u.challengesCompleted }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(leaderboard);
});

// User profile
app.get('/api/profile', authenticate, (req, res) => {
  const users = readData('users.json');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user.id, username: user.username, email: user.email, score: user.score, challengesCompleted: user.challengesCompleted });
});

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
});
