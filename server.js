const express = require("express");
const cors = require("cors");
const app = express();

// ✅ CORS Configuration for Render & SCORM Cloud
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 📦 In-memory Session Storage
// Structure: { "TOKEN123": { status: "waiting", score: 0, passed: false, customData: null } }
const sessions = new Map();

// --- ROUTES ---

// Health Check
app.get("/", (req, res) => res.send("✅ VR SCORM Server is Live and Global!"));

// 1. BRIDGE: Create a new session with a unique Token
app.post("/create-session", (req, res) => {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ error: "Token ID required" });

    sessions.set(tokenId, {
        status: "waiting",
        score: 0,
        passed: false,
        customData: null,
        lastUpdate: new Date()
    });

    console.log(`🆕 Session Created: ${tokenId}`);
    res.json({ success: true });
});

// 2. UNITY: Update progress or Complete training
app.post("/complete-session", (req, res) => {
    const { tokenId, score, status, passed, customData } = req.body; 

    if (!sessions.has(tokenId)) {
        console.error(`❌ Session Not Found: ${tokenId}`);
        return res.status(404).json({ error: "Session not found" });
    }

    let session = sessions.get(tokenId);
    
    // Update all fields provided by Unity
    session.status = status || "completed"; // "progress" or "completed"
    if (score !== undefined) session.score = score;
    if (passed !== undefined) session.passed = passed;
    if (customData !== undefined) session.customData = customData;
    
    session.lastUpdate = new Date();

    console.log(`✅ Update [${tokenId}]: Status=${session.status}, Score=${session.score}, Passed=${session.passed}`);
    res.json({ success: true });
});

// 3. BRIDGE: Polling for specific token
app.get("/session-status/:tokenId", (req, res) => {
    const session = sessions.get(req.params.tokenId);
    if (!session) return res.status(404).json({ error: "Session Expired or Not Found" });
    res.json(session);
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
