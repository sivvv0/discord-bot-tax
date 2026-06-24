/**
 * TieredTax - Different flat/percent tax per amount tier
 * Example: 0-100: flat 5, 100-1000: 3%, 1000+: 1% + 10 flat
 */

class TieredTax {
  constructor(options = {}) {
    this.tiers = options.tiers ?? [];
    this.name = 'TieredTax';

    if (!Array.isArray(this.tiers) || this.tiers.length === 0) {
      throw new Error('TieredTax: tiers must be a non-empty array');
    }

    for (const tier of this.tiers) {
      if (!tier.min && tier.min !== 0 || !tier.max || tier.value === undefined || !tier.type) {
        throw new Error('Each tier needs: min, max, value, type');
      }
      if (tier.type !== 'flat' && tier.type !== 'percentage') {
        throw new Error('Tier type must be "flat" or "percentage"');
      }
      if (tier.type === 'percentage' && (tier.value < 0 || tier.value > 1)) {
        throw new Error('Percentage value must be between 0 and 1');
      }
    }
  }

  calculate(amount, context = {}) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a positive number');
    }

    const tier = this.tiers.find(t => amount >= t.min && amount < t.max);

    if (!tier) {
      return {
        originalAmount: amount,
        taxAmount: 0,
        netAmount: amount,
        rateApplied: null,
        strategyName: this.name,
        description: 'No matching tier found',
        timestamp: new Date(),
        metadata: { matchedTier: null }
      };
    }

    let tax;
    if (tier.type === 'percentage') {
      tax = amount * tier.value;
    } else {
      tax = tier.value;
    }

    return {
      originalAmount: amount,
      taxAmount: this.round(tax),
      netAmount: this.round(Math.max(0, amount - tax)),
      rateApplied: tier.type === 'percentage' ? tier.value : null,
      strategyName: this.name,
      description: `Tier ${tier.min}-${tier.max}: ${tier.type === 'percentage' ? (tier.value * 100).toFixed(1) + '%' : 'flat ' + tier.value}`,
      timestamp: new Date(),
      metadata: { matchedTier: tier }
    };
  }

  round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  getDescription() {
    return `Tiered tax with ${this.tiers.length} tiers`;
  }
}

module.exports = { TieredTax };
