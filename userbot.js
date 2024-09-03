const fs = require('fs/promises');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

class UserBot {
	/**
	 * The Telegram client.
	 * @type {TelegramClient}
	 */
	#client;

	constructor() {}

	/**
	 * Start the connection.
	 * @param {Number} apiId - The API ID.
	 * @param {String} apiHash - The API Hash
	 * @param {{
	 *  phoneNumber: String, password: String, phoneCode: String, onError: (err) => void,
	 * }} authParams - The authentication parameters.
	 */
	async start(apiId, apiHash, authParams) {
		const restoredSessionString = await fs.readFile('.tg-session', {
			encoding: 'utf-8',
			flag: 'a+',
		});

		const stringSession = new StringSession(restoredSessionString);
		this.#client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

		await this.#client.start(authParams);

		this.#log('Connected.');

		const restoredClientSession = this.#client.session.save();

		if (restoredSessionString !== restoredClientSession) {
			await fs.writeFile('.tg-session', restoredClientSession, {
				encoding: 'utf-8',
				flag: 'a+',
			});
			this.#log('Session string has been updated.');
		}
	}

	/**
	 * Get participants of the chat.
	 * @param {Number} chatId - The chat ID.
	 */
	async getParticipants(chatId) {
		return await this.#client.getParticipants(chatId);
	}

	/**
	 * Send a message to a chat.
	 * @param {Number} chatId - The chat ID.
	 * @param {String} message - The message to send.
	 */
	async sendMessage(chatId, message) {
		return await this.#client.sendMessage(chatId, { message });
	}

	/**
	 * Close the connection.
	 */
	async disconnect() {
		this.#client.disconnect();
	}

	#log(message) {
		console.log(`[UserBot] ${message}`);
	}
}

module.exports = UserBot;
