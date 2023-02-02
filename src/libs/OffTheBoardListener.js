const { redisSubscriber, redisPublisher } = require("../libs/redisClients");
const EventEmitter = require("events");

class offTheBoardListener extends EventEmitter {
  constructor() {
    super();
    redisSubscriber.subscribe("bookmaker-otb-channel");
    redisSubscriber.on("message", (channel, message) => {
      if (channel === "bookmaker-otb-channel") {
        this.emit("offTheBoardMessage", message);
      }
    });
  }

  async setSeederOffTheBoardStatus(username, gameId, offTheBoard) {
    await redisPublisher.set(`username-${gameId}-offTheBoard`, offTheBoard);
  }

  async checkSeederOffTheBoardStatus(username, gameId) {
    const status = await redisPublisher.get(`username-${gameId}-offTheBoard`);
    return status === "true";
  }
}

module.exports = offTheBoardListener;
