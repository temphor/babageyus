require('dotenv').config({ path: '../.env' });
const { Client, GatewayIntentBits, Events, EmbedBuilder, ActivityType } = require('discord.js');
const supabase = require('../src/lib/supabase');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Bot online as ${client.user.tag}`);
  client.user.setActivity('babageyus', { type: ActivityType.Watching });
  syncRoles();
});

async function syncRoles() {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const { data: users } = await supabase.from('users').select('discord_id');
    if (!users) return;
    for (const user of users) {
      try {
        const member = await guild.members.fetch(user.discord_id).catch(() => null);
        if (!member) continue;
        if (process.env.DISCORD_VERIFIED_ROLE_ID) {
          await member.roles.add(process.env.DISCORD_VERIFIED_ROLE_ID).catch(() => {});
        }
      } catch (_) {}
    }
    console.log(`Synced roles for ${users.length} users`);
  } catch (err) {
    console.error('Role sync error:', err.message);
  }
}

client.on(Events.GuildMemberAdd, async (member) => {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('discord_id', member.id)
    .single();

  if (user && process.env.DISCORD_VERIFIED_ROLE_ID) {
    await member.roles.add(process.env.DISCORD_VERIFIED_ROLE_ID).catch(() => {});
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'stats') {
    const { data } = await supabase.from('site_stats').select('total_hits, total_users').single();
    const embed = new EmbedBuilder()
      .setTitle('babageyus stats')
      .setColor(0xf97316)
      .addFields(
        { name: 'Total Hits', value: (data?.total_hits ?? 0).toLocaleString(), inline: true },
        { name: 'Total Users', value: (data?.total_users ?? 0).toLocaleString(), inline: true }
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === 'profile') {
    const target = message.mentions.users.first() || message.author;
    const { data: user } = await supabase
      .from('users')
      .select('username, roblox_username, created_at')
      .eq('discord_id', target.id)
      .single();

    if (!user) return message.reply('That user is not registered on babageyus.');

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s profile`)
      .setColor(0xf97316)
      .setThumbnail(target.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Discord', value: user.username, inline: true },
        { name: 'Roblox', value: user.roblox_username || 'Not set', inline: true },
        { name: 'Joined', value: new Date(user.created_at).toDateString(), inline: false }
      );
    return message.reply({ embeds: [embed] });
  }

  if (cmd === 'sync') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('No permission.');
    }
    await syncRoles();
    return message.reply('Roles synced.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
