# Outlier Detector — React Demo

A tiny React + Vite app that demonstrates robust outlier detection using Median & MAD with an interactive chart.

## Local run
```bash
npm install
npm run dev
```

## Deploy (fastest): Vercel
1) Push this folder to a **public GitHub repo**.
2) Go to https://vercel.com/import -> "Add New Project" -> import the repo.
3) Vercel auto-detects Vite. Build command: `npm run build`, Output dir: `dist`.
4) Click **Deploy** → you'll get a URL like `https://<project>.vercel.app/`.

## Deploy: GitHub Pages (via Actions)
- This repo already contains `.github/workflows/deploy.yml`.
- After pushing to `main`, go to **Settings → Pages** and set **source = GitHub Actions**.
- Your site will publish at `https://<username>.github.io/<repo>/`.

> The Vite config uses `base: './'` so assets work on subpaths (Pages).
