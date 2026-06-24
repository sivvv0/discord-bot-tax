/**
 * Validate transaction amount
 */
function validateAmount(amount, options = {}) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  if (amount < 0 && !options.allowNegative) {
    throw new Error('Amount cannot be negative');
  }
  if (options.min !== undefined && amount < options.min) {
    throw new Error(`Amount must be at least ${options.min}`);
  }
  if (options.max !== undefined && amount > options.max) {
    throw new Error(`Amount cannot exceed ${options.max}`);
  }
  return true;
}

function hasRole(member, roleId) {
  return member.roles.cache.has(roleId);
}

function isAdmin(member) {
  return member.permissions.has('Administrator') || member.id === member.guild.ownerId;
}

function isPremium(userId, premiumUsers = new Set()) {
  return premiumUsers.has(userId);
}

module.exports = {
  validateAmount,
  hasRole,
  isAdmin,
  isPremium
};
