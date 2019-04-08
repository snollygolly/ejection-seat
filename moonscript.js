/*
engine object definition
{
   gameState: 'STARTING' | 'IN_PROGRESS' | 'ENDED',
   play: playInfo | null, // info about your play state in this game
   // info about other players play state in this game
   players: playInfo[],
   elapsed: number, // time from game start in milliseconds
   multiplier: number, // e.g 100 = 100x
   balance: number // in mETH

   // amount and autoCashOut will be rounded
   placeBet(amount: number, autoCashOut: number);
   // cashout manually
   cashout();

   // assign your function to this property
   // will be called on each state update
   onUpdate: (prevState) => void
}

playInfo object definition
{
   username: string,
   bet: number | null,
   autoCashOut: number | null,
   stoppedAt: number | null,
   profit: number | null
}
*/

// Updates to engine state
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

let total = 100;
let cost = 0;

let baseBet = 1;
let bet = baseBet;

let baseProfitMargin = 3.5;
let profitMargin = baseProfitMargin;
let baseCashOut = 1 * (1 + profitMargin);
let maxCashOut = 20;
let cashOut = baseCashOut;

let minPlay = {
  total: 100,
  bet: 1,
  cashOut: 1.2
};


// You can bet here
function onStarting() {
    if (engine.balance >= bet) {
        // place bet
        engine.placeBet(bet, cashOut).catch(console.error);
        console.log(`Placed bet: ${bet} @ ${cashOut} for ${(profitMargin * 100).toFixed(2)}% return`);
        cost += bet;
        total -= bet;
    }

}

// Cashout when you want or wait for auto cashout
function onStarted() {
    console.log('Game started!');
}

// Do some analyse from results and adjust your next strategy
function onEnded() {
    console.log('Game crashed at ' + engine.multiplier);

    if (engine.play) {
        if (engine.play.stoppedAt) {
          total += (bet * cashOut);
          console.log(`You stopped at ${cashOut} and won ${(bet * cashOut)} (+${(bet * cashOut) - bet}) [total: ${total} / c: ${cost}]`);
          cost = 0;
          bet = baseBet;
          cashOut = baseCashOut;
          profitMargin = baseProfitMargin;
        } else {
          console.log(`You lost ${bet} [total: ${total} / c: ${cost}]`);
          if ((profitMargin - 0.2) > 1) {
            profitMargin -= 0.2;
            bet += baseBet;
          }
          const desiredProfit = cost * profitMargin;
          cashOut = desiredProfit / bet;
        }
    }
}
