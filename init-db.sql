-- Create database
CREATE DATABASE devrush_db;

-- Connect to the database
\c devrush_db;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create challenges table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'easy',
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scores table
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    time_taken INTEGER, -- in seconds
    points INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample challenges
INSERT INTO challenges (title, description, difficulty, points) VALUES
('Layout Replication', 'Create a pixel-perfect layout matching the design', 'easy', 10),
('CSS Styling', 'Apply proper CSS styling and animations', 'medium', 15),
('Glass UI', 'Implement glassmorphism effects', 'hard', 20),
('Color Theory', 'Use proper color schemes and gradients', 'medium', 15),
('Spacing Logic', 'Implement consistent spacing and alignment', 'easy', 10),
('Time Control', 'Add timer functionality', 'medium', 15);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_challenge_id ON scores(challenge_id);
