const { EmbedBuilder } = require('discord.js');

/**
 * Format currency with emoji
 */
function formatCurrency(amount, symbol = '💰', decimals = 2) {
  const fixed = amount.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol} ${parts.join('.')}`;
}

/**
 * Create a Discord embed for tax receipt
 */
function createTaxEmbed(result, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color ?? 0x00AA88)
    .setTitle(options.title ?? '💸 Transaction Receipt')
    .setTimestamp()
    .addFields(
      { name: '💵 Original Amount', value: formatCurrency(result.originalAmount, options.symbol), inline: true },
      { name: '📉 Tax / Fee', value: formatCurrency(result.taxAmount, options.symbol), inline: true },
      { name: '💚 Net Amount', value: formatCurrency(result.netAmount, options.symbol), inline: true },
      { name: '📋 Tax Type', value: result.strategyName, inline: true }
    )
    .setFooter({ text: result.description });

  if (result.rateApplied !== null) {
    embed.addFields({
      name: '📊 Rate Applied',
      value: `${(result.rateApplied * 100).toFixed(2)}%`,
      inline: true
    });
  }

  return embed;
}

/**
 * Create a detailed breakdown embed (for progressive/tiered)
 */
function createBreakdownEmbed(result, options = {}) {
  const embed = createTaxEmbed(result, options);

  if (result.metadata?.breakdown) {
    const lines = result.metadata.breakdown.map(b => 
      `\`${b.range}\` → ${b.rate} = ${formatCurrency(b.tax, options.symbol)}`
    );
    embed.addFields({
      name: '📈 Tax Breakdown',
      value: lines.join('\n') || 'No breakdown available'
    });
  }

  return embed;
}

/**
 * Create a simple tax summary string
 */
function taxSummary(result, symbol = '💰') {
  return [
    `**Amount:** ${formatCurrency(result.originalAmount, symbol)}`,
    `**Tax:** ${formatCurrency(result.taxAmount, symbol)} (${((result.taxAmount / result.originalAmount) * 100).toFixed(1)}%)`,
    `**Net:** ${formatCurrency(result.netAmount, symbol)}`,
    `*${result.description}*`
  ].join('\n');
}

module.exports = {
  formatCurrency,
  createTaxEmbed,
  createBreakdownEmbed,
  taxSummary
};
