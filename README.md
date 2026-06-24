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
