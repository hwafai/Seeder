require("./loadEnv");
const { Manager } = require("socket.io-client");

// import off the board listener
// const OffTheBoardListener = require("./src/libs/OffTheBoardListener");
// const offTheBoardListener = new OffTheBoardListener();

const {
  newSeeds,
  findOtherSide,
  properOrders,
  vigMap,
} = require("./seederUtils");

const {
  cancelAllOrdersForGame,
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
      transports: ["websocket"],
    });
    const socket = manager.socket(`/v2/user/${username}`, {
      query: { token },
    });
    socket.on("connect", () => {
      console.log(`message: ${username} connected to userFeed`);
    });

    socket.on("positionUpdate", async (msg) => {
      const formattedMessage = JSON.parse(msg);
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
          formattedMessage.matched.odds,
        );
        const gameID = formattedMessage.gameID;
        const odds = formattedMessage.matched.odds;
        const number = formattedMessage.matched.number;
        const type = formattedMessage.matched.type;
        const fillThreshold = 0.325;
        const orderBook = await getOrderbook(gameID, url, token);
        const { sport } = formattedMessage;
        const { seedAmount, desiredVig, equityToLockIn } = await vigMap();
        if (!(formattedMessage.matched.risk / 100 < fillThreshold)) {
          try {
            await cancelAllOrdersForGame(gameID, token, type, url);
          } catch (e) {
            if (e.response && e.response.data) {
              console.log(e.response.data);
            }
          }
          const side1 = formattedMessage.matched.side;
          const { newSeedA, secondNewA } = newSeeds(
            odds,
            desiredVig,
            equityToLockIn,
          );
          const orderParticipants = orderBook.data.game.participants;
          const side2 = findOtherSide(orderParticipants, side1, type);
          const orders = properOrders(
            type,
            number,
            gameID,
            side1,
            side2,
            seedAmount,
            newSeedA,
            secondNewA,
            odds,
            sport,
            "take",
            orderBook.data.game.mainTotal,
          );
          await placeOrders(gameID, orders, token, url);
        }
      } else {
        const gameID = formattedMessage.gameID;
        const orderAmount = formattedMessage.unmatched.offered;
        const odds = formattedMessage.unmatched.odds;
        const number = formattedMessage.unmatched.number;
        const type = formattedMessage.unmatched.type;
        const event = formattedMessage.eventName;
        const fillAmount = formattedMessage.unmatched.filled;
        const fillThreshold = 0.32;
        if (formattedMessage.unmatched.filled === 0 && orderAmount > 0) {
          console.log(
            `${username} created offer on `,
            event,
            "on",
            type,
            "for",
            orderAmount,
            "at",
            odds,
          );
        } else if (orderAmount === 0) {
          console.log(
            `${username} canceled offer on`,
            event,
            "on",
            type,
            "at",
            odds,
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
            odds,
          );
          const orderBook = await getOrderbook(gameID, url, token);
          const { sport } = formattedMessage;
          const { seedAmount, desiredVig, equityToLockIn } = await vigMap();
          if (
            !(
              (formattedMessage.unmatched.offered -
                formattedMessage.unmatched.remaining) /
                formattedMessage.unmatched.offered <
              fillThreshold
            )
          ) {
            try {
              await cancelAllOrdersForGame(gameID, token, type, url);
            } catch (e) {
              if (e.response && e.response.data) {
                console.log(e.response.data);
              }
            }
            const side1 = formattedMessage.unmatched.side;
            const { newSeedA, secondNewA } = newSeeds(
              odds,
              desiredVig,
              equityToLockIn,
            );
            const orderParticipants = orderBook.data.game.participants;
            const side2 = findOtherSide(orderParticipants, side1, type);
            const orders = properOrders(
              type,
              number,
              gameID,
              side1,
              side2,
              seedAmount,
              newSeedA,
              secondNewA,
              odds,
              sport,
              "make",
              orderBook.data.game.mainTotal,
            );
            await placeOrders(gameID, orders, token, url);
          }
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at:", p, "reason:", reason);
  // application specific logging, throwing an error, or other logic here
});
