const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// 📦 In-memory Session Storage
const sessions = new Map();

// --- CLEANUP LOGIC ---
// Removes sessions older than 2 hours to prevent memory leaks
setInterval(() => {
    const now = new Date();
    for (let [tokenId, session] of sessions) {
        if (now - session.lastUpdate > 2 * 60 * 60 * 1000) {
            sessions.delete(tokenId);
            console.log(`🧹 Cleaned up expired session: ${tokenId}`);
        }
    }
}, 30 * 60 * 1000); // Runs every 30 minutes

// --- ROUTES ---

app.get("/", (req, res) => res.send("✅ Multi-Device VR Server Active"));

// 1. BRIDGE: Create session
app.post("/create-session", (req, res) => {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ error: "Token ID required" });

    // Ensure we don't overwrite an ACTIVE session accidentally
    if (sessions.has(tokenId) && sessions.get(tokenId).status === "progress") {
        return res.status(409).json({ error: "Token already in use by another device" });
    }

    sessions.set(tokenId, {
        status: "waiting",
        score: 0,
        passed: false,
        customData: null,
        lastUpdate: new Date()
    });

    console.log(`🆕 New Session Registered: ${tokenId} (Total Active: ${sessions.size})`);
    res.json({ success: true });
});

// 2. UNITY: Multi-device validation and completion
app.post("/complete-session", (req, res) => {
    const { tokenId, score, status, passed, customData } = req.body; 

    if (!sessions.has(tokenId)) {
        console.error(`❌ Validation Failed: Token ${tokenId} not recognized.`);
        return res.status(404).json({ error: "Invalid or expired token" });
    }

    let session = sessions.get(tokenId);
    
    // Update data
    session.status = status;
    // Use parseFloat to ensure floats/decimals are preserved for SCORM
    if (score !== undefined) session.score = parseFloat(score);
    if (passed !== undefined) session.passed = passed;
    if (customData !== undefined) session.customData = customData;
    
    session.lastUpdate = new Date();

    console.log(`📲 Device Sync [${tokenId}]: ${status.toUpperCase()} | Score: ${session.score}`);
    res.json({ success: true });
});

app.get("/session-status/:tokenId", (req, res) => {
    const session = sessions.get(req.params.tokenId);
    if (!session) return res.status(404).json({ error: "Not Found" });
    res.json(session);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server monitoring ${PORT}`));
