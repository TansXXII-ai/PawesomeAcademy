// lib/constants.js
// Shared constants used throughout the application

export const gradeRequirements = {
  1: 20, 2: 20, 3: 20,
  4: 40, 5: 40, 6: 40,
  7: 60, 8: 60, 9: 60,
  10: 80, 11: 80, 12: 80
};

export const getRoleDisplayName = (role) => {
  if (role === 'member') return 'Pawsome Pal';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const API_BASE = '/api';
