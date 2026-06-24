/**
 * PercentageTax - Percentage fee on transaction amount
 * Example: 5% of every transfer
 */

class PercentageTax {
  constructor(options = {}) {
    this.rate = options.rate ?? 0;
    this.minTax = options.minTax ?? null;
    this.maxTax = options.maxTax ?? null;
    this.name = 'PercentageTax';

    if (typeof this.rate !== 'number' || this.rate < 0 || this.rate > 1) {
      throw new Error('PercentageTax: rate must be between 0 and 1');
    }
  }

  calculate(amount, context = {}) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a positive number');
    }

    let tax = amount * this.rate;

    if (this.minTax !== null && tax < this.minTax) {
      tax = this.minTax;
    }
    if (this.maxTax !== null && tax > this.maxTax) {
      tax = this.maxTax;
    }

    return {
      originalAmount: amount,
      taxAmount: this.round(tax),
      netAmount: this.round(Math.max(0, amount - tax)),
      rateApplied: this.rate,
      strategyName: this.name,
      description: `${(this.rate * 100).toFixed(1)}% tax${this.minTax ? ` (min: ${this.minTax})` : ''}${this.maxTax ? ` (max: ${this.maxTax})` : ''}`,
      timestamp: new Date(),
      metadata: {
        effectiveRate: amount > 0 ? tax / amount : 0
      }
    };
  }

  round(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  getDescription() {
    let desc = `${(this.rate * 100).toFixed(1)}% tax`;
    if (this.minTax !== null) desc += `, min: ${this.minTax}`;
    if (this.maxTax !== null) desc += `, max: ${this.maxTax}`;
    return desc;
  }
}

module.exports = { PercentageTax };
