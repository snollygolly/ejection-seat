const CryptoJS = require("crypto-js");
const fs = require("fs");

const HOUR = 175
const DAY = HOUR * 24;

//const hash = "b25e2319022a7184397feb4621a47bf52f5b0ce98e5782addaef96520c4bc260";
const hash = "6791a52b80700c1ae9409f5fcff13a84b3de6c6a075dfcfc53cff1aa0cbd5ce4";
const dump = require(`./dumps/dump_1000000-${hash}`);
const strategy = require("../strategies/martingale_plus");
const starting = 5000;

const LOGGING = false;

const CYCLE_DURATION = DAY * 1 / 24;
const CYCLE_OFFSET = DAY / 24;

const cycles = [];
const cyclesToSim = 96;
let i = 0;
let wins = 0;
let losses = 0;
let bestWin = -9999999;
let worstLoss = starting;
let avgWallet = 0;
let avgLowest = 0;
while (i < cyclesToSim) {
	const results = simulateStrategy(CYCLE_DURATION, (CYCLE_OFFSET * i));
	cycles.push({
		week: i,
		starting: starting,
		wallet: (results.wallet).toFixed(2),
		profit: (results.wallet - starting).toFixed(2),
		highest: (results.highest).toFixed(2),
		lowest: (results.lowest).toFixed(2),
		longest: results.longest
	});
	if (results.wallet > starting && results.lowest > 0) {
		wins++;
	} else {
		losses++;
	}
	if (results.wallet - starting > bestWin) {
		bestWin = results.wallet - starting;
	}
	if (results.wallet - starting < worstLoss) {
		worstLoss = results.wallet - starting;
	}
	avgWallet += results.wallet;
	avgLowest += results.lowest;
	i++;
}
avgWallet = (avgWallet / i);
avgLowest = (avgLowest / i);
const summary = `
simulating for ${cyclesToSim} x ${(CYCLE_DURATION / DAY).toFixed(2)} days
wins: ${wins} / losses: ${losses} [${((wins/cyclesToSim) * 100).toFixed(2)}%]
average wallet after: ${avgWallet.toFixed(2)} (${(avgWallet - starting).toFixed(2)}) / average lowest after: ${avgLowest.toFixed(2)} (${(avgLowest - starting).toFixed(2)})
best win: ${bestWin.toFixed(2)} (${((bestWin / starting) * 100).toFixed(2)}%) / worst loss: ${worstLoss.toFixed(2)} (${((worstLoss / starting) * 100).toFixed(2)}%)`;
// write the summary to disk always
fs.writeFileSync(`${__dirname}/output/final_${cyclesToSim}_${(CYCLE_DURATION / DAY).toFixed(2)}days_${hash.substring(0,3)}-${hash.substring(61, 64)}`, JSON.stringify({
	summary,
	cycles
}, null, 2));
console.log(summary);


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
	ctx.logging = LOGGING;
	ctx.logStash = [];
	ctx.log = (message) => { ctx.logStash.push(message); };
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
	// check to see if we should write this
	if (LOGGING === true) {
		fs.writeFileSync(`${__dirname}/output/sim_${i+1}of${cyclesToSim}_${(CYCLE_DURATION / DAY).toFixed(2)}days_${hash.substring(0,3)}-${hash.substring(61, 64)}`, ctx.logStash.join("\n"));
	}
	return stats;
}
