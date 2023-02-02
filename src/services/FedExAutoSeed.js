const { getSingleOrderbook } = require("../utils/apiUtils");
const { noReseedMLs, bestBet, getInitialSeedAmount, properOrders } = require("../utils/seederUtils");



async function FedExAutoSeed(gameID, url, token, id, league, username) {
    const odds = await getSingleOrderbook(gameID, url, token);
    const game = odds.data.game
    const eventName = game.eventName
    const homeMLs = game.homeMoneylines;
    const awayMLs = game
    const MLsAlreadyBet = noReseedMLs(homeMLs, awayMLs, id)
    if (homeMLs.length && awayMLs.length && !MLsAlreadyBet.length) {
        const awayOdds = game.awayMoneylines[0].odds
        const homeOdds = game.homeMoneylines[0].odds
        const adjOdds = bestBet(awayOdds, homeOdds)
        const type = 'moneyline'
        const homeSide = game.homeMoneylines[0].participantID
        const awaySide = game.awayMoneylines[0].participantID
        const betAmount = getInitialSeedAmount(league)
        const orders = properOrders(
            type,
            null,
            gameID,
            homeSide,
            awaySide,
            betAmount,
            adjOdds.newOdds1,
            adjOdds.newOdds2,
            username,
        );
        return orders
    }
}

module.exports = {
    FedExAutoSeed,
};