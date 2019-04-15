const CryptoJS = require("crypto-js");
const fs = require("fs");

const dump = require("./dumps/dump_1000000-921e7866f7febd629a162818ecd9b62cd63e913a0d9e4e5fb8193253decd1dd1");

const DAY = 4250;
const STARTING = 7500;

// refreshJSON("921e7866f7febd629a162818ecd9b62cd63e913a0d9e4e5fb8193253decd1dd1", 1000000)

const weeks = [];
const weeksToSim = 10;
let i = 0;
let wins = 0;
let losses = 0;
while (i < weeksToSim) {
	const results = simulateFlatSingle(2, (DAY * 7) * 2, (DAY * i));
	weeks.push({
		week: i,
		wallet: results.wallet,
		lowest: results.lowest,
		longest: results.longest
	});
	if (results.wallet > STARTING && results.lowest > 0) {
		wins++;
	} else {
		losses++;
	}
	i++;
}

console.log(weeks);
console.log(`wins: ${wins} / losses: ${losses} [${(wins/losses) * 100}]`);


// simulateDump()

function simulateFlatSingle(cashout, duration = dump.length, offset = 0) {
	const trimmedDump = JSON.parse(JSON.stringify(dump));
	trimmedDump.splice(0, offset);
	if (duration > trimmedDump.length) {
		duration = trimmedDump.length;
	}
	const wins = [];
	const stats = {
		cashout: cashout,
		wallet: STARTING,
		highest: STARTING,
		lowest: STARTING,
		last: 0,
		shortest: duration,
		longest: 0
	};
	for (const [index, item] of trimmedDump.entries()) {
		if (index > duration) {break;}
		const crash = parseFloat(item.crash);
		stats.wallet -= 1;
		if (crash >= cashout) {
			// we won
			stats.wallet += 1 * cashout;
			//console.log(`Won on ${index} [crashed @ ${crash}]!  Your last win was ${((index - stats.last) / 4250).toFixed(2)} days ago.`);
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
		}
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
	stats.score = (stats.longest * -1) + stats.lowest;
	stats.avg = ((delay / wins.length) / 4250).toFixed(2);
	stats.duration = (duration / 4250).toFixed(2);
	//console.log(`Flat Single: ${cashout} / ${(duration / 4250).toFixed(2)} days (avg: ${((delay / wins.length) / 4250).toFixed(2)} days)`);
	//console.log(stats);
	return stats;
}

function simulateDump() {
	const STARTING_CRASH = 0;
	const MAX_CRASH = 10000;
	const INTERVAL = 100;
	const stats = {};
	let i = STARTING_CRASH;
	while (i < MAX_CRASH) {
		stats[i] = 0;
		i += INTERVAL;
	}
	for (const item of dump) {
		const crash = parseFloat(item.crash);
		for (const strat in stats) {
			const cashout = parseFloat(strat);
			stats[strat] -= 1;
			if (crash >= cashout) {
				// we won
				stats[strat] += 1 * cashout;
			} else {
				// we lost
			}
		}
	}
	const sortable = [];
	for (const index in stats) {
		sortable.push({
			cashout: index,
			profit: stats[index]
		});
	}
	sortable.sort((a, b) => (a.profit < b.profit) ? 1 : -1);

	const results = [];
	for (const [index, item] of sortable.entries()) {
		//console.log(`Cashout @ ${parseFloat(item.cashout).toFixed(2)}: Net Profit: ${(item.profit).toFixed(2)}`);
		results.push(simulateFlatSingle(item.cashout));
		if (index > 25) {
			break;
		}
	}
	console.log(results);
}

function refreshJSON(hash, amount) {
	let lastHash = "";

	const output = [];
	let total = 0;
	let counts = {
		none: 0
	}

	for (var i = 0; i < amount; i++) {
		var gameHash = (lastHash != "" ? genGameHash(lastHash) : hash);
		var gameCrash = crashPointFromHash((lastHash != "" ? genGameHash(lastHash) : hash));
		output.unshift({
			hash,
			crash: gameCrash
		});
		total += parseFloat(gameCrash);
		if (gameCrash === "1.00") {
			counts.none++;
		}
		lastHash = gameHash;
		if (i % 10000 === 0) {
			console.log(`${i} (${(i / amount) * 100}%) done!`);
		}
	}
	fs.writeFileSync(`${__dirname}/dumps/dump_${amount}-${hash}.json`, JSON.stringify(output, null, 2));
	console.log(`Processed ${amount} crashes - Average: ${total / amount} 1x's: ${counts.none} (${(counts.none / amount) * 100}%)`);
}

function divisible(hash, mod) {
	var val = 0;

	var o = hash.length % 4;
	for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
		val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
	}

	return val === 0;
}

function genGameHash(serverSeed) {
	return CryptoJS.SHA256(serverSeed).toString()
};

function hmac(key, v) {
	var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
	return hmacHasher.finalize(v).toString();
}

function crashPointFromHash(serverSeed) {
	var hash = hmac(serverSeed, '30f05e6838d851bd137d082450296ba4d7f6e5a3119a61bebbc41798c05969b8');

	if (divisible(hash, 65))
		return (1).toFixed(2);

	var h = parseInt(hash.slice(0, 52 / 4), 16);
	var e = Math.pow(2, 52);

	return (Math.max(1, (Math.floor((100 * e - h) / (e - h)) - 2) / 100)).toFixed(2);
};
