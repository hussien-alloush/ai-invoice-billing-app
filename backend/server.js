const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./src/config/env");
const { connectDB } = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");
const healthRouter = require("./src/routes/health");
const authRouter = require("./src/routes/auth");
const clientsRouter = require("./src/routes/clients");
const invoicesRouter = require("./src/routes/invoice");
const dashboardRouter = require("./src/routes/dashboard");
const reportsRouter = require("./src/routes/reports");
const settingsRouter = require("./src/routes/settings");
const itemsRouter = require("./src/routes/items");
const expensesRouter = require("./src/routes/expenses");
const paymentsRouter = require ("./src/routes/payments");
const aiRouter = require("./src/routes/ai");

const app = express();

app.set("trust proxy", 1); // trust first proxy

// Middleware
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigin.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


if (!env.isProd) app.use(morgan("dev"));

// Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/expenses",expensesRouter );
app.use("/api/payments", paymentsRouter);
app.use("/api/ai", aiRouter);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);


async function start() {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.log(`Server running on port ${env.port} (${env.nodeEnv} mode)`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

start();

module.exports = app;