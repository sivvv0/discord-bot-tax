const { TaxEngine } = require('./TaxEngine');
const { FlatTax, PercentageTax, ProgressiveTax, TieredTax } = require('./strategies');
const { formatCurrency, createTaxEmbed, createBreakdownEmbed, taxSummary } = require('./utils/formatters');
const { validateAmount, hasRole, isAdmin, isPremium } = require('./utils/validators');
const { TaxEmbed } = require('./embeds/TaxEmbed');

module.exports = {
  // Core
  TaxEngine,

  // Strategies
  FlatTax,
  PercentageTax,
  ProgressiveTax,
  TieredTax,

  // Discord Embeds
  TaxEmbed,

  // Formatters
  formatCurrency,
  createTaxEmbed,
  createBreakdownEmbed,
  taxSummary,

  // Validators
  validateAmount,
  hasRole,
  isAdmin,
  isPremium,

  // Version
  version: '1.0.0'
};
