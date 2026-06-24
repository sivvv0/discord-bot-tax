/**
 * ProgressiveTax - Tax brackets like real income tax
 * Example: 0-100: 0%, 100-500: 5%, 500+: 10%
 */

class ProgressiveTax {
  constructor(options = {}) {
    this.brackets = options.brackets ?? [];
    this.cumulative = options.cumulative ?? false;
    this.name = 'ProgressiveTax';

    if (!Array.isArray(this.brackets) || this.brackets.length === 0) {
      throw new Error('ProgressiveTax: brackets must be a non-empty array of [maxAmount, rate]');
    }

    let prev = -1;
    for (const [max, rate] of this.brackets) {
      if (typeof max !== 'number' || typeof rate !== 'number') {
        throw new Error('Each bracket must be [number, number]');
      }
      if (rate < 0 || rate > 1) {
        throw new Error('Rate must be between 0 and 1');
      }
      if (max <= prev) {
        throw new Error('Brackets must be in ascending order');
      }
      prev = max;
    }
  }

  calculate(amount, context = {}) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a positive number');
    }

    let tax = 0;
    let previousMax = 0;
    const breakdown = [];

    for (const [bracketMax, rate] of this.brackets) {
      if (amount <= previousMax) break;

      const taxable = Math.min(amount, bracketMax) - previousMax;
      const bracketTax = taxable * rate;
      tax += bracketTax;

      breakdown.push({
        range: `${previousMax} - ${bracketMax}`,
        taxable,
        rate: `${(rate * 100).toFixed(1)}%`,
        tax: this.round(bracketTax)
      });

      previousMax = bracketMax;
    }

    // Handle amount above all brackets
    if (this.cumulative && amount > previousMax) {
      const lastRate = this.brackets[this.brackets.length - 1][1];
      const taxable = amount - previousMax;
      const extraTax = taxable * lastRate;
      tax += extraTax;
      breakdown.push({
        range: `${previousMax}+`,
        taxable,
        rate: `${(lastRate * 100).toFixed(1)}%`,
        tax: this.round(extraTax)
      });
    }

    return {
      originalAmount: amount,
      taxAmount: this.round(tax),
      netAmount: this.round(Math.max(0, amount - tax)),
      rateApplied: amount > 0 ? tax / amount : 0,
      strategyName: this.name,
      description: `Progressive tax: ${breakdown.length} brackets applied`,
      timestamp: new Date(),
      metadata: { breakdown, cumulative: this.cumulative }
    };
  }

  round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  getDescription() {
    return `Progressive tax with ${this.brackets.length} brackets`;
  }
}

module.exports = { ProgressiveTax };
