const CryptoJS = require("crypto-js");
const fs = require("fs");
const dump = require("./dump_1000000-2c19b84f6574cd7f5e69d676c6fda5a4b934e6492bdb762ecde07a2c861609b5.json");

simulateFlatSingle(3500);

function simulateFlatSingle(cashout) {
	const wins = [];
	const stats = {
		wallet: 5000,
		highest: 5000,
		lowest: 5000,
		last: 0
	};
	const duration = dump.length
	for (const [index, item] of dump.entries()) {
		if (index > duration) {break;}
		const crash = parseFloat(item.crash);
		stats.wallet -= 1;
		if (crash >= cashout) {
			// we won
			stats.wallet += 1 * cashout;
			console.log(`Won on ${index} [crashed @ ${crash}]!  Your last win was ${((index - stats.last) / 4250).toFixed(2)} days ago.`);
			if ((index - stats.last) < stats.shortest) {
				stats.shortest = (index - stats.last);
			}
			if ((index - stats.last) > stats.longest) {
				stats.longest = (index - stats.last);
			}
			wins.push((index - stats.last));
			stats.last = index;
			console.log(stats)
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
	})

	console.log(`Flat Single: ${cashout} / ${(duration / 4250).toFixed(2)} days (avg: ${delay / wins.length})`);
	console.log(stats);
}

function simulateDump() {
	const STARTING_CRASH = 1;
	const MAX_CRASH = 10000;
	const INTERVAL = 10;
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
	for (const index in stats) {
		if (stats[index] > 50000) {
			console.log(`Cashout @ ${parseFloat(index).toFixed(2)}: Net Profit: ${(stats[index]).toFixed(2)}`);
		}
	}
}

function scanDump() {
	const stats = {
		["1x"]: 0,
		// below
		["1.25x"]: 0,
		["1.50x"]: 0,
		["1.75x"]: 0,
		["2x"]: 0,
		// above
		["10x"]: 0,
		["100x"]: 0,
		["1000x"]: 0,
		["highest"]: 0
	}
	for (const item of dump) {
		const crash = parseFloat(item.crash);
		if (item.crash === "1.00") { stats["1x"]++; }
		if (crash < 1.25) { stats["1.25x"]++; }
		if (crash < 1.50) { stats["1.50x"]++; }
		if (crash < 1.75) { stats["1.75x"]++; }
		if (crash < 2) { stats["2x"]++; }
		if (crash >= 10) { stats["10x"]++; }
		if (crash >= 100) { stats["100x"]++; }
		if (crash >= 1000) { stats["1000x"]++; }
		if (crash >= stats.highest) { stats.highest = crash }
	}
	for (const index in stats) {
		console.log(`${index}: ${stats[index]} (${((stats[index] / dump.length) * 100).toFixed(2)}%)`);
	}
}

function refreshTable() {
	var hash = "f2a6edbf01e482c3ff7b4f5633261e3f39de756373e3069b2a51241bfc0f6333";
  var lastHash = "";
  var amount = 1000000;

	const output = [];
	let total = 0;
	let counts = {
		none: 0
	}

  for (var i = 0; i < amount; i++) {
    var gameHash = (lastHash != "" ? genGameHash(lastHash) : hash);
    var gameCrash = crashPointFromHash((lastHash != "" ? genGameHash(lastHash) : hash));
    output.push({
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
	fs.writeFileSync(`${__dirname}/dump_${amount}-${hash}.json`, JSON.stringify(output, null, 2));
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
