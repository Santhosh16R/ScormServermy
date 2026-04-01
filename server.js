const express = require("express");
const cors = require("cors");

const app = express();

// =====================================
// ✅ PRODUCTION CORS CONFIGURATION
// =====================================
app.use(cors({
    origin: "*", // Allows requests from SCORM Cloud (https://cloud.scorm.com)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// =====================================
// SESSION STORAGE
// Note: On Render's Free Tier, this resets if the server sleeps.
// =====================================
let session = {
    status: "incomplete",
    score: 0
};

// =====================================
// ROUTES
// =====================================

// Default route to check if server is alive
app.get("/", (req, res) => {
    res.send("✅ SCORM Server is Live!");
});

// CREATE SESSION (Reset)
app.post("/create-session", (req, res) => {
    session = {
        status: "incomplete",
        score: 0
    };
    console.log("New Session Initialized");
    res.json({ success: true, data: session });
});

// UNITY UPDATES STATUS
app.post("/complete-session", (req, res) => {
    const { score } = req.body;

    session.status = "completed";
    session.score = score || 0;

    console.log("Session Updated:", session);
    res.json({ success: true });
});

// SCORM CLOUD CHECKS STATUS
app.get("/session-status", (req, res) => {
    console.log("Status Requested:", session);
    res.json(session);
});

// =====================================
// SERVER START
// =====================================
// Render provides the PORT environment variable automatically
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
