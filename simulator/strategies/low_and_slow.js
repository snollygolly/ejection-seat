// -- Moonlander's --
// Low and Slow - v2


const BASE_CONFIG = {
	// This is the setting for engaging betting (as opposed to just simulating)
	BETTING: false,

	// The base amount you are betting.  This is where bets start at, and is how much we increment them
	BASE_BET: 1,

	// This is the amount of profit you want to get.  If you bet 1, you want to get paid 1 + perc when successful.
	BASE_PROFIT_PERC: 3,

	// When we lose a round, what should our new profit percentage be.
	LOSS_PROFIT_PERC: 0.20,

	// When we win a round, what should our profit increase be? 1 = 100% increase
	WIN_PROFIT_INCREASE: 0.75,

	// This is the least amount we will ever cashout at
	MIN_CASHOUT: 1.1,

	// This is the maximum amount of cashout you are willing to tolerate.
	MAX_CASHOUT: 10,

	// This is the maximum bet you are willing to tolerate
	MAX_BET: 35,

	// This is the maximum amount of loss you are willing to accept in a losing streak (before reverting to minimum bets/cashouts again)
	MAX_COST: 350
};

// -- don't change me
const ctx = {
	started: false,
	logging: false,
	total: 0,
	cost: 0,
	bet: BASE_CONFIG.BASE_BET,
	profitMargin: BASE_CONFIG.BASE_PROFIT_PERC,
	cashOut: 1 * (1 + BASE_CONFIG.BASE_PROFIT_PERC),
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
	if (data.c.cashOut > data.config.MAX_CASHOUT && data.c.bet !== data.config.BASE_BET) {
		if (data.c.logging === true) {
			console.error(`!!! Cashout: ${data.c.cashOut.toFixed(0)} is greater than max cashout: ${data.config.MAX_CASHOUT}.  Increasing bet...`);
		}
		while (data.c.cashOut > data.config.MAX_CASHOUT) {
			data.c.profitMargin = data.config.LOSS_PROFIT_PERC;
			// increase bets every other round of losses
			data.c.bet += data.config.BASE_BET;
			const desiredProfit = (data.c.cost + data.c.bet) * (1 + data.c.profitMargin);
			data.c.cashOut = desiredProfit / data.c.bet >= data.config.MIN_CASHOUT ? desiredProfit / data.c.bet : data.config.MIN_CASHOUT;
		}
	}
	if (data.c.bet > data.config.MAX_BET) {
		if (data.c.logging === true) {
			console.error(`!!! Bet: ${data.c.bet.toFixed(0)} is greater than max bet: ${data.config.MAX_BET}.  Resetting to base...`);
		}
		data.c.cost = 0;
		data.c.bet = data.config.BASE_BET;
		data.c.profitMargin = data.config.BASE_PROFIT_PERC;
		data.c.cashOut = 1 * (1 + data.c.profitMargin);
	}
	if (data.c.cost > data.config.MAX_COST) {
		if (data.c.logging === true) {
			console.error(`!!! Cost: ${data.c.cashOut.toFixed(0)} is greater than max cost: ${data.config.MAX_COST}.  Resetting to base...`);
		}
		data.c.cost = 0;
		data.c.bet = data.config.BASE_BET;
		data.c.profitMargin = data.config.BASE_PROFIT_PERC;
		data.c.cashOut = 1 * (1 + data.c.profitMargin);
	}

	// start betting
	data.c.cost += data.c.bet;
	if (data.c.logging === true) {
		console.log(`\n\n${data.config.BETTING === true ? "+" : "?"} Placed bet: ${data.c.bet.toFixed(0)} @ ${data.c.cashOut.toFixed(2)} for ${(data.c.bet * data.c.cashOut).toFixed(2)} return [cost: ${data.c.cost.toFixed(2)}]`);
	}
	if (data.e.balance >= data.c.bet) {
		// place bet
		if (data.config.BETTING === true) {
			data.e.placeBet(data.c.bet, data.c.cashOut).catch(console.error);
		}
	}
	data.c.total -= data.c.bet;
	if (data.c.logging === true) {
		console.log(`--- No More Bets ---\n[total: ${data.c.total.toFixed(2)}]`);
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
		console.log(`${data.config.BETTING === true ? "+" : "?"} You survived!\nBailed @ ${data.c.cashOut.toFixed(2)} / Crashed @ ${data.e.multiplier} - Got ${(data.c.bet * data.c.cashOut).toFixed(2)} (+${((data.c.bet * data.c.cashOut) - data.c.bet).toFixed(2)}) [cost: ${data.c.cost.toFixed(2)}]`);
	}
	data.c.total += (data.c.bet * data.c.cashOut);
	data.c.cost = 0;
	data.c.bet = data.config.BASE_BET;
	data.c.profitMargin = data.c.profitMargin + (data.c.profitMargin * data.config.WIN_PROFIT_INCREASE);
	// check for minimums from a previous loss
	if (data.c.profitMargin < data.config.BASE_PROFIT_PERC) {
		data.c.profitMargin = data.config.BASE_PROFIT_PERC;
	}
	data.c.cashOut = 1 * (1 + data.c.profitMargin);

	return data.c;
}

const onLose = (data) => {
	data.c.streak++;
	if (data.c.logging === true) {
		console.log(`${data.config.BETTING === true ? "+" : "?"} You lost!\nCrashed @ ${data.e.multiplier} - Lost ${data.c.bet.toFixed(0)} [cost: ${data.c.cost.toFixed(2)}]`);
	}
	// reset the profit margin to base when we lose, recoup losses
	data.c.profitMargin = data.config.LOSS_PROFIT_PERC;
	// increase bets every other round of losses
	data.c.bet += data.c.streak % 2 === 1 ? data.config.BASE_BET : 0;
	const desiredProfit = (data.c.cost + data.c.bet) * (1 + data.c.profitMargin);
	data.c.cashOut = desiredProfit / data.c.bet >= data.config.MIN_CASHOUT ? desiredProfit / data.c.bet : data.config.MIN_CASHOUT;

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
