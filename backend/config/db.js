const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected (Prisma)");
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { prisma, connectDB };
