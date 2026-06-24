const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatCurrency } = require('../utils/formatters');

/**
 * Pre-built Discord embeds for tax displays
 */
class TaxEmbed {
  constructor(options = {}) {
    this.symbol = options.symbol ?? '💰';
    this.color = options.color ?? 0x00AA88;
    this.currencyName = options.currencyName ?? 'coins';
  }

  /**
   * Standard tax receipt embed
   */
  receipt(result, user = null) {
    const embed = new EmbedBuilder()
      .setColor(this.color)
      .setTitle('💸 Transaction Receipt')
      .setDescription(`Tax calculated for your transfer`)
      .addFields(
        { name: '💵 Amount', value: formatCurrency(result.originalAmount, this.symbol), inline: true },
        { name: '📉 Tax', value: formatCurrency(result.taxAmount, this.symbol), inline: true },
        { name: '💚 You Receive', value: formatCurrency(result.netAmount, this.symbol), inline: true }
      )
      .addFields(
        { name: '📋 Method', value: result.strategyName, inline: true },
        { name: '📝 Details', value: result.description, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Tax System v1.0' });

    if (user) {
      embed.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() });
    }

    if (result.rateApplied !== null) {
      embed.addFields({
        name: '📊 Effective Rate',
        value: `${(result.rateApplied * 100).toFixed(2)}%`,
        inline: true
      });
    }

    return embed;
  }

  /**
   * Confirmation embed with buttons
   */
  confirm(result, user = null) {
    const embed = this.receipt(result, user);
    embed.setTitle('⚠️ Confirm Transaction')
      .setDescription(`You will pay **${formatCurrency(result.taxAmount, this.symbol)}** in taxes. Proceed?`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tax_confirm')
        .setLabel('✅ Confirm')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('tax_cancel')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row] };
  }

  /**
   * Tax breakdown for complex strategies
   */
  breakdown(result, user = null) {
    const embed = this.receipt(result, user);
    embed.setTitle('📊 Detailed Tax Breakdown');

    if (result.metadata?.breakdown) {
      const lines = result.metadata.breakdown.map((b, i) => 
        `**${i + 1}.** \`${b.range}\` at ${b.rate} → ${formatCurrency(b.tax, this.symbol)}`
      );
      embed.addFields({
        name: 'Bracket Details',
        value: lines.join('\n') || 'No details'
      });
    }

    if (result.metadata?.matchedTier) {
      embed.addFields({
        name: 'Matched Tier',
        value: `Range: ${result.metadata.matchedTier.min} - ${result.metadata.matchedTier.max}\nType: ${result.metadata.matchedTier.type}\nValue: ${result.metadata.matchedTier.value}`
      });
    }

    return embed;
  }

  /**
   * Error embed
   */
  error(message) {
    return new EmbedBuilder()
      .setColor(0xFF4444)
      .setTitle('❌ Tax Error')
      .setDescription(message)
      .setTimestamp();
  }

  /**
   * Tax-free notification
   */
  taxFree(amount) {
    return new EmbedBuilder()
      .setColor(0x44FF44)
      .setTitle('🎉 No Tax!')
      .setDescription(`Your transaction of ${formatCurrency(amount, this.symbol)} is tax-free!`)
      .setTimestamp();
  }
}

module.exports = { TaxEmbed };
