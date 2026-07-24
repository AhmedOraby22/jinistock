Odoo user migration input (xlsx fallback only).

Preferred path: restore `jini_db_*.sql.gz` into Postgres DB `jini`, set
`ODOO_DATABASE_URL`, then run:

    node scripts/migrateUsersFromOdoo.js

Xlsx fallback:

    # put users_credits_export.xlsx in this folder, then:
    node scripts/migrateUsersFromOdoo.js --xlsx

    # or pass a path:
    node scripts/migrateUsersFromOdoo.js --xlsx /path/to/export.xlsx

This folder is gitignored - never commit real user PII to source control.
