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

  /**
   * Calculate tax for an amount
   */
  calculate(amount, context = {}) {
    validateAmount(amount, {
      allowNegative: this.allowNegative,
      min: this.minAmount,
      max: this.maxAmount
    });

    // Find matching rule (sorted by priority)
    let strategy = null;
    const sortedRules = [...this.rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const rule of sortedRules) {
      if (rule.condition(amount, context)) {
        strategy = rule.strategy;
        break;
      }
    }

    // Use default if no rule matched
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

    // Calculate
    const result = strategy.calculate(amount, context);
    result.taxAmount = this.round(result.taxAmount);
    result.netAmount = this.round(result.netAmount);

    // Ensure net isn't negative
    if (result.netAmount < 0) {
      result.netAmount = 0;
      result.taxAmount = result.originalAmount;
    }

    // Callback
    if (this.onCalculate) {
      this.onCalculate(result, context);
    }

    return result;
  }

  /**
   * Add a rule
   */
  addRule(rule) {
    this.rules.push(rule);
    return this;
  }

  /**
   * Remove all rules
   */
  clearRules() {
    this.rules = [];
    return this;
  }

  /**
   * Set default strategy
   */
  setDefault(strategy) {
    this.defaultStrategy = strategy;
    return this;
  }

  /**
   * Quick static calculate
   */
  static quick(amount, strategy, context = {}) {
    const engine = new TaxEngine({ defaultStrategy: strategy });
    return engine.calculate(amount, context);
  }

  round(value) {
    return Math.round(value * Math.pow(10, this.decimals)) / Math.pow(10, this.decimals);
  }
}

module.exports = { TaxEngine };
