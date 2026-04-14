import { Router } from 'express';
import pool from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function formatRow(row) {
  return {
    id: row.id,
    title: row.title,
    username: row.username || null,
    url: row.url || null,
    category: row.category,
    strengthScore: row.strength_score,
    strengthLabel: row.strength_label,
  };
}

function getReusedSet(rows) {
  const count = new Map();
  for (const r of rows) {
    count.set(r.encrypted_password, (count.get(r.encrypted_password) || 0) + 1);
  }
  return new Set([...count.entries()].filter(([, v]) => v > 1).map(([k]) => k));
}

router.get('/stats', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1', [uid]);

    const reusedSet = getReusedSet(rows);
    const strong = rows.filter(r => r.strength_score >= 3).length;
    const weak = rows.filter(r => r.strength_score <= 1).length;
    const reused = rows.filter(r => reusedSet.has(r.encrypted_password)).length;
    const breached = rows.filter(r => r.strength_score === 0).length;

    const catMap = new Map();
    for (const r of rows) {
      catMap.set(r.category, (catMap.get(r.category) || 0) + 1);
    }

    const categoryBreakdown = [...catMap.entries()].map(([category, count]) => ({ category, count }));

    let healthScore = 100;
    if (rows.length > 0) {
      healthScore = Math.max(0, Math.min(100,
        Math.round(((strong - weak * 2 - reused - breached * 3) / rows.length + 1) * 50)
      ));
    }

    res.json({
      totalPasswords: rows.length,
      strongPasswords: strong,
      weakPasswords: weak,
      reusedPasswords: reused,
      breachedPasswords: breached,
      categoryBreakdown,
      healthScore,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/health', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1', [uid]);
    const reusedSet = getReusedSet(rows);

    res.json({
      weak: rows.filter(r => r.strength_score <= 1).map(formatRow),
      reused: rows.filter(r => reusedSet.has(r.encrypted_password)).map(formatRow),
      breached: rows.filter(r => r.strength_score === 0).map(formatRow),
      strong: rows.filter(r => r.strength_score >= 3).map(formatRow),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get health data' });
  }
});

export default router;
