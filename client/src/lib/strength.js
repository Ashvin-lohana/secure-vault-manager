export function getStrengthColor(score) {
  const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-400', 'text-emerald-400'];
  return colors[score] || colors[0];
}

export function getStrengthBg(score) {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-emerald-400'];
  return colors[score] || colors[0];
}

export function getStrengthLabel(score) {
  return ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score] || 'Very Weak';
}
