const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  const api = new DataApi(context);

  const projectId = context.projectId;
  const playerId = context.playerId || params.playerId;

  if (!projectId) {
    throw Error("Missing projectId");
  }

  if (!playerId) {
    throw Error("Missing playerId. Send playerId in params or run as authenticated player.");
  }

  const tokenId =
    "TEST-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const session = {
    tokenId: tokenId,
    playerId: playerId,
    status: "waiting",
    score: 0,
    passed: false,
    customData: null,
    createdAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };

  await api.setItem(projectId, playerId, {
    key: tokenId,
    value: session
  });

  logger.info(`Session created: ${tokenId}`);

  return {
    success: true,
    tokenId: tokenId,
    playerId: playerId,
    data: session
  };
};
