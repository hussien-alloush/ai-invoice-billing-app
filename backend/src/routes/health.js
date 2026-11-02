const express = require("express");
const pool = require("../config/db").pool;

const router = express.Router();

router.get("/", async (req, res) => {
    let db = "unknown";
    let status = "OK";
    let statusCode = 200;

    try {
        await pool.query("SELECT 1");
        db = "connected";
    } catch (err) {
        console.error("Health check database query failed:", err);
        db = "error";
        status = "ERROR";
        statusCode = 503;
    }

    res.status(statusCode).json({
        status,
        uptime: process.uptime(),
        database: db,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;