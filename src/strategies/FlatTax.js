/**
 * FlatTax - Fixed fee per transaction
 * Example: Every transfer costs 5 coins no matter the amount
 */

class FlatTax {
  constructor(options = {}) {
    this.amount = options.amount ?? 0;
    this.allowExceed = options.allowExceed ?? false;
    this.name = 'FlatTax';

    if (typeof this.amount !== 'number' || this.amount < 0) {
      throw new Error('FlatTax: amount must be a positive number');
    }
  }

  calculate(amount, context = {}) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a positive number');
    }

    let tax = this.amount;

    if (!this.allowExceed && tax > amount) {
      tax = amount;
    }

    return {
      originalAmount: amount,
      taxAmount: tax,
      netAmount: Math.max(0, amount - tax),
      rateApplied: null,
      strategyName: this.name,
      description: `Flat fee of ${this.amount} coins`,
      timestamp: new Date(),
      metadata: {
        wasCapped: !this.allowExceed && this.amount > amount
      }
    };
  }

  getDescription() {
    return `Flat tax: ${this.amount} per transaction`;
  }
}

module.exports = { FlatTax };
