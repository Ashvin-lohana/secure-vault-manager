import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto';

const ALGO = 'aes-256-cbc';
const secret = process.env.SESSION_SECRET || 'fallback_dev_secret_do_not_use';
const key = scryptSync(secret, 'vaultai_salt', 32);

export function encrypt(text) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(data) {
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGO, key, iv);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

export function sha1(text) {
  return createHash('sha1').update(text).digest('hex').toUpperCase();
}
