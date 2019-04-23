// -- Moonlander's --
// Martingale + - v1


const BASE_CONFIG = {
	// This is the setting for engaging betting (as opposed to just simulating)
	BETTING: false,

	// The base amount you are betting.  This is where bets start at
	BASE_BET: 1,

	// This is the amount of profit you want to get.  If you bet 1, you want to get paid 1 + perc when successful.
	BASE_CASHOUT: 5,

	// When we lose a round, what should our new profit percentage be.
	CASHOUT_DECREMENT: 1,

	// This is the least amount we will ever cashout at
	MIN_CASHOUT: 2.30,

	// This is the maximum bet you are willing to tolerate
	// 1, 2, 4, 8, 16, 32, 64, 128, 256, 512
	MAX_BET: 64
};

// -- don't change me
const ctx = {
	started: false,
	logging: false,
	log: (msg) => { console.log(msg) },
	total: 0,
	cost: 0,
	bet: BASE_CONFIG.BASE_BET,
	cashOut: BASE_CONFIG.BASE_CASHOUT,
	streak: 0
}
// -- don't change me

if (typeof engine !== "undefined") {
	// this means we're running in the browser
	ctx.logging = true;
	engine.onUpdate = function(prevState) {
		if (engine.gameState !== prevState.gameState) {
			switch (engine.gameState) {
				case 'STARTING':
					onStarting({
						c: ctx,
						e: engine,
						config: BASE_CONFIG
					});
					break;
				case 'ENDED':
					onEnded({
						c: ctx,
						e: engine,
						config: BASE_CONFIG
					});
					break;
			}
		}
	};
}

const onStarting = (data) => {
	data.c.started = true;
	// start max checks
	if (data.c.bet > data.config.MAX_BET) {
		if (data.c.logging === true) {
			data.c.log(`!!! Bet: ${data.c.bet.toFixed(0)} is greater than max bet: ${data.config.MAX_BET}.  Resetting to base...`);
		}
		data.c.cost = 0;
		data.c.bet = data.config.BASE_BET;
		data.c.cashOut = data.config.BASE_CASHOUT;
	}
	// start betting
	data.c.cost += data.c.bet;
	if (data.c.logging === true) {
		data.c.log(`\n\n${data.config.BETTING === true ? "+" : "?"} Placed bet: ${data.c.bet.toFixed(0)} @ ${data.c.cashOut.toFixed(2)} for ${(data.c.bet * data.c.cashOut).toFixed(2)} return [cost: ${data.c.cost.toFixed(2)}]`);
	}
	if (data.e.balance >= data.c.bet) {
		// place bet
		if (data.config.BETTING === true) {
			data.e.placeBet(data.c.bet, data.c.cashOut).catch(data.c.log);
		}
	}
	data.c.total -= data.c.bet;
	if (data.c.logging === true) {
		data.c.log(`--- No More Bets ---\n[total: ${data.c.total.toFixed(2)}]`);
	}
	return data.c;
}

// Do some analyse from results and adjust your next strategy
const onEnded = (data) => {
	if (data.c.started !== true) { return; }
	data.c.started = false;

	if (data.config.BETTING === true) {
		if (data.e.play) {
			if (data.e.play.stoppedAt) {
				onWin(data);
			} else {
				onLose(data);
			}
		}
	} else {
		if (data.c.cashOut < data.e.multiplier) {
			onWin(data);
		} else {
			onLose(data);
		}
	}
}

const onWin = (data) => {
	data.c.streak = 0;
	// reset the bet, but increase the profit target
	if (data.c.logging === true) {
		data.c.log(`${data.config.BETTING === true ? "+" : "?"} You survived!\nBailed @ ${data.c.cashOut.toFixed(2)} / Crashed @ ${data.e.multiplier} - Got ${(data.c.bet * data.c.cashOut).toFixed(2)} (+${((data.c.bet * data.c.cashOut) - data.c.bet).toFixed(2)}) [cost: ${data.c.cost.toFixed(2)}]`);
	}
	data.c.total += (data.c.bet * data.c.cashOut);
	data.c.cost = 0;
	data.c.bet = data.config.BASE_BET;
	data.c.cashOut = data.config.BASE_CASHOUT;

	return data.c;
}

const onLose = (data) => {
	data.c.streak++;
	if (data.c.logging === true) {
		data.c.log(`${data.config.BETTING === true ? "+" : "?"} You lost!\nCrashed @ ${data.e.multiplier} - Lost ${data.c.bet.toFixed(0)} [cost: ${data.c.cost.toFixed(2)}]`);
	}
	// tick down cashout to reduce losses
	if ((data.c.cashOut - data.config.CASHOUT_DECREMENT) > data.config.MIN_CASHOUT) {
		data.c.cashOut -= data.config.CASHOUT_DECREMENT;
	} else {
		data.c.cashOut = data.config.MIN_CASHOUT;
	}
	// double out bet on a loss
	data.c.bet *= 2;

	return data.c;
}

// for simulating

if (typeof module !== "undefined") {
	module.exports = {
		config: BASE_CONFIG,
		ctx: ctx,
		win: onWin,
		lose: onLose,
		starting: onStarting
	};
}
