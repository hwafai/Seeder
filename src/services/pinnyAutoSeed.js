require("../libs/loadEnv");

const {
  fetchOdds,
  ifReseed,
  findEvent,
  triggerCancels,
  getTheGoods,
  gatherAltEdits,
  constructOrders,
} = require("../utils/pinnyAutoUtils");

const {
  timeToSeed,
  getMaxLiability,
  getInitialSeedAmount,
  leagues,
} = require("../utils/seederUtils");

const { FedExAutoSeed } = require("./FedExAutoSeed");

const {
  getGames,
  getSingleOrderbook,
  getOrderbook,
  getGameLiability,
  getPs3838AlternateLines,
  cancelAllOrdersForGame,
  editOrder,
  placeOrders,
} = require("../utils/apiUtils");

const username = process.env.FOURCASTER_USERNAME;
const BACKGROUND_JOBS_URI = process.env.BACKGROUND_JOBS_URI;

async function runIt(token, id, url, offTheBoardListener) {
  console.log(`message: ${username} connected to userFeed`);
  for (const league of leagues) {
    try {
      if (
        league !== "FED-EX-500" &&
        league !== "ATP" &&
        league !== "WTA" &&
        league !== "CHAMPIONS-LEAGUE"
      ) {
        const altLines = await getPs3838AlternateLines(
          league,
          BACKGROUND_JOBS_URI
        );
        const events = altLines.data.games;
        if (events && events.length) {
          const games = await getGames(league, token, url);
          const actuals = games.data.games;
          // console.log({actuals})
          const ready = timeToSeed(actuals, league);
          console.log({ready})
          if (ready.length) {
            for (const loadedGame of ready) {
              console.log({loadedGame})
              const gameID = loadedGame.gameID
              const otbStatus =
                await offTheBoardListener.checkSeederOffTheBoardStatus(
                  username,
                  gameID
                );
              if (!otbStatus) {
                const gameLiability = await getGameLiability(
                  url,
                  token,
                  gameID
                );
                const maxLiability = getMaxLiability(league, username);
                if (gameLiability.data.liability > maxLiability) {
                  const odds = await getSingleOrderbook(gameID, url, token);
                  const game = odds.data.game;
                  const eventOdds = findEvent(game, events);
                  if (eventOdds) {
                    const {
                      homeTeam,
                      awayTeam,
                      MLsAlreadyBet,
                      SpreadsAlreadyBet,
                      TotalsAlreadyBet,
                    } = ifReseed(game, league, id, eventOdds, loadedGame);
                    const betAmount = getInitialSeedAmount(league);
                    const {
                      ML,
                      mainSpread,
                      altSpread1,
                      altSpread2,
                      mainTotal,
                      altTotal1,
                      altTotal2,
                    } = fetchOdds(league, eventOdds);
                    const {orders, editedOrders} = await constructOrders(
                      league,
                      username,
                      loadedGame,
                      MLsAlreadyBet,
                      SpreadsAlreadyBet,
                      TotalsAlreadyBet,
                      ML,
                      mainSpread,
                      altSpread1,
                      altSpread2,
                      mainTotal,
                      altTotal1,
                      altTotal2,
                      gameID,
                      homeTeam,
                      awayTeam,
                      betAmount,
                      username
                    );
                    // console.log({orders})
                    if (orders && orders.length) {
                      const gameOB = await getOrderbook(gameID, url, token);
                      const orderBook = gameOB.data.games;
                      const { cancelSpread, cancelTotal } = triggerCancels(
                        SpreadsAlreadyBet,
                        mainSpread,
                        TotalsAlreadyBet,
                        mainTotal,
                        orderBook,
                        id
                      );
                      if (cancelSpread) {
                        await cancelAllOrdersForGame(
                          gameID,
                          token,
                          "spread",
                          url
                        );
                      }
                      if (cancelTotal) {
                        await cancelAllOrdersForGame(
                          gameID,
                          token,
                          "total",
                          url
                        );
                      }
                      await placeOrders(gameID, orders, token, url);
                    }
                    if (editedOrders && editedOrders.length) {
                      const seedAmount = editedOrders[0].seedAmount
                      const odds = await getOrderbook(gameID, url, token)
                      const games = odds.data.games
                      const Alts = gatherAltEdits(games, id, seedAmount)
                      const ordersToEdit = getTheGoods(Alts, editedOrders)
                      console.log({ordersToEdit})
                      for (const order of ordersToEdit) {
                        await editOrder(url, order.sessionID, order.seedAmount, token)
                      }
                    }
                  } else {
                    // console.log("no event from pinnacle", league, eventName);
                  }
                } else {
                  // console.log("Max Liability Exceeded");
                }
              } else {
                // log that game is off the board
                // console.log(`Game ${gameID} is Off The Board`);
              }
            }
          } else {
            // console.log("No", league, "games to Seed");
          }
        } else {
          // console.log("No Pinnacle Events", league);
        }
      } else if (
        league === "FED-EX-500" ||
        league === "ATP" ||
        league === "WTA" ||
        league === "CHAMPIONS-LEAGUE"
      ) {
        await FedExAutoSeed(url, token, id, league, username);
      }
    } catch (error) {
      console.log(error);
    }
    // bring altLines to list of games
  }
}

module.exports = {
  runIt,
};
