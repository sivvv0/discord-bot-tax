# 💸 discord-bot-tax

Flexible transaction tax & fee system for **discord.js** economy bots. Calculate taxes, fees, and deductions on user-to-user transfers, shop purchases, gambling, and any currency transaction.

---

## 📦 Installation

```bash
npm install discord-bot-tax
```
* Requires:
 • Node.js >= `16.9.0`
 • discord.js `^14.0.0` (peer dependency)

# Feature

| Feature | Description |
|---------|-------------|
| **4 Tax Strategies** | Flat, Percentage, Progressive (brackets), Tiered |
| **Conditional Rules** | Apply different taxes based on user roles, amount, or custom logic |
| **Discord-Native Embeds** | Pre-built `TaxEmbed` class with `EmbedBuilder`, buttons, and colors |
| **Zero Config** | Works out of the box with sensible defaults |
| **Customizable** | Swap strategies, add rules, or build your own |
| **Validation** | Built-in amount validation with min/max limits |
| **Event Hooks** | Callback on every tax calculation for logging/analytics |

# 🚀 Quick Start
```js
const { TaxEngine, PercentageTax, TaxEmbed } = require('discord-bot-tax');

// Create engine with 5% tax
const tax = new TaxEngine({
  defaultStrategy: new PercentageTax({ rate: 0.05 })
});

// Calculate tax on 1000 coins
const result = tax.calculate(1000);
// result.taxAmount = 50
// result.netAmount = 950

// Send Discord embed
const embed = new TaxEmbed({ symbol: '🪙' }).receipt(result, interaction.user);
await interaction.reply({ embeds: [embed] });
```
**📋 Tax Strategies**
1. FlatTax — Fixed fee per transaction
```js
const { FlatTax } = require('discord-bot-tax');

// Every transfer costs exactly 5 coins
const strategy = new FlatTax({ amount: 5 });

// Allow tax to exceed transaction amount (default: false)
const strategy = new FlatTax({ amount: 10, allowExceed: true });
```
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `amount` | `number` | `0` | Fixed fee amount |
| `allowExceed` | `boolean` | `false` | Allow tax > transaction amount |
2. PercentageTax — Percent of transaction
```js
const { PercentageTax } = require('discord-bot-tax');

// 5% tax, minimum 1 coin, maximum 500 coins
const strategy = new PercentageTax({
  rate: 0.05,      // 5%
  minTax: 1,       // At least 1 coin
  maxTax: 500      // At most 500 coins
});
```
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rate` | `number` | `0` | Tax rate (0 to 1) |
| `minTax` | `number` | `null` | Minimum tax amount |
| `maxTax` | `number` | `null` | Maximum tax amount |
3. ProgressiveTax — Tax brackets (like income tax)
```js
const { ProgressiveTax } = require('discord-bot-tax');

// Real-world style brackets
const strategy = new ProgressiveTax({
  brackets: [
    [100, 0.00],    // 0-100: 0% tax
    [500, 0.05],    // 100-500: 5% tax
    [1000, 0.10],   // 500-1000: 10% tax
  ],
  cumulative: true  // Amounts above 1000 use last bracket rate
});
```
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `brackets` | `Array<[number, number]>` | `[]` | `[maxAmount, rate]` pairs |
| `cumulative` | `boolean` | `false` | Apply last bracket to amounts above all brackets |
4. TieredTax — Different rules per amount range
```js
const { TieredTax } = require('discord-bot-tax');

const strategy = new TieredTax({
  tiers: [
    { min: 0, max: 100, value: 2, type: 'flat' },        // 0-100: flat 2 coins
    { min: 100, max: 1000, value: 0.03, type: 'percentage' }, // 100-1000: 3%
    { min: 1000, max: Infinity, value: 0.01, type: 'percentage' } // 1000+: 1%
  ]
});
```
| Option | Type | Description |
|--------|------|-------------|
| `tiers` | `Array` | Each tier needs `min`, `max`, `value`, `type` |
| `type` | `'flat' \| 'percentage'` | How `value` is applied |
# 🏛️ TaxEngine — The Brain
```js
const { TaxEngine, PercentageTax, FlatTax } = require('discord-bot-tax');

const engine = new TaxEngine({
  // Default when no rules match
  defaultStrategy: new PercentageTax({ rate: 0.03 }),

  // Conditional rules (evaluated in priority order)
  rules: [
    {
      condition: (amount, context) => context.isPremium,
      strategy: new PercentageTax({ rate: 0.01 }),
      priority: 100
    },
    {
      condition: (amount) => amount >= 10000,
      strategy: new FlatTax({ amount: 500 }),
      priority: 50
    }
  ],

  // Validation
  minAmount: 1,
  maxAmount: 1000000,
  allowNegative: false,
  decimals: 2,

  // Hook for logging
  onCalculate: (result, context) => {
    console.log(`[TAX] ${context.userId} paid ${result.taxAmount}`);
  }
});
```
* Engine Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **`defaultStrategy`** | `TaxStrategy` | `null` | Fallback strategy |
| **`rules`** | `Array<TaxRule>` | `[]` | Conditional tax rules |
| **`minAmount`** | `number` | `null` | Minimum transaction |
| **`maxAmount`** | `number` | `null` | Maximum transaction |
| **`allowNegative`** | `boolean` | `false` | Allow negative amounts |
| **`decimals`** | `number` | `2` | Decimal places for rounding |
| **`onCalculate`** | `function` | `null` | Callback after calculation |
* Engine Methods
```js
// Calculate tax
const result = engine.calculate(1000, {
  userId: '123456',
  guildId: '789012',
  isPremium: true,
  customData: { anything: 'here' }
});

// Add rule later
engine.addRule({
  condition: (amount, ctx) => ctx.userId === 'OWNER_ID',
  strategy: new FlatTax({ amount: 0 }),
  priority: 999
});

// Remove all rules
engine.clearRules();

// Change default
engine.setDefault(new FlatTax({ amount: 10 }));

// Static quick-calculate (no engine instance needed)
const { TaxEngine } = require('discord-bot-tax');
const result = TaxEngine.quick(1000, new PercentageTax({ rate: 0.05 }));
```
# 🎨 Discord Embeds
```js
const { TaxEmbed } = require('discord-bot-tax');

const taxEmbed = new TaxEmbed({
  symbol: '🪙',        // Currency emoji
  color: 0x00AA88,     // Embed color
  currencyName: 'coins'
});

// Standard receipt
const receipt = taxEmbed.receipt(result, interaction.user);

// With confirmation buttons
const { embeds, components } = taxEmbed.confirm(result, interaction.user);
await interaction.reply({ embeds, components });

// Detailed breakdown (for Progressive/Tiered)
const breakdown = taxEmbed.breakdown(result, interaction.user);

// Tax-free notification
const free = taxEmbed.taxFree(100);

// Error
const error = taxEmbed.error('Insufficient funds');
```
# 🔧 Custom Strategies
Build your own strategy by implementing this interface:
```js
class MyCustomTax {
  constructor(options) {
    this.name = 'MyCustomTax';
    // your config
  }

  calculate(amount, context) {
    // Your logic here
    const taxAmount = /* calculate */;

    return {
      originalAmount: amount,
      taxAmount: taxAmount,
      netAmount: amount - taxAmount,
      rateApplied: null, // or your rate
      strategyName: this.name,
      description: 'My custom tax applied',
      timestamp: new Date(),
      metadata: {} // any extra data
    };
  }

  getDescription() {
    return 'Description of my tax';
  }
}

// Use it
const engine = new TaxEngine({
  defaultStrategy: new MyCustomTax({ /* options */ })
});
```
