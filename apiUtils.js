const callApi = require("./callApi");

async function getOrderbook(gameID, url, token) {
  return callApi({
    url: `${url}/exchange/v2/getOrderbook`,
    method: "GET",
    params: {
      gameID,
    },
    headers: { authorization: token },
  });
}

async function login(password, url, username) {
  return callApi({
    url: `${url}/user/login`,
    method: "POST",
    data: {
      username,
      password,
    },
  });
}

async function cancelAllOrdersForGame(gameID, token, type, url) {
  const data = {
    gameID,
  };

  if (type) {
    data.type = type;
  }

  return callApi({
    url: `${url}/session/cancelAllOrdersForGame`,
    method: "POST",
    data,
    headers: { authorization: token },
  });
}

async function placeOrders(gameID, orders, token, url) {
  return callApi({
    url: `${url}/session/v2/place`,
    method: "POST",
    data: {
      token: token,
      orders,
      gameID,
    },
  });
}

module.exports = {
  cancelAllOrdersForGame,
  getOrderbook,
  login,
  placeOrders,
};
