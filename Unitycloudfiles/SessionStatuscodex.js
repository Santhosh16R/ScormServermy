const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  const { tokenId } = params;

  if (!tokenId) {
    throw Error("Token ID required");
  }

  const api = new DataApi(context);

  const projectId = context.projectId;
  const playerId = context.playerId;

  if (!projectId) {
    throw Error("Missing projectId");
  }

  if (!playerId) {
    throw Error("Missing playerId. Run Cloud Code as an authenticated player.");
  }

  const result = await api.getItem(projectId, playerId, tokenId);

  const session = result.value || result.data?.value || result;

  if (!session || !session.tokenId) {
    throw Error("Session not found");
  }

  logger.info(`Session status checked: ${tokenId}`);

  return {
    success: true,
    tokenId: tokenId,
    status: session.status,
    score: session.score,
    passed: session.passed,
    data: session
  };
};
