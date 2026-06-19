
the above code is produce the tokenId.
now i want the Sessionstatus and completesession
16:56
Great, now that CreateSession is producing tokenId, use these two Cloud Code scripts with the same Cloud Save format.

SessionStatus

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
Sandbox request:

{
  "tokenId": "TEST-ABC123"
}
CompleteSession

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
Sandbox request:

{
  "tokenId": "TEST-ABC123",
  "score": 100,
  "passed": true,
  "customData": {
    "level": 1,
    "timeTaken": 45
  }
}
Important: run SessionStatus and CompleteSession using the same authenticated player that created the session, because this is saved under that player’s Cloud Save data.

16:56
session status error

api.getItem is not a function
at module.exports
17:05
api.getItem is not a function means your Unity Cloud Save package uses getItems, not getItem.

Use this fixed code.

SessionStatus

const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  const { tokenId } = params;

  if (!tokenId) {
    throw Error("Token ID required");
  }

  const api = new DataApi(context);

  const projectId = context.projectId;
  const playerId = context.playerId;

  const result = await api.getItems(projectId, playerId, [tokenId]);

  const items = result.data.results;

  if (!items || items.length === 0) {
    throw Error("Session not found");
  }

  const session = items[0].value;

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
Sandbox request:

{
  "tokenId": "TEST-ABC123"
}
CompleteSession

const { DataApi } = require("@unity-services/cloud-save-1.4");

module.exports = async ({ params, context, logger }) => {
  const { tokenId, score, passed, customData } = params;

  if (!tokenId) {
    throw Error("Token ID required");
  }

  const api = new DataApi(context);

  const projectId = context.projectId;
  const playerId = context.playerId;

  const result = await api.getItems(projectId, playerId, [tokenId]);

  const items = result.data.results;

  if (!items || items.length === 0) {
    throw Error("Invalid or expired token");
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
Sandbox request:

{
  "tokenId": "TEST-ABC123",
  "score": 100,
  "passed": true,
  "customData": {
    "level": 1
  }
}
The key change is:

api.getItems(projectId, playerId, [tokenId])
instead of:

api.getItem(...)
17:05
session not found
17:06
Session not found means the read code is working, but it cannot find that tokenId under the same player Cloud Save data.

Most common causes:

You copied the wrong tokenId.
CreateSession and SessionStatus are running with different playerId.
You changed environment/project.
The session was created by older code using a different save format.
Use this debug-friendly SessionStatus code:

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
Run with:

{
  "tokenId": "TEST-ABC123"
}
Replace TEST-ABC123 with the exact token returned by CreateSession.

Also update your CreateSession to log the same playerId:

logger.info(`Created tokenId: ${tokenId}`);
logger.info(`playerId: ${playerId}`);
Then compare:

CreateSession playerId == SessionStatus playerId
They must be exactly the same.

If they are different, Cloud Save will not find the session because you saved it under one player and tried to read it from another player.

17:06
User attachment
This new error is from this debug line:

logger.info(`Cloud Save result: ${JSON.stringify(result)}`);
result contains circular/internal request objects, so JSON.stringify(result) crashes.

Remove that log. Use this fixed SessionStatus:

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

  const items =
    result.data && result.data.results
      ? result.data.results
      : [];

  logger.info(`Items found: ${items.length}`);

  if (items.length === 0) {
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
Run with:

{
  "tokenId": "TEST-ABC123"
}
Replace TEST-ABC123 with the exact token from CreateSession.

The important fix is: don’t stringify the full Cloud Save response. Only log simple values like items.length, tokenId, projectId, and playerId.

17:09




Outputs
No artifacts yet

Sources
