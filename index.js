const fs = require('fs/promises');
require('dotenv').config();
const question = require('./question');
const UserRepository = require('./user-repository');
const UserBot = require('./userbot');

const bot = new UserBot();
const userRepository = new UserRepository();

const main = async () => {
	const apiId = parseInt(process.env.TELEGRAM_API_ID);
	const apiHash = process.env.TELEGRAM_API_HASH;
	const chatId = process.env.TELEGRAM_TARGET_CHAT_ID;

	if (!apiId || !apiHash || !chatId) {
		console.error('Please provide your API ID and API hash in the .env file.');
		return;
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

	const message = await fs.readFile('message.txt', {
		encoding: 'utf-8',
		flag: 'a+',
	});

	const targetUsers = userRepository.getTargets();
	for (const targetUser of targetUsers) {
		await bot.sendMessage(targetUser.telegram_id, message);
		userRepository.updateStatus(targetUser.telegram_id);
		console.log(`Message has been sent to ${targetUser.username}. Status: ${targetUser.id}/${targetUsers.length}`);
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
