const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/password");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  imageCredits: user.imageCredits,
  videoCredits: user.videoCredits,
  maxImageCredits: user.maxImageCredits,
  maxVideoCredits: user.maxVideoCredits,
});

// @route POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const normalizedEmail = email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: await hashPassword(password),
      },
    });
    return res.status(201).json({
      token: signToken(user.id),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: (email || "").toLowerCase() },
    });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    return res.json({
      token: signToken(user.id),
      user: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// @route POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email: (email || "").toLowerCase() },
  });
  // Always respond 200 even if user not found, to avoid leaking which emails are registered.
  if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: crypto.createHash("sha256").update(token).digest("hex"),
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
  console.log(`Password reset link for ${user.email}: ${resetUrl}`);

  res.json({ message: "If that email exists, a reset link has been sent." });
});

// @route POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token || "").digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      email: (email || "").toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) return res.status(400).json({ message: "Reset link is invalid or expired" });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(newPassword),
      needsPasswordReset: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  res.json({ token: signToken(user.id), message: "Password updated" });
});

module.exports = router;
