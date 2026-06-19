const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  const { tokenId } = params;

  if (!tokenId) {
    throw Error("Token ID required");
  }

  const api = new DataApi(context);

  const projectId = context.projectId;
  const playerId = context.playerId;

  logger.info(`Checking tokenId: ${tokenId}`);
  logger.info(`projectId: ${projectId}`);
  logger.info(`playerId: ${playerId}`);

  if (!projectId) {
    throw Error("Missing projectId");
  }

  if (!playerId) {
    throw Error("Missing playerId");
  }

  const result = await api.getItems(projectId, playerId, [tokenId]);

  logger.info(`Cloud Save result: ${JSON.stringify(result)}`);

  const items =
    result.data?.results ||
    result.results ||
    [];

  if (!items || items.length === 0) {
    throw Error(`Session not found for tokenId: ${tokenId}`);
  }

  const session = items[0].value;

  return {
    success: true,
    tokenId: tokenId,
    status: session.status,
    score: session.score,
    passed: session.passed,
    data: session
  };
};
