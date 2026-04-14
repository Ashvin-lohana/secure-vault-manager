import { Router } from 'express';
import pool from '../db/index.js';
import { encrypt, decrypt, sha1 } from '../lib/crypto.js';
import { checkStrength } from '../lib/strength.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function formatRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    username: row.username || null,
    url: row.url || null,
    category: row.category,
    notes: row.notes || null,
    strengthScore: row.strength_score,
    strengthLabel: row.strength_label,
    isFavorite: row.is_favorite,
    lastUsed: row.last_used || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { search, category } = req.query;

    let query = 'SELECT * FROM passwords WHERE user_id = $1';
    const params = [uid];

    if (category) {
      params.push(category);
      query += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    let { rows } = await pool.query(query, params);

    if (search) {
      const term = search.toLowerCase();
      rows = rows.filter(r =>
        r.title.toLowerCase().includes(term) ||
        (r.username && r.username.toLowerCase().includes(term)) ||
        (r.url && r.url.toLowerCase().includes(term))
      );
    }

    res.json(rows.map(formatRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch passwords' });
  }
});

router.post('/', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { title, username, password, url, category, notes, isFavorite } = req.body;

    if (!title || !password) {
      return res.status(400).json({ error: 'Title and password are required' });
    }

    const strength = checkStrength(password);
    const encrypted = encrypt(password);

    const { rows } = await pool.query(
      `INSERT INTO passwords
        (user_id, title, username, encrypted_password, url, category, notes, strength_score, strength_label, is_favorite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [uid, title, username || null, encrypted, url || null, category || 'Other', notes || null, strength.score, strength.label, isFavorite || false]
    );

    res.status(201).json(formatRow(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save password' });
  }
});

router.get('/export/pdf', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query('SELECT * FROM passwords WHERE user_id = $1 ORDER BY category', [uid]);

    let content = 'VaultAI Password Export\n========================\n\n';
    for (const r of rows) {
      content += `Site: ${r.title}\n`;
      content += `Category: ${r.category}\n`;
      if (r.username) content += `Username: ${r.username}\n`;
      if (r.url) content += `URL: ${r.url}\n`;
      content += `Strength: ${r.strength_label}\n`;
      content += `Added: ${new Date(r.created_at).toLocaleDateString()}\n\n`;
    }

    const escaped = content.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\n/g, '\\n');
    const streamContent = `BT /F1 10 Tf 40 780 Td 14 TL (${escaped}) Tj ET`;

    const pdf = [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Courier>>>>>>>>endobj',
      `4 0 obj<</Length ${streamContent.length}>>`,
      'stream',
      streamContent,
      'endstream endobj',
      'xref',
      'trailer<</Size 5/Root 1 0 R>>',
      '%%EOF',
    ].join('\n');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=vaultai-export.pdf');
    res.send(Buffer.from(pdf));
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query(
      'SELECT * FROM passwords WHERE id = $1 AND user_id = $2',
      [req.params.id, uid]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    await pool.query('UPDATE passwords SET last_used = NOW() WHERE id = $1', [rows[0].id]);

    const entry = formatRow(rows[0]);
    entry.password = decrypt(rows[0].encrypted_password);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch password' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows: existing } = await pool.query(
      'SELECT * FROM passwords WHERE id = $1 AND user_id = $2',
      [req.params.id, uid]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Not found' });

    const { title, username, password, url, category, notes, isFavorite } = req.body;
    const r = existing[0];

    let strengthScore = r.strength_score;
    let strengthLabel = r.strength_label;
    let encrypted = r.encrypted_password;

    if (password) {
      const s = checkStrength(password);
      strengthScore = s.score;
      strengthLabel = s.label;
      encrypted = encrypt(password);
    }

    const { rows } = await pool.query(
      `UPDATE passwords SET
        title = $1, username = $2, encrypted_password = $3, url = $4,
        category = $5, notes = $6, is_favorite = $7,
        strength_score = $8, strength_label = $9, updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [
        title ?? r.title,
        username ?? r.username,
        encrypted,
        url ?? r.url,
        category ?? r.category,
        notes ?? r.notes,
        isFavorite ?? r.is_favorite,
        strengthScore,
        strengthLabel,
        req.params.id,
      ]
    );

    res.json(formatRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query(
      'DELETE FROM passwords WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, uid]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete password' });
  }
});

router.get('/:id/check-breach', async (req, res) => {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query(
      'SELECT * FROM passwords WHERE id = $1 AND user_id = $2',
      [req.params.id, uid]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const plain = decrypt(rows[0].encrypted_password);
    const fullHash = sha1(plain);
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!response.ok) {
      return res.json({ breached: false, occurrences: 0, message: 'Breach service unavailable right now' });
    }

    const text = await response.text();
    const match = text.split('\n').find(line => line.toUpperCase().startsWith(suffix));

    if (match) {
      const count = parseInt(match.split(':')[1].trim(), 10);
      res.json({
        breached: true,
        occurrences: count,
        message: `Found in ${count.toLocaleString()} data breaches — change this password!`,
      });
    } else {
      res.json({ breached: false, occurrences: 0, message: 'Not found in any known breaches' });
    }
  } catch (err) {
    res.json({ breached: false, occurrences: 0, message: 'Could not reach breach API' });
  }
});

export default router;
