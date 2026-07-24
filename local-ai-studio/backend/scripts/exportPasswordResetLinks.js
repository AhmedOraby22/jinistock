/**
 * Generates a fresh reset token for every migrated user (needsPasswordReset: true)
 * and writes a CSV of { email, name, resetUrl }.
 *
 * Usage: node scripts/exportPasswordResetLinks.js
 */
require("dotenv").config();
const fs = require("fs");
const crypto = require("crypto");
const { prisma, connectDB } = require("../config/db");

async function run() {
  await connectDB();
  const users = await prisma.user.findMany({ where: { needsPasswordReset: true } });

  const lines = ["email,name,reset_url"];
  for (const user of users) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: crypto.createHash("sha256").update(token).digest("hex"),
        passwordResetExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    lines.push(`${user.email},"${(user.name || "").replace(/"/g, '""')}",${resetUrl}`);
  }

  const outPath = "password_reset_links.csv";
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`Wrote ${users.length} reset links to ${outPath}`);
  await prisma.$disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
