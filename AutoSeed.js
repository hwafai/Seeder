require("./loadEnv");
const { Manager } = require("socket.io-client");

const {
  timeToSeed,
  bestBet,
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  properOrders,
} = require("./seederUtils");

const {
  getGames,
  getOrderbook,
  login,
  placeOrders,
} = require("./apiUtils");

const url = process.env.FOURCASTER_API_URI;
const wsUrl = process.env.FOURCASTER_WS_API_URI;
const username = process.env.FOURCASTER_USERNAME;
const password = process.env.FOURCASTER_PASSWORD;

login(password, url, username).then((response) => {
    const { user } = response.data;
    const username =  user.username;
    const token = user.auth;
    const id = user.id;
    const runningUser = { username, id, token}
    console.log(runningUser)
    const manager = new Manager(wsUrl, {
        reconnectionDelayMax: 1000,
        query: { token },
    });
    const socket = manager.socket(`/v2/user/${username}`, {
        query: { token },
    });
    socket.on("connect", async () => {
        setInterval(() => {runIt(token, id, url)}, 30000)
    });
})

async function runIt(token, id, url) {
    console.log(`message: ${username} connected to userFeed`);
    const leagues = ["ATP", "NFL", "NBA"]
    for (const league of leagues) {
        const games = await getGames(league, token, url)
        const actuals = games.data.games
        const ready = timeToSeed(actuals)
        if (ready.length) {
            for (const gameID of ready) {
                const odds = await getOrderbook(gameID, url, token)
                const eventName = odds.data.games[0].eventName
                const overs = odds.data.games[0].over
                const unders = odds.data.games[0].under
                const homeSpreads = odds.data.games[0].homeSpreads
                const awaySpreads = odds.data.games[0].awaySpreads
                const homeMLs = odds.data.games[0].homeMoneylines
                const awayMLs = odds.data.games[0].awayMoneylines
                const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id)
                const SpreadsAlreadyBet = noReseedSpreads(homeSpreads, awaySpreads, id)
                const TotalsAlreadyBet = noReseedTotals(overs, unders, id)
                if (!MLsAlreadyBet.length) {
                    const awayOdds = odds.data.games[0].awayMoneylines[0].odds
                    const homeOdds = odds.data.games[0].homeMoneylines[0].odds
                    const adjOdds = bestBet(awayOdds, homeOdds)
                    const type = odds.data.games[0].awayMoneylines[0].type
                    const homeSide = odds.data.games[0].homeMoneylines[0].participantID
                    const awaySide = odds.data.games[0].awayMoneylines[0].participantID
                    const betAmount = 200
                    console.log(eventName, type, adjOdds)
                    const MLorders = properOrders(
                        type,
                        null,
                        gameID,
                        homeSide,
                        awaySide,
                        betAmount,
                        adjOdds.newOdds1,
                        adjOdds.newOdds2
                    );
                    await placeOrders(gameID, MLorders, token, url)
                    console.log('Seeded', eventName, type, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(eventName, 'Already Seeded ML')
                }
                if (league !== "ATP") {
                    if (!SpreadsAlreadyBet.length) {
                        const awaySpreadOdds = odds.data.games[0].awaySpreads[0].odds
                        const homeSpreadOdds = odds.data.games[0].homeSpreads[0].odds
                        const adjOdds = bestBet(awaySpreadOdds, homeSpreadOdds)
                        const number = odds.data.games[0].homeSpreads[0].spread
                        const type = odds.data.games[0].awaySpreads[0].type
                        const homeTeam = odds.data.games[0].homeSpreads[0].participantID
                        const awayTeam = odds.data.games[0].awaySpreads[0].participantID
                        const betAmount = 200
                        console.log(eventName, type, adjOdds)
                        const spreadOrders = properOrders(
                            type,
                            number,
                            gameID,
                            homeTeam,
                            awayTeam,
                            betAmount,
                            adjOdds.newOdds1,
                            adjOdds.newOdds2
                        );
                        await placeOrders(gameID, spreadOrders, token, url)
                        console.log('Seeded', eventName, type, 'at', number, 'at', adjOdds, 'for', betAmount)
                    } else {
                        console.log(eventName, 'Already Seeded Spread')
                    }
                    if (!TotalsAlreadyBet.length) {
                        const overOdds = odds.data.games[0].over[0].odds
                        const underOdds = odds.data.games[0].under[0].odds
                        const adjOdds = bestBet(overOdds, underOdds)
                        const type = odds.data.games[0].over[0].type
                        const number = odds.data.games[0].over[0].total
                        const overSide = 'under'
                        const underSide =  'over'
                        const betAmount = 200
                        console.log(eventName, type, adjOdds)
                        const totalOrders = properOrders(
                            type,
                            number,
                            gameID,
                            overSide,
                            underSide,
                            betAmount,
                            adjOdds.newOdds1,
                            adjOdds.newOdds2
                        );
                        await placeOrders(gameID, totalOrders, token, url);
                        console.log('Seeded', eventName, type, 'at', number, 'at', adjOdds, 'for', betAmount)
                    } else {
                        console.log(eventName, 'Already Seeded Totals')
                    }
                }
            }
        } else {
            console.log("No", league, 'games to Seed')
        }
    }
}


