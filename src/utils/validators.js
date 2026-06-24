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

/**
 * Check if user has a specific role (for Discord)
 */
function hasRole(member, roleId) {
  return member.roles.cache.has(roleId);
}

/**
 * Check if user is bot admin/owner
 */
function isAdmin(member) {
  return member.permissions.has('Administrator') || member.id === member.guild.ownerId;
}

/**
 * Check if user is premium (from your database)
 */
function isPremium(userId, premiumUsers = new Set()) {
  return premiumUsers.has(userId);
}

module.exports = {
  validateAmount,
  hasRole,
  isAdmin,
  isPremium
};
