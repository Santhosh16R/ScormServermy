const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  const { tokenId, score, passed, customData } = params;

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

  const existingSession = result.value || result.data?.value || result;

  if (!existingSession || !existingSession.tokenId) {
    throw Error("Invalid or expired token");
  }

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

  logger.info(`Session completed: ${tokenId}`);

  return {
    success: true,
    tokenId: tokenId,
    status: updatedSession.status,
    score: updatedSession.score,
    passed: updatedSession.passed,
    data: updatedSession
  };
};
