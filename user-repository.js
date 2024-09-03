const db = require('better-sqlite3')('users.db');
db.pragma('journal_mode = WAL');

db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    sent BOOLEAN
)`);

class UserRepository {
	constructor() {}

	/**
	 * Get all users from the database.
	 * @returns {Array<{id: Number, telegram_id: Number, username: String, sent: Boolean}>} An array of user objects.
	 * @example
	 * const users = userRepository.getAll();
	 * console.log(users);
	 * // [
	 * // 	{ id: 1, telegram_id: 444555666, username: 'user1', sent: 0 },
	 * // 	{ id: 2, telegram_id: 444555667, username: 'user2', sent: 0 },
	 * // ]
	 *
	 */
	getTargets() {
		return db.prepare('SELECT * FROM users WHERE sent = 0').all();
	}

	/**
	 * Save many users to the database.
	 * @param {Array<{id: Number, username: String, sent: Boolean}>} users An array of user objects to be inserted into the database.
	 */
	saveMany(users) {
		const insertUsersStatement = db.prepare(
			'INSERT OR IGNORE INTO users (telegram_id, username, sent) VALUES (?, ?, ?)',
		);
		for (const user of users) {
			insertUsersStatement.run(user.id, user.username, user.sent);
		}
	}

	/**
	 * Update the sent status of a user.
	 * @param {Number} userId - The telegram user ID to update.
	 * @param {Number} status - The status to update to. Default is 1.
	 */
	updateStatus(userId, status = 1) {
		const updateStatusStatement = db.prepare('UPDATE users SET sent = ? WHERE telegram_id = ?');
		updateStatusStatement.run(status, userId);
	}

	close() {
		db.close();
	}
}

module.exports = UserRepository;
