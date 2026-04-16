# EF Core Migrations

Run these commands from the `backend/` directory to generate and apply migrations.

## First-time Setup

```bash
# From CustomerLedgerRecords/backend/

# Create initial migration
dotnet ef migrations add InitialCreate \
  --project src/CustomerLedger.Infrastructure \
  --startup-project src/CustomerLedger.API \
  --output-dir Data/Migrations

# Apply migration to database
dotnet ef database update \
  --project src/CustomerLedger.Infrastructure \
  --startup-project src/CustomerLedger.API
```

## Subsequent migrations

```bash
dotnet ef migrations add <MigrationName> \
  --project src/CustomerLedger.Infrastructure \
  --startup-project src/CustomerLedger.API \
  --output-dir Data/Migrations

dotnet ef database update \
  --project src/CustomerLedger.Infrastructure \
  --startup-project src/CustomerLedger.API
```
