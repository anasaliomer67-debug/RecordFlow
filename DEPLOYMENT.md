# Deploy RecordFlow for free

RecordFlow needs a server and a persistent database, so GitHub Pages alone is not enough. Use:

- GitHub for the source code
- Vercel for the Next.js app
- Neon for a free Postgres database

## 1. Create the database

1. Create a free Neon project.
2. Copy the pooled Postgres connection string.
3. Keep it ready as `DATABASE_URL`.

The connection string should look like:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

## 2. Push the app to GitHub

If Git is not installed, use GitHub Desktop:

1. File -> Add local repository.
2. Choose this RecordFlow folder.
3. Publish repository.

Or use Git from the terminal.

From this folder:

```powershell
git init
git add .
git commit -m "Prepare RecordFlow for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/recordflow.git
git push -u origin main
```

## 3. Import into Vercel

1. Go to Vercel.
2. Add New Project.
3. Import the GitHub repository.
4. Add these environment variables:

```text
DATABASE_URL=your Neon pooled connection string
NEXTAUTH_SECRET=a long random secret
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

Use this command to create a secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Prepare the production database

This repo keeps two schemas:

- `prisma/schema.prisma` for deployment with Postgres
- `prisma/schema.sqlite.prisma` for local Windows usage with `db\custom.db`

After setting `DATABASE_URL` locally to the Neon Postgres URL:

```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

Then deploy/redeploy on Vercel.

## 5. First login

If you seed the database, the default admin account is:

```text
Username: admin
Password: admin123
```

Change this password by creating your real admin user and deleting or disabling the demo admin account.
