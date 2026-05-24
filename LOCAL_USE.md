# Using RecordFlow on your PC

## First time setup

Double-click:

```text
SETUP_RecordFlow.bat
```

This installs dependencies, prepares Prisma, syncs the SQLite database, and builds the app.

Local Windows usage uses `prisma/schema.sqlite.prisma` and stores data in `db\custom.db`.
Cloud deployment uses `prisma/schema.prisma` and a Postgres database.

## Start the app

Double-click:

```text
START_RecordFlow.bat
```

It opens:

```text
http://localhost:3000/login
```

Keep the command window open while using RecordFlow. Press `Ctrl+C` in that window to stop it.

If the app is already running or port `3000` is busy, double-click:

```text
STOP_RecordFlow.bat
```

## Your data

Your local database is here:

```text
db\custom.db
```

Keep the whole RecordFlow folder together when moving or backing up the app.

## Development mode

Use this only when editing the code:

```text
START_RecordFlow_DEV.bat
```
