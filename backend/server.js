require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const generateRoutes = require("./routes/generateRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const creditRoutes = require("./routes/creditRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const falProxyRoutes = require("./routes/falProxyRoutes");
const runwayProxyRoutes = require("./routes/runwayProxyRoutes");
const wavespeedProxyRoutes = require("./routes/wavespeedProxyRoutes");
const openaiProxyRoutes = require("./routes/openaiProxyRoutes");
const sunoProxyRoutes = require("./routes/sunoProxyRoutes");

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/admin", adminRoutes);

// Uploads (JWT): /api/upload and Odoo-compatible /api/upload_file
app.use("/api/upload", uploadRoutes);
app.use("/api/upload_file", uploadRoutes);

// Odoo-compatible provider proxies (JWT on each router)
app.use("/fal", falProxyRoutes);
app.use("/runway", runwayProxyRoutes);
app.use("/wavespeed", wavespeedProxyRoutes);
app.use("/openai", openaiProxyRoutes);
app.use("/suno", sunoProxyRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
