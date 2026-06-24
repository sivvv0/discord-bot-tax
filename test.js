const assert = require('assert');

const {
  TaxEngine,
  FlatTax,
  PercentageTax,
  ProgressiveTax,
  TieredTax,
  TaxEmbed,
  formatCurrency,
  taxSummary,
  validateAmount,
  isPremium,
  version
} = require('./src/index.js');

console.log('🧪 discord-bot-tax Test Suite');
console.log(`📦 Version: ${version}`);
console.log('');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${err.message}`);
    failed++;
  }
}

function throws(name, fn, expectedMessage) {
  try {
    fn();
    console.log(`  ❌ ${name} (expected to throw)`);
    failed++;
  } catch (err) {
    if (expectedMessage && !err.message.includes(expectedMessage)) {
      console.log(`  ❌ ${name} (wrong error: ${err.message})`);
      failed++;
    } else {
      console.log(`  ✅ ${name}`);
      passed++;
    }
  }
}

// ==================== FLAT TAX ====================

console.log('📋 FlatTax Strategy');

test('calculates correct flat tax', () => {
  const tax = new FlatTax({ amount: 5 });
  const result = tax.calculate(100);
  assert.strictEqual(result.taxAmount, 5);
  assert.strictEqual(result.netAmount, 95);
  assert.strictEqual(result.strategyName, 'FlatTax');
});

test('caps tax when exceeding amount', () => {
  const tax = new FlatTax({ amount: 50 });
  const result = tax.calculate(30);
  assert.strictEqual(result.taxAmount, 30);
  assert.strictEqual(result.netAmount, 0);
  assert.strictEqual(result.metadata.wasCapped, true);
});

test('allows tax to exceed with flag', () => {
  const tax = new FlatTax({ amount: 50, allowExceed: true });
  const result = tax.calculate(30);
  assert.strictEqual(result.taxAmount, 50);
  assert.strictEqual(result.netAmount, -20);
});

test('zero tax', () => {
  const tax = new FlatTax({ amount: 0 });
  const result = tax.calculate(100);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.netAmount, 100);
});

throws('rejects negative amount', () => {
  new FlatTax({ amount: -5 });
}, 'positive number');

throws('rejects negative transaction', () => {
  const tax = new FlatTax({ amount: 5 });
  tax.calculate(-10);
}, 'positive number');

// ==================== PERCENTAGE TAX ====================

console.log('');
console.log('📋 PercentageTax Strategy');

test('calculates 5% tax', () => {
  const tax = new PercentageTax({ rate: 0.05 });
  const result = tax.calculate(1000);
  assert.strictEqual(result.taxAmount, 50);
  assert.strictEqual(result.netAmount, 950);
  assert.strictEqual(result.rateApplied, 0.05);
});

test('applies minimum tax', () => {
  const tax = new PercentageTax({ rate: 0.01, minTax: 5 });
  const result = tax.calculate(100);
  assert.strictEqual(result.taxAmount, 5);
});

test('applies maximum tax', () => {
  const tax = new PercentageTax({ rate: 0.50, maxTax: 100 });
  const result = tax.calculate(1000);
  assert.strictEqual(result.taxAmount, 100);
});

test('zero percent tax', () => {
  const tax = new PercentageTax({ rate: 0 });
  const result = tax.calculate(9999);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.netAmount, 9999);
});

throws('rejects rate above 1', () => {
  new PercentageTax({ rate: 1.5 });
}, 'between 0 and 1');

throws('rejects negative rate', () => {
  new PercentageTax({ rate: -0.1 });
}, 'between 0 and 1');

// ==================== PROGRESSIVE TAX ====================

console.log('');
console.log('📋 ProgressiveTax Strategy');

test('calculates progressive brackets', () => {
  const tax = new ProgressiveTax({
    brackets: [
      [100, 0.00],
      [500, 0.05],
      [1000, 0.10]
    ],
    cumulative: false
  });
  
  const result = tax.calculate(600);
  assert.strictEqual(result.taxAmount, 30);
  assert.strictEqual(result.netAmount, 570);
});

test('cumulative mode for amounts above brackets', () => {
  const tax = new ProgressiveTax({
    brackets: [
      [100, 0.00],
      [500, 0.05]
    ],
    cumulative: true
  });
  
  const result = tax.calculate(1000);
  assert.strictEqual(result.taxAmount, 45);
});

test('small amount in first bracket', () => {
  const tax = new ProgressiveTax({
    brackets: [[100, 0.00], [500, 0.05]]
  });
  
  const result = tax.calculate(50);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.netAmount, 50);
});

throws('rejects unsorted brackets', () => {
  new ProgressiveTax({
    brackets: [[500, 0.05], [100, 0.00]]
  });
}, 'ascending order');

throws('rejects invalid bracket rate', () => {
  new ProgressiveTax({
    brackets: [[100, 1.5]]
  });
}, 'between 0 and 1');

// ==================== TIERED TAX ====================

console.log('');
console.log('📋 TieredTax Strategy');

test('matches correct tier', () => {
  const tax = new TieredTax({
    tiers: [
      { min: 0, max: 100, value: 2, type: 'flat' },
      { min: 100, max: 1000, value: 0.05, type: 'percentage' },
      { min: 1000, max: Infinity, value: 0.01, type: 'percentage' }
    ]
  });
  
  const small = tax.calculate(50);
  assert.strictEqual(small.taxAmount, 2);
  
  const medium = tax.calculate(500);
  assert.strictEqual(medium.taxAmount, 25);
  
  const large = tax.calculate(2000);
  assert.strictEqual(large.taxAmount, 20);
});

test('no matching tier', () => {
  const tax = new TieredTax({
    tiers: [
      { min: 100, max: 200, value: 5, type: 'flat' }
    ]
  });
  
  const result = tax.calculate(50);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.strategyName, 'TieredTax');
});

throws('rejects invalid tier type', () => {
  new TieredTax({
    tiers: [{ min: 0, max: 100, value: 5, type: 'invalid' }]
  });
}, 'flat" or "percentage');

throws('rejects percentage above 1', () => {
  new TieredTax({
    tiers: [{ min: 0, max: 100, value: 2, type: 'percentage' }]
  });
}, 'between 0 and 1');

// ==================== TAX ENGINE ====================

console.log('');
console.log('📋 TaxEngine');

test('uses default strategy', () => {
  const engine = new TaxEngine({
    defaultStrategy: new PercentageTax({ rate: 0.10 })
  });
  
  const result = engine.calculate(100);
  assert.strictEqual(result.taxAmount, 10);
});

test('matches rule by condition', () => {
  const engine = new TaxEngine({
    defaultStrategy: new PercentageTax({ rate: 0.10 }),
    rules: [
      {
        condition: (amount) => amount > 500,
        strategy: new FlatTax({ amount: 50 }),
        priority: 10
      }
    ]
  });
  
  const small = engine.calculate(100);
  assert.strictEqual(small.taxAmount, 10);
  
  const large = engine.calculate(1000);
  assert.strictEqual(large.taxAmount, 50);
});

test('priority ordering', () => {
  const engine = new TaxEngine({
    defaultStrategy: new FlatTax({ amount: 1 }),
    rules: [
      {
        condition: () => true,
        strategy: new FlatTax({ amount: 100 }),
        priority: 1
      },
      {
        condition: () => true,
        strategy: new FlatTax({ amount: 50 }),
        priority: 10
      }
    ]
  });
  
  const result = engine.calculate(1000);
  assert.strictEqual(result.taxAmount, 50);
});

test('no strategy = no tax', () => {
  const engine = new TaxEngine();
  const result = engine.calculate(100);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.netAmount, 100);
});

test('context passing', () => {
  const engine = new TaxEngine({
    rules: [
      {
        condition: (amount, ctx) => ctx?.isVip === true,
        strategy: new PercentageTax({ rate: 0 }),
        priority: 100
      }
    ],
    defaultStrategy: new PercentageTax({ rate: 0.10 })
  });
  
  const regular = engine.calculate(100, { isVip: false });
  assert.strictEqual(regular.taxAmount, 10);
  
  const vip = engine.calculate(100, { isVip: true });
  assert.strictEqual(vip.taxAmount, 0);
});

test('min/max validation', () => {
  const engine = new TaxEngine({
    defaultStrategy: new FlatTax({ amount: 5 }),
    minAmount: 10,
    maxAmount: 1000
  });
  
  throws('below minimum', () => {
    engine.calculate(5);
  }, 'at least');
  
  throws('above maximum', () => {
    engine.calculate(5000);
  }, 'cannot exceed');
});

test('negative amount rejection', () => {
  const engine = new TaxEngine({
    defaultStrategy: new FlatTax({ amount: 5 })
  });
  
  throws('negative amount', () => {
    engine.calculate(-10);
  }, 'cannot be negative');
});

test('allows negative with flag', () => {
  const engine = new TaxEngine({
    defaultStrategy: new FlatTax({ amount: 0 }),
    allowNegative: true
  });
  
  const result = engine.calculate(-50);
  assert.strictEqual(result.originalAmount, -50);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.netAmount, -50);
  assert.strictEqual(result.strategyName, 'None');
});

test('decimal rounding', () => {
  const engine = new TaxEngine({
    defaultStrategy: new PercentageTax({ rate: 0.0333 }),
    decimals: 2
  });
  
  const result = engine.calculate(100);
  assert.strictEqual(result.taxAmount, 3.33);
});

test('callback hook', () => {
  let captured = null;
  const engine = new TaxEngine({
    defaultStrategy: new FlatTax({ amount: 10 }),
    onCalculate: (result, ctx) => {
      captured = { result, ctx };
    }
  });
  
  engine.calculate(100, { userId: '123' });
  assert.strictEqual(captured.result.taxAmount, 10);
  assert.strictEqual(captured.ctx.userId, '123');
});

test('static quick calculate', () => {
  const result = TaxEngine.quick(500, new PercentageTax({ rate: 0.20 }));
  assert.strictEqual(result.taxAmount, 100);
  assert.strictEqual(result.netAmount, 400);
});

test('chain methods', () => {
  const engine = new TaxEngine({
    defaultStrategy: new FlatTax({ amount: 1 })
  });
  
  engine
    .setDefault(new FlatTax({ amount: 5 }))
    .addRule({
      condition: (amount) => amount > 100,
      strategy: new PercentageTax({ rate: 0.10 }),
      priority: 5
    })
    .clearRules();
  
  const result = engine.calculate(1000);
  assert.strictEqual(result.taxAmount, 5);
});

// ==================== UTILITIES ====================

console.log('');
console.log('📋 Utilities');

test('formatCurrency', () => {
  const formatted = formatCurrency(1234.5, '🪙');
  assert.ok(formatted.includes('1,234.50'));
  assert.ok(formatted.includes('🪙'));
});

test('formatCurrency with decimals', () => {
  const formatted = formatCurrency(100, '💰', 0);
  assert.ok(formatted.includes('100'));
});

test('taxSummary', () => {
  const result = {
    originalAmount: 100,
    taxAmount: 5,
    netAmount: 95,
    description: '5% tax'
  };
  const summary = taxSummary(result, '🪙');
  assert.ok(summary.includes('100'));
  assert.ok(summary.includes('5'));
  assert.ok(summary.includes('95'));
});

test('validateAmount valid', () => {
  assert.strictEqual(validateAmount(100), true);
  assert.strictEqual(validateAmount(50, { min: 10, max: 100 }), true);
});

throws('validateAmount negative', () => {
  validateAmount(-5);
}, 'cannot be negative');

throws('validateAmount below min', () => {
  validateAmount(5, { min: 10 });
}, 'at least');

throws('validateAmount above max', () => {
  validateAmount(500, { max: 100 });
}, 'cannot exceed');

test('isPremium', () => {
  const premiumUsers = new Set(['user1', 'user2']);
  assert.strictEqual(isPremium('user1', premiumUsers), true);
  assert.strictEqual(isPremium('user3', premiumUsers), false);
  assert.strictEqual(isPremium('user1'), false);
});

// ==================== DISCORD EMBEDS ====================

console.log('');
console.log('📋 TaxEmbed (Discord.js)');

test('creates receipt embed', () => {
  const result = {
    originalAmount: 1000,
    taxAmount: 50,
    netAmount: 950,
    rateApplied: 0.05,
    strategyName: 'PercentageTax',
    description: '5% tax',
    timestamp: new Date(),
    metadata: {}
  };
  
  const embed = new TaxEmbed({ symbol: '🪙' }).receipt(result);
  assert.ok(embed.data.title.includes('Receipt'));
  assert.strictEqual(embed.data.fields.length, 6);
});

test('creates tax-free embed', () => {
  const embed = new TaxEmbed().taxFree(100);
  assert.ok(embed.data.title.includes('No Tax'));
});

test('creates error embed', () => {
  const embed = new TaxEmbed().error('Something broke');
  assert.ok(embed.data.title.includes('Error'));
});

test('creates confirmation with buttons', () => {
  const result = {
    originalAmount: 100,
    taxAmount: 5,
    netAmount: 95,
    rateApplied: 0.05,
    strategyName: 'PercentageTax',
    description: '5%',
    timestamp: new Date(),
    metadata: {}
  };
  
  const { embeds, components } = new TaxEmbed().confirm(result);
  assert.strictEqual(embeds.length, 1);
  assert.strictEqual(components.length, 1);
  assert.strictEqual(components[0].components.length, 2);
});

test('breakdown embed with metadata', () => {
  const result = {
    originalAmount: 1000,
    taxAmount: 100,
    netAmount: 900,
    rateApplied: 0.10,
    strategyName: 'ProgressiveTax',
    description: 'Progressive',
    timestamp: new Date(),
    metadata: {
      breakdown: [
        { range: '0 - 500', rate: '5.0%', tax: 25 },
        { range: '500 - 1000', rate: '10.0%', tax: 75 }
      ]
    }
  };
  
  const embed = new TaxEmbed().breakdown(result);
  assert.ok(embed.data.fields.some(f => f.name.includes('Breakdown')));
});

// ==================== EDGE CASES ====================

console.log('');
console.log('📋 Edge Cases');

test('zero amount transaction', () => {
  const tax = new FlatTax({ amount: 5 });
  const result = tax.calculate(0);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.netAmount, 0);
});

test('very large numbers', () => {
  const tax = new PercentageTax({ rate: 0.10 });
  const result = tax.calculate(1000000000);
  assert.strictEqual(result.taxAmount, 100000000);
});

test('tiny decimal rate', () => {
  const tax = new PercentageTax({ rate: 0.001 });
  const result = tax.calculate(1000);
  assert.strictEqual(result.taxAmount, 1);
});

test('exact bracket boundary', () => {
  const tax = new ProgressiveTax({
    brackets: [[100, 0.00], [500, 0.05]]
  });
  
  const atBoundary = tax.calculate(100);
  assert.strictEqual(atBoundary.taxAmount, 0);
});

test('engine with no default and no matching rules', () => {
  const engine = new TaxEngine({
    rules: [
      {
        condition: () => false,
        strategy: new FlatTax({ amount: 10 })
      }
    ]
  });
  
  const result = engine.calculate(100);
  assert.strictEqual(result.taxAmount, 0);
  assert.strictEqual(result.strategyName, 'None');
});

// ==================== RESULTS ====================

console.log('');
console.log('═'.repeat(40));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(40));

if (failed > 0) {
  process.exit(1);
}
