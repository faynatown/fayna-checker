const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const ask = (query) => {
	return new Promise((resolve) => rl.question(query, resolve));
};

const close = () => {
	rl.close();
};

module.exports = { ask, close, rl };
