/**
 * Delay
 * @param {Number} ms The time to delay in milliseconds.
 */
const delay = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Get a random integer between two numbers.
 * @param {Number} min The minimum number.
 * @param {Number} max The maximum number.
 */
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
	delay,
	getRandomInt,
};
