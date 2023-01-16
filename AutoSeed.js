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
                const alreadyBet = []
                for (const bet of awayIds) {
                    if (bet.createdBy === id) {
                        alreadyBet.push(bet)
                    }
                }
                for (const yet of homeIds) {
                    if (yet.createdBy === id) {
                        alreadyBet.push(yet)
                    }
                }
                if (!alreadyBet.length) {
                    const awayOdds = (odds.data.games[0].awayMoneylines[0].odds)
                    const adjAway = bestBet(awayOdds)
                    const homeOdds = (odds.data.games[0].homeMoneylines[0].odds)
                    const adjHome = bestBet(homeOdds)
                    const type = odds.data.games[0].awayMoneylines[0].type
                    const homeSide = odds.data.games[0].homeMoneylines[0].participantID
                    const awaySide = odds.data.games[0].awayMoneylines[0].participantID
                    const betAmount = 200
                    console.log("ATP", awayOdds, homeOdds)
                    const initialOrders =  properOrders(
                        type,
                        null,
                        gt,
                        homeSide,
                        awaySide,
                        betAmount,
                        adjAway,
                        adjHome
                    
                    );
                    await placeOrders(gt, initialOrders, token, url)
                    console.log('Seeded', name, type, 'at', {adjAway, adjHome}, 'for', betAmount)
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
                const awayIds = (NFLodds.data.games[0].awayMoneylines)
                const homeIds = (NFLodds.data.games[0].homeMoneylines)
                const alreadyBet = []
                for (const bet of awayIds) {
                    if (bet.createdBy === id) {
                        alreadyBet.push(bet)
                    }
                }
                for (const yet of homeIds) {
                    if (yet.createdBy === id) {
                        alreadyBet.push(yet)
                    }
                }
                if (!alreadyBet.length) {
                    const awayOdds = (NFLodds.data.games[0].awayMoneylines[0].odds)
                    const adjAway = bestBet(awayOdds)
                    const homeOdds = (NFLodds.data.games[0].homeMoneylines[0].odds)
                    const adjHome = bestBet(homeOdds)
                    const type = odds.data.games[0].awayMoneylines[0].type
                    const homeSide = odds.data.games[0].homeMoneylines[0].participantID
                    const awaySide = odds.data.games[0].awayMoneylines[0].participantID
                    const betAmount = 200
                    console.log("NFL", awayOdds, homeOdds)
                    const initialOrders =  properOrders(
                        type,
                        null,
                        NFLid,
                        homeSide,
                        awaySide,
                        betAmount,
                        adjAway,
                        adjHome
                    
                    );
                    await placeOrders(NFLid, initialOrders, token, url)
                    console.log('Seeded', name, type, 'at', {adjAway, adjHome}, 'for', betAmount)
                } else {
                    console.log(name, 'Already Seeded')
                }
            }
        } else {
            console.log("No NFL games to Seed")
        }
    });

})
