const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Configuration just for you
let prefix = "!";
const config = {
    logChannel: null,
    antiraid: false
};
function parseDuration(input) {
    if (input === "forever") return null;

    const match = input.match(/^(\d+)([mhd])$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === "m") return value * 60 * 1000;
    if (unit === "h") return value * 60 * 60 * 1000;
    if (unit === "d") return value * 24 * 60 * 60 * 1000;

    return null;
}
function createLogEmbed(user, action, reason) {
    return new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(`${user} has been ${action}.\nReason: ${reason}`)
        .setTimestamp();
}

// HELP
function sendHelp(message) {
    message.reply(`
**Kiritoaster Utility Commands**

${prefix}ban @user <time> <reason>
${prefix}timeout @user <time> <reason>

${prefix}setup antiraid
${prefix}setup moderation-logs #channel

Time formats:
1m, 5m, 10m, 30m, 1h, 2h, 1d–7d, forever
    `);
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(" ");

    if (message.content === `${prefix}help`) {
        return sendHelp(message);
    }

    if (message.content.startsWith(`${prefix}setprefix`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("You don't have permission.");

        const newPrefix = args[1];
        if (!newPrefix) return;

        prefix = newPrefix;
        return message.reply(`Prefix updated to ${prefix}`);
    }

    if (message.content.startsWith(`${prefix}ban`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply("You don't have permissions to do THIS mimi blud");

        const user = message.mentions.members.first();
        const timeArg = args[2];
        const reason = args.slice(3).join(" ") || "No reason provided";

        if (!user) return;

        try {
            await user.ban({ reason });

            message.reply(`${user.user.tag} has been banned.`);

            // LOG
            if (config.logChannel) {
                const channel = message.guild.channels.cache.get(config.logChannel);
                if (channel) {
                    channel.send({
                        embeds: [createLogEmbed(user.user, "banned", reason)]
                    });
                }
            }

            const duration = parseDuration(timeArg);
            if (duration) {
                setTimeout(() => {
                    message.guild.members.unban(user.id).catch(() => {});
                }, duration);
            }

        } catch {
            message.reply("You might've selected a person higher then the role that this bot is");
        }
    }

    if (message.content.startsWith(`${prefix}timeout`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("You don't have permissions to do THIS mimi blud");

        const user = message.mentions.members.first();
        const timeArg = args[2];
        const reason = args.slice(3).join(" ") || "No reason provided";

        if (!user) return;

        const duration = parseDuration(timeArg);
        if (!duration)
            return message.reply(`You put in the wrong time format, check ${prefix}help for more`);

        try {
            await user.timeout(duration, reason);

            message.reply("This mimi blud has been timeoutted");

            if (config.logChannel) {
                const channel = message.guild.channels.cache.get(config.logChannel);
                if (channel) {
                    channel.send({
                        embeds: [createLogEmbed(user.user, "timed out", reason)]
                    });
                }
            }

        } catch {
            message.reply("You might've selected a person higher then the role that this bot is or you put in the wrong time format");
        }
    }

    if (message.content.startsWith(`${prefix}setup`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply("You don't have permission.");

        if (args[1] === "antiraid") {
            config.antiraid = true;
            return message.reply("Antiraid set up");
        }

        if (args[1] === "moderation-logs") {
            const channel = message.mentions.channels.first();
            if (!channel)
                return message.reply("Wrong channel or format");

            config.logChannel = channel.id;
            return message.reply(`Moderation log set up in ${channel}`);
        }
    }
});

let joins = [];

client.on("guildMemberAdd", (member) => {
    if (!config.antiraid) return;

    const now = Date.now();
    joins.push(now);

    joins = joins.filter(t => now - t < 10000);

    if (joins.length >= 5) {
        member.ban({ reason: "Antiraid triggered" }).catch(() => {});
    }
});

client.login("Put in your bot token here mimi blud");
