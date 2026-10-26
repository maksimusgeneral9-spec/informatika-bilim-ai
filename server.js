// BILIM SINAW AI — Server (Express + JSON baza + JWT login)
// Iske túsiriw: npm install && node server.js  -> http://localhost:3000
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'bilim-sinaw-ai-25-mektep-secret';
const DBF = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Baza ----------
function load() {
  if (!fs.existsSync(DBF)) {
    const seed = {
      users: [
        { l: 'oqiwshi', p: bcrypt.hashSync('123', 8), r: 'student', name: 'Demo Oqiwshi 7A' },
        { l: 'mugallim', p: bcrypt.hashSync('123', 8), r: 'teacher', name: 'Gulnara apa' },
        { l: 'admin', p: bcrypt.hashSync('123', 8), r: 'admin', name: 'Admin' }
      ],
      klass: [{ n: '7A', c: 29, s: 82, on: 1 }, { n: '8B', c: 27, s: 71, on: 1 }],
      tema: [{ t: 'Algoritm tusinigi', k: '7-klass', d: 'Buyriqlar izbe-izligi' }],
      slayd: [{ t: 'Monitor', x: 'Korsetiw qurilmasi' }, { t: 'Processor', x: 'Kompyuter miyi' }],
      soraw: [{ topic: 'Algoritmler', q: 'Kompyuter miyi?', v: ['Monitor', 'Processor', 'Klaviatura'], ok: [1] }],
      res: [{ n: 'Aynur (7A)', t: 'Algoritmler', s: 95, date: new Date().toISOString() }],
      dist: [{ t: '7-klass Algoritmler', code: 'ALG-724', on: 1 }],
      perm: { test: 1, olimpiada: 1, ai: 1, oyin: 1 },
      set: { pass: 70, time: 60 }
    };
    fs.writeFileSync(DBF, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(fs.readFileSync(DBF, 'utf-8'));
}
function save(db) { fs.writeFileSync(DBF, JSON.stringify(db, null, 2)); }

// ---------- Auth ----------
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ e: 'Token kerek' });
  try { req.u = jwt.verify(t, SECRET); next(); }
  catch { return res.status(401).json({ e: 'Token jaramsiz' }); }
}
const need = (...roles) => (req, res, next) =>
  roles.includes(req.u.r) ? next() : res.status(403).json({ e: 'Ruxsat joq (' + roles.join('/') + ')' });

// Login: login/parol -> token + rol
app.post('/api/login', (req, res) => {
  const { l, p } = req.body || {};
  const db = load();
  const u = db.users.find(x => x.l === (l || '').toLowerCase());
  if (!u || !bcrypt.compareSync(p || '', u.p)) return res.status(401).json({ e: 'Login/parol qate' });
  const token = jwt.sign({ l: u.l, r: u.r, name: u.name }, SECRET, { expiresIn: '7d' });
  res.json({ token, l: u.l, r: u.r, name: u.name });
});
app.get('/api/me', auth, (req, res) => res.json(req.u));

// ---------- Umumiy oqiw (hamme kirgen paydalanivshi) ----------
app.get('/api/data', auth, (req, res) => {
  const db = load();
  const { users, ...pub } = db;
  res.json(pub);
});

// ---------- Oqitiwshi / Admin jaziw API ----------
app.post('/api/tema', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.tema.push(req.body); save(db); res.json({ ok: 1 });
});
app.delete('/api/tema/:i', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.tema.splice(+req.params.i, 1); save(db); res.json({ ok: 1 });
});
app.post('/api/slayd', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.slayd.push(req.body); save(db); res.json({ ok: 1 });
});
app.delete('/api/slayd/:i', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.slayd.splice(+req.params.i, 1); save(db); res.json({ ok: 1 });
});
app.post('/api/soraw', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.soraw.push(req.body); save(db); res.json({ ok: 1, n: db.soraw.length });
});
app.delete('/api/soraw/:i', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.soraw.splice(+req.params.i, 1); save(db); res.json({ ok: 1 });
});
app.post('/api/klass', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.klass.push(req.body); save(db); res.json({ ok: 1 });
});
app.post('/api/dist', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.dist.push(req.body); save(db); res.json({ ok: 1 });
});
app.post('/api/dist/:i', auth, need('teacher', 'admin'), (req, res) => {
  const db = load(); db.dist[+req.params.i].on = !db.dist[+req.params.i].on; save(db); res.json({ ok: 1 });
});
// Natije saqlaw — oqiwshi oz ati menen (serverde tekseriw ushin ball qayta esaplanadi)
app.post('/api/res', auth, (req, res) => {
  const db = load();
  db.res.push({ n: req.u.l + (req.u.name ? ' (' + req.u.name + ')' : ''), t: req.body.t || 'Test', s: Math.max(0, Math.min(100, +req.body.s || 0)), date: new Date().toISOString() });
  save(db); res.json({ ok: 1 });
});

// ---------- Admin ----------
app.get('/api/users', auth, need('admin'), (req, res) => {
  const db = load(); res.json(db.users.map(u => ({ l: u.l, r: u.r, name: u.name })));
});
app.post('/api/users', auth, need('admin'), (req, res) => {
  const db = load();
  if (db.users.find(x => x.l === req.body.l)) return res.status(400).json({ e: 'Bul login bar' });
  db.users.push({ l: req.body.l.toLowerCase(), p: bcrypt.hashSync(req.body.p || '123', 8), r: req.body.r || 'student', name: req.body.name || '' });
  save(db); res.json({ ok: 1 });
});
app.delete('/api/users/:l', auth, need('admin'), (req, res) => {
  const db = load(); db.users = db.users.filter(x => x.l !== req.params.l); save(db); res.json({ ok: 1 });
});
app.post('/api/perm', auth, need('admin'), (req, res) => {
  const db = load(); db.perm[req.body.k] = db.perm[req.body.k] ? 0 : 1; save(db); res.json(db.perm);
});
app.post('/api/set', auth, need('admin'), (req, res) => {
  const db = load(); db.set = { ...db.set, ...req.body }; save(db); res.json(db.set);
});
app.get('/api/backup', auth, need('admin'), (req, res) => res.download(DBF, 'baza-backup.json'));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log('✅ BILIM SINAW AI server: http://localhost:' + PORT + '\nDemo: oqiwshi/123, mugallim/123, admin/123'));
