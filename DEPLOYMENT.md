# Deployment Guide: Render & Vercel

This application is ready to deploy on **Render** and **Vercel** without any errors.

---

## 1. Deploying on Render (Web Service)

Render runs full-stack Node.js web services with zero friction.

### Automatic Blueprint Deployment (Recommended)
1. Push your repository to GitHub or GitLab.
2. In the Render Dashboard, click **New +** > **Blueprint**.
3. Select this repository. Render automatically reads `render.yaml` and provisions the service.
4. Click **Apply**.

### Manual Deployment on Render
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your repository.
3. Configure the following settings:
   - **Environment**: `Node`
   - **Node Version**: `22` (Render auto-detects from `.nvmrc` and `package.json`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set Environment Variables (optional / recommended):
   - `NODE_ENV`: `production`
   - `AUTH_SECRET`: A secure random string for JWT session tokens (e.g. 32+ characters)
   - `VITE_SITE_URL`: Your Render public URL (e.g. `https://priya-health-care.onrender.com`)
5. Click **Create Web Service**.

---

## 2. Deploying on Vercel

Vercel serves the Vite frontend on their Global CDN and runs the Express API as a serverless function via `api/index.ts` and `vercel.json`.

### Steps:
1. Push your repository to GitHub or GitLab.
2. In the Vercel Dashboard, click **Add New...** > **Project**.
3. Import your repository.
4. Vercel automatically detects the configuration from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables:
   - `AUTH_SECRET`: A secure random string for JWT session tokens (e.g. 32+ characters)
   - `NODE_ENV`: `production`
6. Click **Deploy**.

### How Vercel is Configured:
- `vercel.json` routes `/api/*` to the serverless function `/api/index.ts`.
- `vercel.json` rewrites all SPA routes (e.g. `/appointments`, `/doctor`, `/admin/dashboard`) to `/index.html` for clean client-side routing.
- The SQLite engine automatically uses `/tmp/data` on Vercel's serverless read-only filesystem, while live appointments and data sync to Firebase Firestore in real time.

---

## 3. Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port for server (Render auto-injects) | `3000` |
| `NODE_ENV` | Environment mode (`production` or `development`) | `development` |
| `AUTH_SECRET` | Secret key for JWT admin tokens | Auto-generated |
| `VITE_SITE_URL` | Public site domain URL | `http://localhost:3000` |
| `DATABASE_DIR` | Directory path for SQLite file | `data/` (or `/tmp/data` on Vercel) |
| `UPLOAD_DIR` | Directory path for uploaded doctor photos | `public/uploads/` (or `/tmp/uploads` on Vercel) |
