export function checkStrength(password) {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  const tips = [];

  if (password.length < 8) {
    tips.push('Too short — use at least 8 characters');
  } else if (password.length >= 16) {
    score += 2;
  } else if (password.length >= 12) {
    score += 1;
  }

  if (hasLower) score++; else tips.push('Add lowercase letters');
  if (hasUpper) score++; else tips.push('Add uppercase letters');
  if (hasDigit) score++; else tips.push('Include some numbers');
  if (hasSymbol) score++; else tips.push('Special chars make it much stronger');

  if (/(.)\1{2,}/.test(password)) {
    score--;
    tips.push('Avoid repeating the same character');
  }

  const finalScore = Math.max(0, Math.min(4, Math.floor(score * 4 / 7)));
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const crackTimes = ['Instantly', 'Minutes', 'Days', 'Years', 'Centuries'];

  return {
    score: finalScore,
    label: labels[finalScore],
    feedback: tips.length > 0 ? tips : ['Looks good!'],
    crackTime: crackTimes[finalScore],
  };
}

export function generatePassword(opts) {
  let charset = '';

  if (opts.lowercase !== false) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.uppercase !== false) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.numbers !== false) charset += '0123456789';
  if (opts.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (opts.excludeAmbiguous) {
    charset = charset.replace(/[0O1lI]/g, '');
  }

  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

  let result = '';
  for (let i = 0; i < (opts.length || 16); i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}
