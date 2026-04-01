const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS Config for Render & SCORM Cloud
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 📝 In-memory database for sessions
// Structure: { "TOKEN123": { status: "waiting", score: 0, passed: false } }
const sessions = new Map();

// --- ROUTES ---

// Heartbeat
app.get("/", (req, res) => res.send("✅ VR SCORM Server is Live!"));

// 1. BRIDGE: Create a new session with a unique Token
app.post("/create-session", (req, res) => {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ error: "Token ID required" });

    sessions.set(tokenId, {
        status: "waiting",
        score: 0,
        passed: false,
        timestamp: new Date()
    });

    console.log(`🆕 Session Created: ${tokenId}`);
    res.json({ success: true });
});

// 2. UNITY: Update progress or Complete training
app.post("/complete-session", (req, res) => {
    const { tokenId, score, status } = req.body; 

    if (!sessions.has(tokenId)) {
        return res.status(404).json({ error: "Session not found" });
    }

    let session = sessions.get(tokenId);
    
    // Update fields
    session.status = status || "completed"; // "progress" or "completed"
    if (score !== undefined) session.score = score;
    session.passed = (session.score >= 80);

    console.log(`Update [${tokenId}]: Status=${session.status}, Score=${session.score}`);
    res.json({ success: true });
});

// 3. BRIDGE: Polling for specific token
app.get("/session-status/:tokenId", (req, res) => {
    const session = sessions.get(req.params.tokenId);
    if (!session) return res.status(404).json({ error: "Session Expired or Not Found" });
    res.json(session);
});

// --- START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
