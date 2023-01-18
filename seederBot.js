require("./loadEnv");
const { Manager } = require("socket.io-client");

const {
  timeToSeed,
  bestBet,
  getMaxLiability,
  newSeeds,
  findOtherSide,
  properOrders,
  vigMap,
} = require("./seederUtils");

const { runIt } = require("./AutoSeed");

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

login(password, url, username)
  .then((response) => {
    const { user } = response.data;
    const username = user.username;
    const token = user.auth;
    const id = user.id;
    const runningUser = { username, id, token };
    console.log(runningUser);
    const manager = new Manager(wsUrl, {
      reconnectionDelayMax: 1000,
      query: { token },
    });
    const socket = manager.socket(`/v2/user/${username}`, {
      query: { token },
    });
    socket.on("connect", () => {
      setInterval(() => {runIt(token, id, url)}, 300000)
      console.log(`message: ${username} connected to userFeed`);
    });

    socket.on("positionUpdate", async (msg) => {
      const formattedMessage = JSON.parse(msg);
      console.log(formattedMessage)
      if (!formattedMessage.unmatched) {
        console.log(
          `${username} took offer on`,
          formattedMessage.eventName,
          "for",
          formattedMessage.matched.risk,
          "on",
          formattedMessage.matched.type,
          formattedMessage.matched.number,
          "at",
          formattedMessage.matched.odds
        );
      } else {
        const gameID = formattedMessage.gameID;
        const orderAmount = formattedMessage.unmatched.offered;
        const odds = formattedMessage.unmatched.odds;
        const number = formattedMessage.unmatched.number;
        const type = formattedMessage.unmatched.type;
        const event = formattedMessage.eventName;
        const fillAmount = formattedMessage.unmatched.filled;
        const fillThreshold = 0.8;
        if (formattedMessage.unmatched.filled === 0 && orderAmount > 0) {
          console.log(
            `${username} created offer on `,
            event,
            "on",
            type,
            "for",
            orderAmount,
            "at",
            odds
          );
        } else if (orderAmount === 0) {
          console.log(
            `${username} canceled offer on`,
            event,
            "on",
            type,
            "at",
            odds
          );
        } else {
          console.log(
            `${username} order on`,
            event,
            "matched for",
            fillAmount,
            "on",
            type,
            "at",
            odds
          );
          const gameLiability = await getGameLiability(url, token, gameID)
          const league = formattedMessage.league
          console.log(gameLiability.data.liability)
          const maxLiability = getMaxLiability(league)
          if (gameLiability.data.liability > maxLiability) {
            const orderBook = await getOrderbook(gameID, url, token);
            const startTime = (new Date(orderBook.data.games[0].start))
            const rightNow = new Date()
            const timeToStart = ((startTime - rightNow)/ 1000)
            const {seedAmount, desiredVig, equityToLockIn} = vigMap(league, timeToStart)
            console.log(seedAmount, desiredVig, equityToLockIn)
            if (!(((formattedMessage.unmatched.offered - formattedMessage.unmatched.remaining)/formattedMessage.unmatched.offered) < fillThreshold)){
              await cancelAllOrdersForGame(gameID, token, type, url);
              const side1 = formattedMessage.unmatched.side;
              const {newSeedA, secondNewA} = newSeeds(odds, desiredVig, equityToLockIn)
              console.log({newSeedA, secondNewA})
              const orderParticipants = orderBook.data.games[0].participants;
              const side2 = findOtherSide(orderParticipants, side1, type);
              const orders = properOrders(
                type,
                number,
                gameID,
                side1,
                side2,
                seedAmount,
                newSeedA,
                secondNewA
              );
              await placeOrders(gameID, orders, token, url);
            }}
          // const orderBook = await getOrderbook(gameID, url, token);
          // const startTime = (new Date(orderBook.data.games[0].start))
          // const rightNow = new Date()
          // const timeToStart = ((startTime - rightNow)/ 1000)
          // const league = formattedMessage.league
          // const {seedAmount, desiredVig, equityToLockIn} = vigMap(league, timeToStart)
          // console.log(seedAmount, desiredVig, equityToLockIn)
          // if (!(((formattedMessage.unmatched.offered - formattedMessage.unmatched.remaining)/formattedMessage.unmatched.offered) < fillThreshold)){
          //   await cancelAllOrdersForGame(gameID, token, type, url);
          //   const side1 = formattedMessage.unmatched.side;
          //   const {newSeedA, secondNewA} = newSeeds(odds, desiredVig, equityToLockIn)
          //   console.log({newSeedA, secondNewA})
          //   const orderParticipants = orderBook.data.games[0].participants;
          //   const side2 = findOtherSide(orderParticipants, side1, type);
          //   const orders = properOrders(
          //     type,
          //     number,
          //     gameID,
          //     side1,
          //     side2,
          //     seedAmount,
          //     newSeedA,
          //     secondNewA
          //   );
          //   await placeOrders(gameID, orders, token, url);
          // }
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });
