/**
 * One-time migration: imports users + credit balances into PostgreSQL `User`.
 *
 * Default source: restored Odoo DB (`ODOO_DATABASE_URL`) —
 *   flux_ai_user_credits JOIN res_users / res_partner
 *
 * Fallback: xlsx export
 *   node scripts/migrateUsersFromOdoo.js --xlsx
 *   node scripts/migrateUsersFromOdoo.js --xlsx /path/to/export.xlsx
 *
 * Old Odoo passwords cannot be reused — every migrated user gets a random
 * unusable password and needsPasswordReset=true. Run
 * scripts/exportPasswordResetLinks.js afterwards for bulk reset links.
 */
require("dotenv").config();
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { Client } = require("pg");
const XLSX = require("xlsx");
const { prisma, connectDB } = require("../config/db");
const { hashPassword } = require("../utils/password");

const SKIP_LOGINS = new Set(["__system__", "default"]);

function parseArgs(argv) {
  const xlsxIdx = argv.indexOf("--xlsx");
  if (xlsxIdx !== -1) {
    const maybePath = argv[xlsxIdx + 1];
    const filePath =
      maybePath && !maybePath.startsWith("--")
        ? maybePath
        : path.join(__dirname, "..", "migration_input", "users_credits_export.xlsx");
    return { mode: "xlsx", filePath };
  }
  // Legacy: bare path argument still treated as xlsx
  if (argv[2] && !argv[2].startsWith("--")) {
    return { mode: "xlsx", filePath: argv[2] };
  }
  return { mode: "odoo" };
}

async function upsertUser(row) {
  const email = (row.email || "").toLowerCase();
  if (!email) return "skipped";

  const login = row.login || row.username;
  if (SKIP_LOGINS.has(login)) return "skipped";

  const data = {
    name: row.name || login || email,
    email,
    imageCredits: row.image_credits || 0,
    videoCredits: row.video_credits || 0,
    maxImageCredits: row.max_image_credits || 0,
    maxVideoCredits: row.max_video_credits || 0,
    creditsUsed: row.credits_used || 0,
    legacyOdooUserId: row.user_id != null ? Number(row.user_id) : null,
    needsPasswordReset: true,
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data,
    });
    return "updated";
  }

  await prisma.user.create({
    data: {
      ...data,
      password: await hashPassword(crypto.randomBytes(24).toString("hex")),
    },
  });
  return "imported";
}

async function loadRowsFromOdoo() {
  const url = process.env.ODOO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "ODOO_DATABASE_URL is not set. Restore the Odoo dump into Postgres and set ODOO_DATABASE_URL, or use --xlsx."
    );
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("Reading users + credits from Odoo database ...");

  // Prefer portal/public users that are active; include anyone with a credit row.
  const { rows } = await client.query(`
    SELECT
      u.id AS user_id,
      u.login,
      COALESCE(p.email, u.login) AS email,
      COALESCE(p.name, u.login) AS name,
      COALESCE(c.image_credits, 0) AS image_credits,
      COALESCE(c.video_credits, 0) AS video_credits,
      COALESCE(c.max_image_credits, 0) AS max_image_credits,
      COALESCE(c.max_video_credits, 0) AS max_video_credits,
      COALESCE(c.credits_used, 0) AS credits_used,
      u.active,
      u.share
    FROM res_users u
    LEFT JOIN res_partner p ON p.id = u.partner_id
    LEFT JOIN flux_ai_user_credits c ON c.user_id = u.id
    WHERE u.active = true
      AND u.login IS NOT NULL
      AND COALESCE(p.email, u.login) IS NOT NULL
      AND COALESCE(p.email, u.login) LIKE '%@%'
      AND (u.share = true OR c.id IS NOT NULL)
    ORDER BY u.id
  `);

  await client.end();
  return rows;
}

async function loadRowsFromXlsx(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Export file not found:\n  ${filePath}\n\n` +
        `Put your Odoo "Users Credits" .xlsx in backend/migration_input/ as\n` +
        `users_credits_export.xlsx, or pass the path after --xlsx.`
    );
  }
  console.log(`Reading ${filePath} ...`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["Users Credits"] || workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  return rows
    .filter((row) => {
      const login = row.username;
      if (!row.email || SKIP_LOGINS.has(login)) return false;
      if (row.status && row.status !== "active") return false;
      return true;
    })
    .map((row) => ({
      user_id: row.user_id,
      login: row.username,
      email: row.email,
      name: row.name,
      image_credits: row.image_credits,
      video_credits: row.video_credits,
      max_image_credits: row.max_image_credits,
      max_video_credits: row.max_video_credits,
      credits_used: row.credits_used,
    }));
}

async function run() {
  const args = parseArgs(process.argv);
  const rows =
    args.mode === "xlsx" ? await loadRowsFromXlsx(args.filePath) : await loadRowsFromOdoo();

  await connectDB();

  let imported = 0;
  let skipped = 0;
  let updated = 0;

  for (const row of rows) {
    const result = await upsertUser(row);
    if (result === "imported") imported++;
    else if (result === "updated") updated++;
    else skipped++;
  }

  console.log(
    `Done. Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped} (source: ${args.mode})`
  );
  await prisma.$disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
