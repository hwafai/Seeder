require("./loadEnv");
const { Manager } = require("socket.io-client");

const {
  newSeeds,
  findOtherSide,
  properOrders,
} = require("./seederUtils");

const {
  cancelAllOrdersForGame,
  getOrderbook,
  login,
  placeOrders,
} = require("./apiUtils");
const { format } = require("prettier");

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
        const seedAmount = 100;
        const fillThreshold = .8;
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
          console.log(formattedMessage)
          console.log((formattedMessage.unmatched.offered - formattedMessage.unmatched.remaining)/formattedMessage.unmatched.offered)
          console.log(fillThreshold)
          if (!(((formattedMessage.unmatched.offered - formattedMessage.unmatched.remaining)/formattedMessage.unmatched.offered) < fillThreshold)){
            const side1 = formattedMessage.unmatched.side;
            const {newSeedA, secondNewA} = newSeeds(odds)
            console.log({newSeedA, secondNewA})
            await cancelAllOrdersForGame(gameID, token, type, url);
            const orderBook = await getOrderbook(gameID, url, token);
            const orderParticipants = orderBook.data.games[0].participants;
            console.log(side1);
            const side2 = findOtherSide(orderParticipants, side1, type);
            console.log(side2);
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
          }
          // console.log(formattedMessage)
          // const side1 = formattedMessage.unmatched.side;
          // const {newSeedA, secondNewA} = newSeeds(odds)
          // console.log({newSeedA, secondNewA})
          // await cancelAllOrdersForGame(gameID, token, type, url);
          // const orderBook = await getOrderbook(gameID, url, token);
          // const orderParticipants = orderBook.data.games[0].participants;
          // console.log(side1);
          // const side2 = findOtherSide(orderParticipants, side1, type);
          // console.log(side2);
          // const orders = properOrders(
          //   type,
          //   number,
          //   gameID,
          //   side1,
          //   side2,
          //   seedAmount,
          //   newSeedA,
          //   secondNewA
          // );
          // await placeOrders(gameID, orders, token, url);
        }
      }
    });
  })
  .catch(function (error) {
    console.log(error);
  });
