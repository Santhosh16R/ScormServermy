const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ context, logger }) => {
  const api = new DataApi(context);

  const tokenId = "TEST-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const session = {
    tokenId: tokenId,
    status: "waiting",
    score: 0,
    passed: false,
    customData: null,
    createdAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };

  logger.info(`Creating session: ${tokenId}`);

  await api.setItem({
    key: tokenId,
    value: session
  }, {
    accessClass: "custom"
  });

  const result = await api.getItem(tokenId, {
    accessClass: "custom"
  });

  return {
    success: true,
    tokenId: tokenId,
    data: result.value
  };
};
