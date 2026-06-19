const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  let { tokenId, score, passed, customData } = params;

  if (!tokenId) {
    throw Error("Token ID required");
  }

  tokenId = tokenId.trim();

  const api = new DataApi(context);

  const projectId = context.projectId;
  const playerId = context.playerId;

  logger.info(`Completing tokenId: ${tokenId}`);
  logger.info(`projectId: ${projectId}`);
  logger.info(`playerId: ${playerId}`);

  if (!projectId) {
    throw Error("Missing projectId");
  }

  if (!playerId) {
    throw Error("Missing playerId");
  }

  const result = await api.getItems(projectId, playerId, [tokenId]);

  const items =
    result.data && result.data.results
      ? result.data.results
      : [];

  logger.info(`Items found: ${items.length}`);

  if (items.length === 0) {
    throw Error(`Token not found for this playerId: ${tokenId}`);
  }

  const existingSession = items[0].value;

  const updatedSession = {
    ...existingSession,
    status: "completed",
    score: score !== undefined ? parseFloat(score) : existingSession.score,
    passed: passed === true,
    customData: customData || existingSession.customData || null,
    lastUpdate: new Date().toISOString()
  };

  await api.setItem(projectId, playerId, {
    key: tokenId,
    value: updatedSession
  });

  return {
    success: true,
    tokenId: tokenId,
    status: updatedSession.status,
    score: updatedSession.score,
    passed: updatedSession.passed,
    data: updatedSession
  };
};
