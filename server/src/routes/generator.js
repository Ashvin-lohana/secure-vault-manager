import { Router } from 'express';
import { generatePassword, checkStrength } from '../lib/strength.js';

const router = Router();

router.post('/generate', (req, res) => {
  const { length = 16, uppercase = true, lowercase = true, numbers = true, symbols = false, excludeAmbiguous = false } = req.body;

  const password = generatePassword({ length, uppercase, lowercase, numbers, symbols, excludeAmbiguous });
  const strength = checkStrength(password);

  res.json({ password, strength });
});

router.post('/check-strength', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  res.json(checkStrength(password));
});

export default router;
