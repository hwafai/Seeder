require("../libs/loadEnv");

const {
  timeToSeed,
  bestBet,
  getInitialSeedAmount,
  getBestSpreadOdds,
  getBestTotalsOdds,
  adjustedSpreadOrders,
  adjustedTotalOrders,
  concatOrders,
  noReseedMLs,
  noReseedSpreads,
  noReseedTotals,
  properOrders,
} = require("../utils/seederUtils");

const {
  getGames,
  getSingleOrderbook,
  placeOrders,
} = require("../utils/apiUtils");

const { pinnyExample } = require("../../altExample");

const username = process.env.FOURCASTER_USERNAME;

async function runIt(token, id, url) {
  console.log(`message: ${username} connected to userFeed`);
  const leagues = ["FED-EX-500", "NCAAB", "NFL", "NBA", "ATP", "WTA", "NHL"];
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
        // await pinny game from gameID of timeToSeed
        console.log({ pinnyExample });
        const oversOrders = odds.data.game.over;
        const undersOrders = odds.data.game.under;
        const mainTotal = odds.data.game.mainTotal;
        const overs = oversOrders[mainTotal];
        const unders = undersOrders[mainTotal];
        const overKeys = Object.keys(oversOrders);
        const underKeys = Object.keys(undersOrders);
        const spreadHome = odds.data.game.homeSpreads;
        const spreadAway = odds.data.game.awaySpreads;
        const homeSpreadKeys = Object.keys(spreadHome);
        const awaySpreadKeys = Object.keys(spreadAway);
        const homeMainSp = odds.data.game.mainHomeSpread;
        const awayMainSp = odds.data.game.mainAwaySpread;
        const homeSpreads = spreadHome[homeMainSp];
        const awaySpreads = spreadAway[awayMainSp];
        const homeMLs = odds.data.game.homeMoneylines;
        const awayMLs = odds.data.game.awayMoneylines;
        const MLsAlreadyBet = await noReseedMLs(
          homeMLs,
          awayMLs,
          id,
          url,
          token,
          gameID
        );
        const SpreadsAlreadyBet = await noReseedSpreads(
          homeSpreads,
          awaySpreads,
          id,
          url,
          token,
          gameID
        );
        const TotalsAlreadyBet = await noReseedTotals(
          overs,
          unders,
          id,
          url,
          token,
          gameID
        );
        if (homeMLs.length && awayMLs.length && !MLsAlreadyBet.length) {
          const awayOdds = odds.data.game.awayMoneylines[0].odds;
          const homeOdds = odds.data.game.homeMoneylines[0].odds;
          const adjOdds = bestBet(awayOdds, homeOdds);
          const type = odds.data.game.homeMoneylines[0].type;
          const homeSide = odds.data.game.homeMoneylines[0].participantID;
          const awaySide = odds.data.game.awayMoneylines[0].participantID;
          const betAmount = getInitialSeedAmount(league);
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
          // await placeOrders(gameID, MLorders, token, url);
        } else {
          console.log(eventName, "Already Seeded ML or nothing to Seed");
        }
        if (
          league !== "ATP" &&
          league !== "FED-EX-500" &&
          league !== "WTA" &&
          league !== "NHL"
        ) {
          if (homeSpreads && awaySpreads && !SpreadsAlreadyBet.length) {
            const { homeSpreadOdds, awaySpreadOdds } = getBestSpreadOdds(
              homeSpreads,
              awaySpreads
            );
            const adjOdds = bestBet(awaySpreadOdds, homeSpreadOdds);
            const type = homeSpreads[0].type;
            const homeTeam = homeSpreads[0].participantID;
            const awayTeam = awaySpreads[0].participantID;
            const betAmount = getInitialSeedAmount(league);
            const adjOrders = adjustedSpreadOrders(
              type,
              homeSpreadKeys,
              awaySpreadKeys,
              spreadHome,
              spreadAway,
              homeMainSp,
              betAmount,
              homeTeam,
              awayTeam,
              gameID,
              username
            );
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
            const orders = concatOrders(spreadOrders, adjOrders);
            // await placeOrders(gameID, orders, token, url);
          } else {
            console.log(eventName, "Already Seeded Spread or nothing to Seed");
          }
          if (league !== "FED-EX-500") {
            if (overs && unders && !TotalsAlreadyBet.length) {
              const { overOdds, underOdds } = getBestTotalsOdds(overs, unders);
              const adjOdds = bestBet(overOdds, underOdds);
              const type = overs[0].type;
              const overSide = "under";
              const underSide = "over";
              const betAmount = getInitialSeedAmount(league);
              const adjOrders = adjustedTotalOrders(
                type,
                overKeys,
                underKeys,
                oversOrders,
                undersOrders,
                mainTotal,
                betAmount,
                overSide,
                underSide,
                gameID,
                username
              );
              const totalOrders = properOrders(
                type,
                mainTotal,
                gameID,
                overSide,
                underSide,
                betAmount,
                adjOdds.newOdds1,
                adjOdds.newOdds2,
                username
              );
              const orders = concatOrders(totalOrders, adjOrders);
              // await placeOrders(gameID, orders, token, url);
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
