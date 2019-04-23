const CryptoJS = require("crypto-js");
const fs = require("fs");

const DAY = 4250;

refreshJSON("b25e2319022a7184397feb4621a47bf52f5b0ce98e5782addaef96520c4bc260", 2125)

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
		if (parseFloat(gameCrash) < 2) {
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
	var hash = hmac(serverSeed, '894c3f8dde5f6bb75fa525111c493e6df552f5f410e42b86cc02309e5979728b');

	if (divisible(hash, 66))
		return (1).toFixed(2);

	var h = parseInt(hash.slice(0, 52 / 4), 16);
	var e = Math.pow(2, 52);

	return (Math.max(1, (Math.floor((100 * e - h) / (e - h)) - 1) / 100)).toFixed(2);
};
