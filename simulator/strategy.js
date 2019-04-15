const CryptoJS = require("crypto-js");
const fs = require("fs");

const dump = require("./dumps/dump_1000000-921e7866f7febd629a162818ecd9b62cd63e913a0d9e4e5fb8193253decd1dd1");
const strategy = require("./strategies/low_and_slow");
const starting = 5000;

const DAY = 4250;

const weeks = [];
const weeksToSim = 1;
let i = 0;
let wins = 0;
let losses = 0;
while (i < weeksToSim) {
	const results = simulateStrategy((DAY * 7), 0);
	weeks.push({
		week: i,
		wallet: results.wallet,
		lowest: results.lowest,
		longest: results.longest
	});
	if (results.wallet > starting && results.lowest > 0) {
		wins++;
	} else {
		losses++;
	}
	i++;
}
console.log(weeks);
console.log(`wins: ${wins} / losses: ${losses} [${(wins/losses) * 100}]`);



function simulateStrategy(duration, offset) {
	// clone and trim dump if we are supplying an offset
	const trimmedDump = JSON.parse(JSON.stringify(dump));
	trimmedDump.splice(0, offset);
	if (duration > trimmedDump.length) {
		console.log("! Out of bounds trimming in simulateStrategy");
		duration = trimmedDump.length;
	}
	const wins = [];
	const stats = {
		wallet: starting,
		highest: starting,
		lowest: starting,
		last: 0,
		shortest: duration,
		longest: 0
	};

	let ctx = JSON.parse(JSON.stringify(strategy.ctx));
	for (const [index, item] of trimmedDump.entries()) {
		if (index > duration) {break;}
		const crash = parseFloat(item.crash);
		// start the bet
		ctx = strategy.starting({
			e: { balance: 0 },
			c: ctx,
			config: strategy.config
		})
		stats.wallet = starting + ctx.total;

		if (crash >= ctx.cashOut) {
			// we won
			ctx = strategy.win({
				e: { multiplier: crash},
				c: ctx,
				config: strategy.config
			});

			// collect stats
			if ((index - stats.last) < stats.shortest) {
				stats.shortest = (index - stats.last);
			}
			if ((index - stats.last) > stats.longest) {
				stats.longest = (index - stats.last);
			}
			wins.push((index - stats.last));
			stats.last = index;
		} else {
			// we lost
			ctx = strategy.lose({
				e: { multiplier: crash},
				c: ctx,
				config: strategy.config
			});
		}

		stats.wallet = starting + ctx.total;
		// run wallet stats
		if (stats.wallet < stats.lowest) {
			stats.lowest = stats.wallet;
		}
		if (stats.wallet > stats.highest) {
			stats.highest = stats.wallet;
		}
	}
	const delay = wins.reduce((acc, curr) => {
		return acc + curr;
	}, 0)
	stats.avg = ((delay / wins.length) / 4250).toFixed(2) + " days";
	stats.duration = (duration / 4250).toFixed(2) + " days";

	return stats;
}
