const { validateAmount } = require('./utils/validators');

/**
 * TaxEngine - Main engine for calculating transaction taxes
 */
class TaxEngine {
  constructor(options = {}) {
    this.defaultStrategy = options.defaultStrategy ?? null;
    this.rules = options.rules ?? [];
    this.allowNegative = options.allowNegative ?? false;
    this.minAmount = options.minAmount ?? null;
    this.maxAmount = options.maxAmount ?? null;
    this.decimals = options.decimals ?? 2;
    this.onCalculate = options.onCalculate ?? null;
  }

  calculate(amount, context = {}) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }

    if (!this.allowNegative && amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (this.minAmount !== null && amount < this.minAmount) {
      throw new Error(`Amount must be at least ${this.minAmount}`);
    }

    if (this.maxAmount !== null && amount > this.maxAmount) {
      throw new Error(`Amount cannot exceed ${this.maxAmount}`);
    }

    // Negative amounts: skip tax calculation entirely
    if (amount < 0) {
      return {
        originalAmount: amount,
        taxAmount: 0,
        netAmount: this.round(amount),
        rateApplied: null,
        strategyName: 'None',
        description: 'Negative amount - no tax applied',
        timestamp: new Date(),
        metadata: { negative: true }
      };
    }

    let strategy = null;
    const sortedRules = [...this.rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const rule of sortedRules) {
      if (rule.condition(amount, context)) {
        strategy = rule.strategy;
        break;
      }
    }

    if (!strategy) {
      if (!this.defaultStrategy) {
        return {
          originalAmount: amount,
          taxAmount: 0,
          netAmount: this.round(amount),
          rateApplied: null,
          strategyName: 'None',
          description: 'No tax applied',
          timestamp: new Date(),
          metadata: {}
        };
      }
      strategy = this.defaultStrategy;
    }

    const result = strategy.calculate(amount, context);
    result.taxAmount = this.round(result.taxAmount);
    result.netAmount = this.round(result.netAmount);

    if (result.netAmount < 0) {
      result.netAmount = 0;
      result.taxAmount = result.originalAmount;
    }

    if (this.onCalculate) {
      this.onCalculate(result, context);
    }

    return result;
  }

  addRule(rule) {
    this.rules.push(rule);
    return this;
  }

  clearRules() {
    this.rules = [];
    return this;
  }

  setDefault(strategy) {
    this.defaultStrategy = strategy;
    return this;
  }

  static quick(amount, strategy, context = {}) {
    const engine = new TaxEngine({ defaultStrategy: strategy });
    return engine.calculate(amount, context);
  }

  round(value) {
    return Math.round(value * Math.pow(10, this.decimals)) / Math.pow(10, this.decimals);
  }
}

module.exports = { TaxEngine };
