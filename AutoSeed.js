require("./loadEnv");
const { Manager } = require("socket.io-client");

const {
  timeToSeed,
  bestBet,
  newSeeds,
  findOtherSide,
  properOrders,
  vigMap,
} = require("./seederUtils");

const {
  cancelAllOrdersForGame,
  getGameLiability,
  getGames,
  getOrderbook,
  login,
  placeOrders,
} = require("./apiUtils");
const { type } = require("os");

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
        const ATPgames = await getGames ("ATP", token, url);
        const actuals = ATPgames.data.games
        const ready = timeToSeed(actuals)
        if (ready.length) {
            for (const gt of ready) {
                const odds = await getOrderbook(gt, url, token);
                const name = odds.data.games[0].eventName
                const awayIds = (odds.data.games[0].awayMoneylines)
                const homeIds = (odds.data.games[0].homeMoneylines)
                const ATPalreadyBet = []
                for (const bet of awayIds) {
                    if (bet.createdBy === id) {
                        ATPalreadyBet.push(bet)
                    }
                }
                for (const yet of homeIds) {
                    if (yet.createdBy === id) {
                        ATPalreadyBet.push(yet)
                    }
                }
                if (!ATPalreadyBet.length) {
                    const awayOdds = (odds.data.games[0].awayMoneylines[0].odds)
                    const homeOdds = (odds.data.games[0].homeMoneylines[0].odds)
                    const adjOdds = bestBet(awayOdds, homeOdds)
                    console.log(adjOdds)
                    const type = odds.data.games[0].awayMoneylines[0].type
                    const homeSide = odds.data.games[0].homeMoneylines[0].participantID
                    const awaySide = odds.data.games[0].awayMoneylines[0].participantID
                    const betAmount = 200
                    console.log("ATP", adjOdds)
                    const ATPinitialOrders =  properOrders(
                        type,
                        null,
                        gt,
                        homeSide,
                        awaySide,
                        betAmount,
                        adjOdds.newOdds1,
                        adjOdds.newOdds2 
                    );
                    await placeOrders(gt, ATPinitialOrders, token, url)
                    console.log('Seeded', name, type, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, 'Already Seeded')
                }
            }
        } else {
            console.log("No ATP games to Seed")
        }
        const NFLGames = await getGames ("NFL", token, url);
        const NFLactuals = NFLGames.data.games
        const NFLready = timeToSeed(NFLactuals)
        if (NFLready.length) {
            for (const NFLid of NFLready) {
                const NFLodds = await getOrderbook(NFLid, url, token);
                const name = NFLodds.data.games[0].eventName
                const NFLovers = NFLodds.data.games[0].over
                const NFLunders = NFLodds.data.games[0].under
                const homeSpreads = NFLodds.data.games[0].homeSpreads
                const awaySpreads = NFLodds.data.games[0].awaySpreads
                const awayIds = (NFLodds.data.games[0].awayMoneylines)
                const homeIds = (NFLodds.data.games[0].homeMoneylines)
                const NFLtotalsAlready = []
                const NFLspreadsAlready = []
                const NFLalreadyBet = []
                for (const bet of awayIds) {
                    if (bet.createdBy === id) {
                        NFLalreadyBet.push(bet)
                    }
                }
                for (const yet of homeIds) {
                    if (yet.createdBy === id) {
                        NFLalreadyBet.push(yet)
                    }
                }
                for (const homeSP of homeSpreads) {
                    if (homeSP.createdBy === id) {
                        NFLspreadsAlready.push(homeSP)
                    }
                }
                for (const awaySP of awaySpreads) {
                    if (awaySP.createdBy === id) {
                        NFLspreadsAlready.push(awaySP)
                    }
                }
                for (const over of NFLovers) {
                    if (over.createdBy === id) {
                        NFLtotalsAlready.push(over)
                    }
                }
                for (const under of NFLunders) {
                    if (under.createdBy === id) {
                        NFLtotalsAlready.push(under)
                    }
                }
                if (!NFLalreadyBet.length) {
                    const awayOdds = (NFLodds.data.games[0].awayMoneylines[0].odds)
                    const homeOdds = (NFLodds.data.games[0].homeMoneylines[0].odds)
                    const adjOdds = bestBet(awayOdds, homeOdds)
                    const type = NFLodds.data.games[0].awayMoneylines[0].type
                    const homeSide = NFLodds.data.games[0].homeMoneylines[0].participantID
                    const awaySide = NFLodds.data.games[0].awayMoneylines[0].participantID
                    const betAmount = 200
                    console.log("NFL ML", adjOdds)
                    const NFLinitialOrders =  properOrders(
                        type,
                        null,
                        NFLid,
                        homeSide,
                        awaySide,
                        betAmount,
                        adjOdds.newOdds1,
                        adjOdds.newOdds2
                    
                    );
                    await placeOrders(NFLid, NFLinitialOrders, token, url)
                    console.log('Seeded', name, type, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, 'Already Seeded ML')
                }
                if (!NFLspreadsAlready.length) {
                    const awaySpreadOdds = NFLodds.data.games[0].awaySpreads[0].odds
                    const homeSpreadOdds = NFLodds.data.games[0].homeSpreads[0].odds
                    const adjOdds = bestBet(awaySpreadOdds, homeSpreadOdds)
                    const number = NFLodds.data.games[0].homeSpreads[0].spread
                    const type = NFLodds.data.games[0].awaySpreads[0].type
                    const homeTeam = NFLodds.data.games[0].homeSpreads[0].participantID
                    const awayTeam = NFLodds.data.games[0].awaySpreads[0].participantID
                    const betAmount = 200
                    console.log("NFL Spread", adjOdds)
                    const NFLinitialSpreadOrders = properOrders(
                        type,
                        number,
                        NFLid,
                        homeTeam,
                        awayTeam,
                        betAmount,
                        adjOdds.newOdds1,
                        adjOdds.newOdds2
                    );
                    await placeOrders(NFLid, NFLinitialSpreadOrders, token, url)
                    console.log('Seeded', name, type, 'at', number, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, 'Already Seeded Spread')
                }
                if (!NFLtotalsAlready.length) {
                    const overOdds = NFLodds.data.games[0].over[0].odds
                    const underOdds = NFLodds.data.games[0].under[0].odds
                    const adjOdds = bestBet(overOdds, underOdds)
                    const type = NFLodds.data.games[0].over[0].type
                    const number = NFLodds.data.games[0].over[0].total
                    const overSide = "over"
                    const underSide = "under"
                    const betAmount = 200
                    console.log("NFL total", adjOdds)
                    const NFLinitialTotalOrders = properOrders(
                        type,
                        number,
                        NFLid,
                        overSide,
                        underSide,
                        betAmount,
                        adjOdds.newOdds2,
                        adjOdds.newOdds1
                    );
                    await placeOrders(NFLid, NFLinitialTotalOrders, token, url)
                    console.log('Seeded', name, type, 'at', number, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, "Already Seeded Totals")
                }
            }
        } else {
            console.log("No NFL games to Seed")
        }
        const NBAGames =  await getGames("NBA", token, url);
        const NBAactuals = NBAGames.data.games
        const NBAready = timeToSeed(NBAactuals)
        if (NBAready.length) {
            for (const NBAid of NBAready) {
                const NBAodds = await getOrderbook(NBAid, url, token)
                const name = NBAodds.data.games[0].eventName
                const NBAovers = NBAodds.data.games[0].over
                const NBAunders = NBAodds.data.games[0].under
                const homeSpreads = NBAodds.data.games[0].homeSpreads
                const awaySpreads = NBAodds.data.games[0].awaySpreads
                const awayIds = (NBAodds.data.games[0].awayMoneylines)
                const homeIds = (NBAodds.data.games[0].homeMoneylines)
                const NBAtotalsAlready = []
                const NBAspreadsAlready = []
                const NBAalreadyBet = []
                for (const bet of awayIds) {
                    if (bet.createdBy === id) {
                        NBAalreadyBet.push(bet)
                    }
                }
                for (const yet of homeIds) {
                    if (yet.createdBy === id) {
                        NBAalreadyBet.push(yet)
                    }
                }
                for (const over of NBAovers) {
                    if (over.createdBy === id) {
                        NBAtotalsAlready.push(over)
                    }
                }
                for (const under of NBAunders) {
                    if (under.createdBy === id) {
                        NBAtotalsAlready.push(under)
                    }
                }
                for (const homeSP of homeSpreads) {
                    if (homeSP.createdBy === id) {
                        NBAspreadsAlready.push(homeSP)
                    }
                }
                for (const awaySP of awaySpreads) {
                    if (awaySP.createdBy === id) {
                        NBAspreadsAlready.push(awaySP)
                    }
                }
                if (!NBAalreadyBet.length) {
                    const awayOdds = (NBAodds.data.games[0].awayMoneylines[0].odds)
                    const homeOdds = (NBAodds.data.games[0].homeMoneylines[0].odds)
                    const adjOdds = bestBet(awayOdds, homeOdds)
                    const type = NBAodds.data.games[0].awayMoneylines[0].type
                    const homeSide = NBAodds.data.games[0].homeMoneylines[0].participantID
                    const awaySide = NBAodds.data.games[0].awayMoneylines[0].participantID
                    const betAmount = 200
                    console.log("NBA", adjOdds)
                    const NBAinitialOrders = properOrders (
                        type,
                        null,
                        NBAid,
                        homeSide,
                        awaySide,
                        betAmount,
                        adjOdds.newOdds1,
                        adjOdds.newOdds2
                    );
                    await placeOrders(NBAid, NBAinitialOrders, token, url)
                    console.log('Seeded', name, type, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, 'Already Seeded ML')
                }
                if (!NBAspreadsAlready.length) {
                    const awaySpreadOdds = NBAodds.data.games[0].awaySpreads[0].odds
                    const homeSpreadOdds = NBAodds.data.games[0].homeSpreads[0].odds
                    const adjOdds = bestBet(awaySpreadOdds, homeSpreadOdds)
                    const number = NBAodds.data.games[0].homeSpreads[0].spread
                    const type = NBAodds.data.games[0].awaySpreads[0].type
                    const homeTeam = NBAodds.data.games[0].homeSpreads[0].participantID
                    const awayTeam = NBAodds.data.games[0].awaySpreads[0].participantID
                    const betAmount = 200
                    console.log("NBA Spread", adjOdds)
                    const NBAinitialSpreadOrders = properOrders(
                        type,
                        number,
                        NBAid,
                        homeTeam,
                        awayTeam,
                        betAmount,
                        adjOdds.newOdds1,
                        adjOdds.newOdds2
                    );
                    await placeOrders(NBAid, NBAinitialSpreadOrders, token, url)
                    console.log('Seeded', name, type, 'at', number, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, 'Already Seeded Spread')
                }
                if (!NBAtotalsAlready.length) {
                    const overOdds = NBAodds.data.games[0].over[0].odds
                    const underOdds = NBAodds.data.games[0].under[0].odds
                    const adjOdds = bestBet(overOdds, underOdds)
                    const type = NBAodds.data.games[0].over[0].type
                    const number = NBAodds.data.games[0].over[0].total
                    const overSide = "over"
                    const underSide = "under"
                    const betAmount = 200
                    console.log("NBA total", adjOdds)
                    const NBAinitialTotalOrders = properOrders(
                        type,
                        number,
                        NBAid,
                        overSide,
                        underSide,
                        betAmount,
                        adjOdds.newOdds2,
                        adjOdds.newOdds1
                    );
                    await placeOrders(NBAid, NBAinitialTotalOrders, token, url);
                    console.log('Seeded', name, type, 'at', number, 'at', adjOdds, 'for', betAmount)
                } else {
                    console.log(name, "Already Seeded Totals")
                }
            }
        } else {
            console.log('No NBA games to Seed')
        }
}

setInterval(() => {  }, 300)