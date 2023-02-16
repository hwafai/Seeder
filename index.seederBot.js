require("./src/libs/loadEnv");
const { Manager } = require("socket.io-client");

// import off the board listener
const OffTheBoardListener = require("./src/libs/OffTheBoardListener");
const offTheBoardListener = new OffTheBoardListener();

const {
  getTimeKey,
  getMaxLiability,
  concatOrders,
  homeAway,
  newSeeds,
  findOtherSide,
  properOrders,
  eligibleToReseed,
  constructReseedOrders,
  leagues,
} = require("./src/utils/seederUtils");

const { runIt } = require("./src/services/pinnyAutoSeed");

const { userVigMap } = require("./src/utils/vigUtils");

const {
  cancelAllOrdersForGame,
  getGameLiability,
  getSingleOrderbook,
  login,
  placeOrders,
} = require("./src/utils/apiUtils");

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

    let interval;
    socket.on("connect", () => {
      console.log(`message: ${username} connected to userFeed`);
      if (username !== "mongoose") {
        // interval = setInterval(() => {
        //   runIt(token, id, url, offTheBoardListener);
        // }, 300000);
        // console.log(`Setting timer for interval: ${interval}`);
        runIt(token, id, url, offTheBoardListener)
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `Disconnected from the socket, cleared timer interval: ${interval}`
      );
      clearInterval(interval);
    });

    socket.on("positionUpdate", async (msg) => {
      try {
        const formattedMessage = JSON.parse(msg);
        const time = new Date()
        if (!formattedMessage.unmatched) {
          console.log(
            time,
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
              time,
              `${username} created offer on `,
              event,
              "on",
              type,
              "at",
              number,
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
              time,
              `${username} order on`,
              event,
              "matched for",
              fillAmount,
              "on",
              type,
              "at",
              odds
            );
            const gameLiability = await getGameLiability(url, token, gameID);
            const league = formattedMessage.league;
            const maxLiability = getMaxLiability(league, username);
            if (gameLiability.data.liability > maxLiability) {
              const orderBook = await getSingleOrderbook(gameID, url, token);
              const startTime = new Date(orderBook.data.game.start);
              const rightNow = new Date();
              const participants = orderBook.data.game.participants;
              const timeToStart = (startTime - rightNow) / 1000;
              const timeKey = getTimeKey(timeToStart);
              const { seedAmount, desiredVig, equityToLockIn } =
                userVigMap[username][league][timeKey];
              console.log({ seedAmount, desiredVig, equityToLockIn });
              if (
                !(
                  (formattedMessage.unmatched.offered -
                    formattedMessage.unmatched.remaining) /
                    formattedMessage.unmatched.offered <
                  fillThreshold
                )
              ) {
                const side1 = formattedMessage.unmatched.side;
                const side2 = findOtherSide(participants, side1, type);
                const teamSide = homeAway(participants, side1, type);
                const toReseed = eligibleToReseed(
                  orderBook,
                  type,
                  id,
                  number,
                  teamSide
                );
                const ordersToReseed = constructReseedOrders(
                  toReseed,
                  desiredVig,
                  equityToLockIn,
                  type,
                  gameID,
                  side1,
                  side2,
                  seedAmount,
                  username
                );
                await cancelAllOrdersForGame(gameID, token, type, url);
                const { newSeedA, secondNewA } = newSeeds(
                  type,
                  odds,
                  desiredVig,
                  equityToLockIn
                );
                console.log({
                  odds,
                  newSeedA,
                  secondNewA,
                });
                const mainOrders = properOrders(
                  type,
                  number,
                  gameID,
                  side1,
                  side2,
                  seedAmount,
                  newSeedA,
                  secondNewA,
                  username
                );
                const orders = concatOrders(mainOrders, ordersToReseed);
                await placeOrders(gameID, orders, token, url);
              }
            } else {
              console.log("Max liability for event exceeded");
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    });

    // listen for the off the board message emitted by the OTB Listener
    offTheBoardListener.on("offTheBoardMessage", async (msg) => {
      // parse the message
      const parsedMessage = JSON.parse(msg);

      const { offTheBoard, league, fourcasterGameID } = parsedMessage;

      // this means that this league is covered by the seeder
      if (leagues.indexOf(league) > -1) {
        // if Off the Board is true, this game is off the board
        if (offTheBoard) {
          // first cancel all orders for the game
          console.log(`Game OTB, cancelling orders for ${fourcasterGameID}`);
          await cancelAllOrdersForGame(fourcasterGameID, token, null, url);
          // then register the game as off the board by the seeder
          await offTheBoardListener.setSeederOffTheBoardStatus(
            username,
            fourcasterGameID,
            offTheBoard
          );
        } else {
          console.log(
            `Game ${fourcasterGameID} is back on the board, will reseed shortly`
          );
          // this game was off the board but is now back on
          await offTheBoardListener.setSeederOffTheBoardStatus(
            username,
            fourcasterGameID,
            offTheBoard
          );
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });
