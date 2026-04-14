import { Router } from 'express';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import pool from '../db/index.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function userPayload(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    twoFactorEnabled: u.two_factor_enabled,
    createdAt: u.created_at,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: userPayload(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.two_factor_enabled && user.two_factor_secret) {
      return res.status(200).json({
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Enter your 2FA code to continue',
      });
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: userPayload(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ error: 'Missing userId or otp' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const valid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: otp,
      window: 2,
    });

    if (!valid) {
      return res.status(400).json({ error: 'Incorrect or expired code' });
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: userPayload(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json(userPayload(user));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/setup-2fa', requireAuth, async (req, res) => {
  try {
    const { enable } = req.body;
    const uid = req.user.userId;

    if (enable) {
      const secret = speakeasy.generateSecret({ name: 'VaultAI', length: 20 });
      await pool.query(
        'UPDATE users SET two_factor_enabled = true, two_factor_secret = $1 WHERE id = $2',
        [secret.base32, uid]
      );
      res.json({ enabled: true, message: '2FA enabled successfully' });
    } else {
      await pool.query(
        'UPDATE users SET two_factor_enabled = false, two_factor_secret = null WHERE id = $1',
        [uid]
      );
      res.json({ enabled: false, message: '2FA has been turned off' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update 2FA setting' });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

export default router;
