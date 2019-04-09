# ejection-seat
A tool to help you get out of the rocket while you still can.

## Scripts
`moonscript.js` is the older version of the script, it's not advised to use it.
`low_and_slow.js` is the newest version that should be used.

## Configuration
There are a number of configuration options available to you in `low_and_slow`:


`BETTING`
- If you want to bet, or just simulate betting

`BASE_BET`
- How much you want to start betting out, and when incrementing your bet, how much do you want to increment it

`BASE_PROFIT_PERC`
- How much profit you want to try and get.  0.25 = 25% profit

`WIN_PROFIT_INCREASE`
- When we win, how much should we increase our profit goal. 1 = 100% increase

`LOSS_PROFIT_INCREASE`
- Unused

`MIN_CASHOUT`
- The minimum cashout amount

`MAX_CASHOUT`
- The maximum cashout amount (cashouts more than this will have their bets scaled up)

`MAX_BET`
- If a single bet goes over this amount, reset the script

`MAX_COST`
- If a single streak's cost exceeds this amount, reset the script
