const fs = require('fs/promises');
require('dotenv').config();
const question = require('./question');
const UserRepository = require('./user-repository');
const UserBot = require('./userbot');
const { getRandomInt, delay } = require('./utils');

const bot = new UserBot();
const userRepository = new UserRepository();

const main = async () => {
	const apiId = parseInt(process.env.TELEGRAM_API_ID);
	const apiHash = process.env.TELEGRAM_API_HASH;
	const chatId = process.env.TELEGRAM_TARGET_CHAT_ID;
	const delayMin = process.env.BOT_SEND_MESSAGE_DELAY_MIN ?? 2;
	const delayMax = process.env.BOT_SEND_MESSAGE_DELAY_MAX ?? 5;

	if (!apiId || !apiHash || !chatId) {
		throw new Error('Config error: Please provide a config in the .env file.');
	}

	await bot.start(apiId, apiHash, {
		phoneNumber: async () => await question.ask('Enter your phone number: '),
		password: async () => await question.ask('Enter your password: '),
		phoneCode: async () => await question.ask('Enter the code you received: '),
		onError: (err) => console.log(err),
	});

	console.log('BOT: Getting chat users list...');
	const participants = await bot.getParticipants(chatId);

	console.log('DB: Saving users to DB...');
	userRepository.saveMany(
		participants.map((participant) => ({
			id: participant.id.toJSNumber(),
			username: participant.username,
			sent: 0,
		})),
	);
	console.log('DB: Participants have been saved to the database.');

	let readyFlag;
	do {
		readyFlag = await question.ask('Are you really want to send the message to all participants of group? (yes/no) ');
	} while (readyFlag.toLowerCase() !== 'yes' && readyFlag.toLowerCase() !== 'no');

	if (readyFlag.toLowerCase() !== 'yes') {
		console.log('Exiting...');
		return;
	}

	const lines = await fs.readFile('message.txt', {
		encoding: 'utf-8',
		flag: 'a+',
	});

	const messages = lines.split('\n');

	const targetUsers = userRepository.getTargets();
	for (const targetUser of targetUsers) {
		try {
			const randomMessage = messages[getRandomInt(0, messages.length - 1)];
			await bot.sendMessage(targetUser.telegram_id, randomMessage);
			userRepository.updateStatus(targetUser.telegram_id);
			console.log(`Message has been sent to ${targetUser.username}. Status: ${targetUser.id}/${targetUsers.length}`);
			await delay(getRandomInt(delayMin, delayMax) * 1000);
		} catch (err) {
			console.error(
				`BOT: Error sending message to user. Username: ${targetUser.telegram_id}, ID: ${targetUser.username}.`,
				err,
			);
		}
	}

	console.log('Messages have been sent to all users.');
};

main()
	.catch(console.error)
	.finally(async () => {
		userRepository.close();
		question.close();
		await bot.disconnect();
	});
