const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = './xp.json';

if(!fs.existsSync(path)) fs.writeFileSync(path, '{}');

const db = () => JSON.parse(fs.readFileSync(path, 'utf8'));
const save = (d) => fs.writeFileSync(path, JSON.stringify(d, null, 2));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

function addXP(guildId, userId, amount=10){
  const data = db();
  if(!data[guildId]) data[guildId] = {};
  if(!data[guildId][userId]) data[guildId][userId] = { xp:0 };
  data[guildId][userId].xp += amount;
  save(data);
  return data[guildId][userId].xp;
}

function xpToLevel(xp){
  return Math.floor(0.1 * Math.sqrt(xp));
}

client.on('ready', () => {
  console.log('Bot ready as', client.user.tag);
});

client.on('messageCreate', async msg => {
  if(msg.author.bot || !msg.guild) return;
  if(msg.content.length < 3) return;

  const gained = Math.floor(Math.random() * 11) + 5;
  addXP(msg.guild.id, msg.author.id, gained);
});

client.on('messageCreate', async msg => {
  if(msg.author.bot || !msg.guild) return;
  if(!msg.content.startsWith('!')) return;

  const args = msg.content.slice(1).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  if(cmd === 'profile'){
    const data = db();
    const user = args[0] ? msg.mentions.users.first() || await client.users.fetch(args[0]).catch(()=>null) : msg.author;
    const record = data[msg.guild.id]?.[user.id] || { xp:0 };
    return msg.reply(`${user.username} — XP: ${record.xp}, Level: ${xpToLevel(record.xp)}`);
  }

  if(cmd === 'leaderboard' || cmd === 'lb'){
    const data = db()[msg.guild.id] || {};
    const arr = Object.entries(data).map(([uid, v]) => ({ id: uid, xp: v.xp || 0 }));
    arr.sort((a,b)=>b.xp - a.xp);
    const top = arr.slice(0,10);
    const text = await Promise.all(top.map(async (t, i) => {
      const u = await client.users.fetch(t.id).catch(()=>({ username: 'Unknown' }));
      return `#${i+1} ${u.username} — ${t.xp} XP (Lv ${xpToLevel(t.xp)})`;
    }));
    return msg.reply('Leaderboard:\n' + (text.join('\n') || 'No data yet'));
  }
});

client.login(TOKEN);
