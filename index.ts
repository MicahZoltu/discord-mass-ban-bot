import * as Discord from 'discord.js'
const client = new Discord.Client()

const serverId = getRequiredEnvironmentVariable('DISCORD_SERVER_ID')
const joinLogChannelId = getRequiredEnvironmentVariable('DISCORD_JOIN_LOG_CHANNEL_ID')
const adminChannelId = getRequiredEnvironmentVariable('DISCORD_ADMIN_CHANNEL_ID')
const botAuthToken = getRequiredEnvironmentVariable('DISCORD_BOT_AUTH_TOKEN')

const startTime = new Date();
let lastJoinTime = startTime
let consecutiveJoins = 0

function RaidCheck(serverId: string) {
	const adminChannel = getChannel(serverId, adminChannelId)

	const currentTime = new Date();
	const elapsedTime = currentTime.getTime() - lastJoinTime.getTime()

	console.log(`cuurent time = ` + currentTime.getTime())

	const timeDiff = elapsedTime / 1000;

	// get seconds
	const seconds = Math.round(timeDiff);
	console.log(`elapsed time = ` + seconds + " seconds");

	if (seconds < 30) {
		consecutiveJoins++
		console.log(`I saw a consectutive join`)

		if (consecutiveJoins > 3) {
			console.log(`I saw more than 3 consecutive joins!!`)
			adminChannel.send(`RUN FOR COVER - A MASS DM SPAMBOT MIGHT BE JOINING OUR SERVER!`)
			adminChannel.send(`Can someone monitor the welcome channel and ban these accounts? format is: "ban [WelcomeMessageIDStart] [WelcomeMessageIDEnd]"`)
		}
	} else {
		console.log(`Re-setting join detector` + consecutiveJoins)
		consecutiveJoins = 0
	}

	lastJoinTime = currentTime

	return
}

client.on('ready', () => {
	// This event will run if the bot starts, and logs in, successfully.
	if (client.user === null) throw new Error(`Client doesn't have a user.`)
	console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} servers.`)
	client.user.setActivity(`watchdog`)
})

client.on('guildCreate', (guild) => {
	// This event triggers when the bot joins a server.
	console.log(`New server joined: ${guild.name} (id: ${guild.id}). This server has ${guild.memberCount} members!`)
})

client.on('guildMemberAdd', (member) => {
	console.log('Triggered member add')

	RaidCheck(member.guild.id)
})

client.on("message", async maybeCommand => {
	try {
		const commandServer = maybeCommand.guild
		if (commandServer === null) return
		if (commandServer.id !== serverId) return
		console.log(`Noticed message in server ${commandServer.id} channel ${maybeCommand.channel.id}: ${maybeCommand}`)
		if (maybeCommand.channel.id !== joinLogChannelId) return

		const regex = maybeCommand.content.match(/^ban (\d+?) (\d+?)$/i)
		if (regex === null) return

		try {
			const joinLogChannel = getChannel(commandServer.id, joinLogChannelId)
			const toBan: Discord.Message[] = []
			let currentMessageId = BigInt(regex[1]) > BigInt(regex[2]) ? BigInt(regex[1]) : BigInt(regex[2])
			const lastMessageId = BigInt(regex[1]) < BigInt(regex[2]) ? BigInt(regex[1]) : BigInt(regex[2])
			console.log(`Banning everyone from message ID ${lastMessageId} to ${currentMessageId}`)
			let doneCollecting = false;
			while (!doneCollecting) {
				const messages = await joinLogChannel.messages.fetch({ limit: 50, before: (currentMessageId + 1n).toString(10) })
				messages.forEach(message => {
					const messageId = BigInt(message.id)
					if (message.type !== 'GUILD_MEMBER_JOIN') return
					if (messageId < lastMessageId) return (doneCollecting = true)
					toBan.push(message)
					currentMessageId = BigInt(message.id)
				});
			}

			console.log('The people to ban...!')
			console.log(toBan.map(message => message.author.username));

			const firstBannedMessage = toBan[toBan.length - 1]
			const lastBannedMessage = toBan[0]
			const confirmationMessage = await maybeCommand.channel.send({ content: `Are you sure? You are going to ban ${toBan.length} users who joined from ${firstBannedMessage.author.username}#${firstBannedMessage.author.discriminator} (\`${firstBannedMessage.createdAt.toUTCString()}\`) ${lastBannedMessage.author.username}#${lastBannedMessage.author.discriminator} to (\`${lastBannedMessage.createdAt.toUTCString()}\`)` })
			const allReactions = await confirmationMessage.awaitReactions(reaction => ["👍"].includes(reaction.emoji.name), { max: 1, time: 60000, errors: ["time"] })
			const reaction = allReactions.first();
			console.log('reaction parsed')
			console.log(reaction)

			try {
				if (!reaction || reaction.emoji.name !== "👍") return
				for (const userMessage of toBan) {
					console.log(`Banning: ${userMessage.author.username}#${userMessage.author.discriminator} (${userMessage.author.id})`)
					await commandServer.members.ban(userMessage.author.id, { days: 7, reason: "Join raid." })
				}
			} finally {
				await confirmationMessage.delete()
			}
		} finally {
			await maybeCommand.delete()
		}
	} catch (error: unknown) {
		console.error(error)
	}
})

client.login(botAuthToken)

function getChannel(serverId: string, channelId: string) {
	const server = client.guilds.cache.get(serverId)
	if (server === undefined) throw new Error(`Bot not joined to server.`)
	const channel = server.channels.cache.find(channel => channel.id === channelId)
	if (!(channel instanceof Discord.TextChannel)) throw new Error(`Join log channel is not a text channel.`)
	return channel
}

function exit() {
	client.destroy()
	process.exit(0)
}

function getRequiredEnvironmentVariable(name: string) {
	const value = process.env[name]
	if (value === undefined) {
		console.error(`${name} environment variable is required.`)
		process.exit(1)
	}
	return value
}

process.on('SIGTERM', exit)
process.on('SIGINT', exit)
