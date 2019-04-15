// -- Moonlander's --
// Low and Slow - v1

// This is the setting for engaging betting (as opposed to just simulating)
const BETTING = false;
// The base amount you are betting.  This is where bets start at, and is how much we increment them
const BASE_BET = 1;
// This is the amount of profit you want to get.  If you bet 1, you want to get paid 1 + perc when successful.
const BASE_PROFIT_PERC = 3;
// When we lose a round, what should our new profit percentage be.
const LOSS_PROFIT_PERC = BASE_PROFIT_PERC / 6;
// When we win a round, what should our profit increase be? 1 = 100% increase
const WIN_PROFIT_INCREASE = 0.75;
// This is the least amount we will ever cashout at
const MIN_CASHOUT = 1.1;
// This is the maximum amount of cashout you are willing to tolerate.
const MAX_CASHOUT = 10;
// This is the maximum bet you are willing to tolerate
const MAX_BET = 30;
// This is the maximum amount of loss you are willing to accept in a losing streak (before reverting to minimum bets/cashouts again)
const MAX_COST = 300;

// -- don't change me
let inGame = false;
let total = 0;
let cost = 0;
let bet = BASE_BET;
let profitMargin = BASE_PROFIT_PERC;
let cashOut = 1 * (1 + profitMargin);
// a losing streak...
let streak = 0;
let history = [];
// -- don't change me


engine.onUpdate = function(prevState) {
		if (engine.gameState !== prevState.gameState) {
				switch (engine.gameState) {
						case 'STARTING':
								onStarting();
								break;
						case 'IN_PROGRESS':
								onStarted();
								break;
						case 'ENDED':
								onEnded();
								break;
				}
		}
};



// You can bet here
function onStarting() {
	inGame = true;
	cost += bet;
	console.log(`\n\n${BETTING === true ? "+" : "?"} Placed bet: ${bet.toFixed(0)} @ ${cashOut.toFixed(2)} for ${(bet * cashOut).toFixed(2)} return [cost: ${cost.toFixed(2)}]`);
	if (engine.balance >= bet) {
		// place bet
		if (BETTING === true) {
			engine.placeBet(bet, cashOut).catch(console.error);
		}
	}
	total -= bet;
}

// Cashout when you want or wait for auto cashout
function onStarted() {
	if (inGame !== true) { return; }
	console.log(`--- No More Bets ---\n[total: ${total.toFixed(2)}]`);
}

// Do some analyse from results and adjust your next strategy
function onEnded() {
	if (inGame !== true) { return; }
	inGame = false;
	history.push(engine.multiplier);

	if (BETTING === true) {
		if (engine.play) {
			if (engine.play.stoppedAt) {
				onWin();
			} else {
				onLose();
			}
		}
	} else {
		if (cashOut < engine.multiplier) {
			onWin();
		} else {
			onLose();
		}
	}

	if (cashOut > MAX_CASHOUT) {
		console.error(`!!! Cashout: ${cashOut.toFixed(0)} is greater than max cashout: ${MAX_CASHOUT}.  Increasing bet...`);
		while (cashOut > MAX_CASHOUT) {
			profitMargin = BASE_PROFIT_PERC;
			// increase bets every other round of losses
			bet += BASE_BET;
			const desiredProfit = (cost + bet) * (1 + profitMargin);
			cashOut = desiredProfit / bet >= MIN_CASHOUT ? desiredProfit / bet : MIN_CASHOUT;
		}
	}
	if (bet > MAX_BET) {
		console.error(`!!! Bet: ${bet.toFixed(0)} is greater than max bet: ${MAX_BET}.  Resetting to base...`);
		cost = 0;
		bet = BASE_BET;
		profitMargin = BASE_PROFIT_PERC;
		cashOut = 1 * (1 + profitMargin);
	}
	if (cost > MAX_COST) {
		console.error(`!!! Cost: ${cashOut.toFixed(0)} is greater than max cost: ${MAX_COST}.  Resetting to base...`);
		cost = 0;
		bet = BASE_BET;
		profitMargin = BASE_PROFIT_PERC;
		cashOut = 1 * (1 + profitMargin);
	}
}

function onWin() {
	streak = 0;
	// reset the bet, but increase the profit target
	console.log(`${BETTING === true ? "+" : "?"} You survived!\nBailed @ ${cashOut.toFixed(2)} / Crashed @ ${engine.multiplier} - Got ${(bet * cashOut).toFixed(2)} (+${((bet * cashOut) - bet).toFixed(2)}) [cost: ${cost.toFixed(2)}]`);
	total += (bet * cashOut);
	cost = 0;
	bet = BASE_BET;
	profitMargin = profitMargin + (profitMargin * WIN_PROFIT_INCREASE);
	cashOut = 1 * (1 + profitMargin);
}

function onLose() {
	streak++;
	console.log(`${BETTING === true ? "+" : "?"} You lost!\nCrashed @ ${engine.multiplier} - Lost ${bet.toFixed(0)} [cost: ${cost.toFixed(2)}]`);
	// reset the profit margin to base when we lose, recoup losses
	profitMargin = BASE_PROFIT_PERC;
	// increase bets every other round of losses
	bet += streak % 2 === 1 ? BASE_BET : 0;
	const desiredProfit = (cost + bet) * (1 + LOSS_PROFIT_PERC);
	cashOut = desiredProfit / bet >= MIN_CASHOUT ? desiredProfit / bet : MIN_CASHOUT;
}
