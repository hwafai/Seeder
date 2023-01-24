require("./loadEnv");

const {
  timeToSeed,
  bestBet,
  getInitialSeedAmount,
  getBestSpreadOdds,
  getBestTotalsOdds,
  getSpreads,
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  properOrders,
} = require("./seederUtils");

const { getGames, getSingleOrderbook, placeOrders } = require("./apiUtils");

const username = process.env.FOURCASTER_USERNAME;

async function runIt(token, id, url) {
  console.log(`message: ${username} connected to userFeed`);
  const leagues = [ "FED-EX-500", "NCAAB", "NFL", "NBA"];
  for (const league of leagues) {
    const games = await getGames(league, token, url);
    const actuals = games.data.games;
    const ready = timeToSeed(actuals, league);
    if (ready.length) {
      for (const gameID of ready) {
        const odds = await getSingleOrderbook(gameID, url, token);
        const eventName = odds.data.game.eventName
          ? odds.data.game.eventName
          : odds.data.game.eventNameM;
        const oversOrders = odds.data.game.over;
        const undersOrders = odds.data.game.under;
        const mainTotal = odds.data.game.mainTotal
        const overs = oversOrders[mainTotal]
        const unders = undersOrders[mainTotal]
        // console.log(odds.data.games[0])
        const spreadHome = odds.data.game.homeSpreads;
        const spreadAway = odds.data.game.awaySpreads;
        const homeMainSp = odds.data.game.mainHomeSpread
        const awayMainSp = odds.data.game.mainAwaySpread
        const homeSpreads = spreadHome[homeMainSp]
        const awaySpreads = spreadAway[awayMainSp]
        const homeMLs = odds.data.game.homeMoneylines;
        const awayMLs = odds.data.game.awayMoneylines;
        const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id);
        const SpreadsAlreadyBet = noReseedSpreads(homeSpreads, awaySpreads, id);
        const TotalsAlreadyBet = noReseedTotals(overs, unders, id);
        if (homeMLs.length && awayMLs.length && !MLsAlreadyBet.length) {
          const awayOdds = odds.data.game.awayMoneylines[0].odds;
          const homeOdds = odds.data.game.homeMoneylines[0].odds;
          const adjOdds = bestBet(awayOdds, homeOdds);
          const type = odds.data.game.awayMoneylines[0].type;
          const homeSide = odds.data.game.homeMoneylines[0].participantID;
          const awaySide = odds.data.game.awayMoneylines[0].participantID;
          const betAmount = getInitialSeedAmount(league);
          console.log(eventName, type, adjOdds);
          const MLorders = properOrders(
            type,
            null,
            gameID,
            homeSide,
            awaySide,
            betAmount,
            adjOdds.newOdds1,
            adjOdds.newOdds2,
            username
          );
          await placeOrders(gameID, MLorders, token, url);
        } else {
          console.log(eventName, "Already Seeded ML or nothing to Seed");
        }
        if (
          league !== "ATP" &&
          league !== "FED-EX-500" &&
          league !== "WTA" &&
          league !== "NHL"
        ) {
          if (
            homeSpreads.length &&
            awaySpreads.length &&
            !SpreadsAlreadyBet.length
          ) {
            const {homeSpreadOdds, awaySpreadOdds} = getBestSpreadOdds(homeSpreads, awaySpreads)
            console.log({homeSpreadOdds, awaySpreadOdds})
            const adjOdds = bestBet(awaySpreadOdds, homeSpreadOdds);
            const type = awaySpreads[0].type;
            const homeTeam = homeSpreads[0].participantID;
            const awayTeam = awaySpreads[0].participantID;
            const betAmount = getInitialSeedAmount(league);
            console.log(eventName, type, adjOdds);
            const spreadOrders = properOrders(
              type,
              homeMainSp,
              gameID,
              homeTeam,
              awayTeam,
              betAmount,
              adjOdds.newOdds1,
              adjOdds.newOdds2,
              username
            );
            await placeOrders(gameID, spreadOrders, token, url);
          } else {
            console.log(eventName, "Already Seeded Spread or nothing to Seed");
          }
          if (league !== "FED-EX-500") {
            if (overs.length && unders.length && !TotalsAlreadyBet.length) {
              const {overOdds, underOdds} = getBestTotalsOdds(overs, unders)
              const adjOdds = bestBet(overOdds, underOdds);
              const type = overs[0].type;
              const overSide = "under";
              const underSide = "over";
              const betAmount = getInitialSeedAmount(league);
              console.log(eventName, type, adjOdds);
              const totalOrders = properOrders(
                type,
                mainTotal,
                gameID,
                overSide,
                underSide,
                betAmount,
                adjOdds.newOdds1,
                adjOdds.newOdds2,
                username,
              );
              await placeOrders(gameID, totalOrders, token, url);
            } else {
              console.log(
                eventName,
                "Already Seeded Totals or nothing to Seed"
              );
            }
          }
        }
      }
    } else {
      console.log("No", league, "games to Seed");
    }
  }
}

module.exports = {
  runIt,
};
