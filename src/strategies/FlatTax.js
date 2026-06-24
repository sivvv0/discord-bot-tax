/**
 * FlatTax - Fixed fee per transaction
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

    // Only cap if allowExceed is NOT explicitly true AND tax would exceed amount
    if (this.allowExceed !== true && tax > amount) {
      tax = amount;
    }

    return {
      originalAmount: amount,
      taxAmount: tax,
      netAmount: amount - tax,
      rateApplied: null,
      strategyName: this.name,
      description: `Flat fee of ${this.amount} coins`,
      timestamp: new Date(),
      metadata: {
        wasCapped: this.allowExceed !== true && this.amount > amount
      }
    };
  }

  getDescription() {
    return `Flat tax: ${this.amount} per transaction`;
  }
}

module.exports = { FlatTax };
