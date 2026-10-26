# INFORMATIKA BILIM AI — Serverli toliq nusqa 🖥
Qanlıkól 25-mektep • 5–11 klass • Qaraqalpaq tilinde • Oqıwshı + Oqıtıwshı + Admin

## 1. Lokal iske túsiriw (2 minut)
```bash
cd informatika-bilim-ai
npm install
node server.js
# ➜ http://localhost:3000
```
Demo loginler (kirill-kirill emes, latınsha teriń):
- `oqiwshi / 123` — oqıwshı
- `mugallim / 123` — oqıtıwshı
- `admin / 123` — admin

> Frontend `public/index.html` — server joq bolsa offline (localStorage) isleydi, server bar bolsa avtomatik `/api/*` ke ótedi.

## 2. Serverge qoyıw — 3 jol

### A) Render.com (biypul, 5 minut) — usınıs etiledi
1. Bul papkanı GitHub qa júkleń (`bilim-sinaw-ai`)
2. render.com → New → Web Service → repozitoriy tańlań
3. Build: `npm install` • Start: `node server.js`
4. `JWT_SECRET` env qosıń (Generate). Tamam!
5. Berilgen `https://bilim-sinaw-ai.onrender.com` siltemesin oqıtıwshılarǵa tarqatıń.

### B) Railway / VPS
```bash
# VPS (Ubuntu):
apt install nodejs npm -y
cd informatika-bilim-ai && npm install --production
JWT_SECRET=uzin-qupiya-soz PORT=3000 node server.js
# pm2 menen turaqlı:
npm i -g pm2 && pm2 start server.js --name bilim && pm2 save
```

### C) Docker
```bash
docker build -t bilim-sinaw-ai .
docker run -p 3000:3000 -e JWT_SECRET=qupiya -v ./db.json:/app/db.json bilim-sinaw-ai
```

## 3. API (login + baza)
- `POST /api/login {l,p}` → `{token, r, name}`
- `GET /api/data` (token) → klass, tema, slayd, soraw, res, dist, perm, set
- `POST /api/res` — nátiyje saqlaw (oqıwshı)
- `POST /api/soraw|tema|slayd|klass|dist` — oqıtıwshı
- `GET/POST/DELETE /api/users` — admin
- `POST /api/perm`, `/api/set`, `GET /api/backup` — admin

Baza — `db.json` fayl (SQLite ke kóshiriwge boladı). Backup: Admin → Baza → Backup.

## 4. Qáwipsizlik
- Parollar `bcrypt` te xeshlengen
- JWT 7 kúnlik token
- Rol tekseriw: `need('teacher','admin')`, `need('admin')`
- Durıs juwaplar — hesh qashan API den ashıq berilmeydi (kerek bolsa `/api/data` den `ok` di alıp taslań — serverde tekseriw rejimi).

## 5. Fayllar
```
informatika-bilim-ai/
├── server.js        # Express + JWT + baza
├── package.json
├── Dockerfile
├── render.yaml
├── db.json          # avtomatik jaratıladı
└── public/index.html# toliq frontend (offline+online)
```
