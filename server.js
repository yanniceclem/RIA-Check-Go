const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcrypt');

const Database = require('better-sqlite3');
const DB_FILE = path.join(__dirname, 'data.db');
const db = new Database(DB_FILE);

// Ensure uploads dir
const UPLOADS = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

// Create tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, siret TEXT, contact_email TEXT);
CREATE TABLE IF NOT EXISTS systems (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT, description TEXT, domain TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS diagnostics (id INTEGER PRIMARY KEY AUTOINCREMENT, system_id INTEGER, created_by TEXT, created_at TEXT, score INTEGER, level TEXT, payload_json TEXT, report_url TEXT);
CREATE TABLE IF NOT EXISTS datasets (id INTEGER PRIMARY KEY AUTOINCREMENT, system_id INTEGER, type TEXT, description TEXT, metadata_json TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT, email TEXT, message TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, message TEXT, meta_json TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, system_id INTEGER, payload_json TEXT, status TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS incidents (id INTEGER PRIMARY KEY AUTOINCREMENT, system_id INTEGER, title TEXT, description TEXT, severity TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'user', created_at TEXT);

    CREATE TABLE IF NOT EXISTS sgr_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      system_id INTEGER,
      owner_id INTEGER,
      status TEXT DEFAULT 'open',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sgr_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER,
      status TEXT DEFAULT 'todo',
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

  // Ensure `diagnostic_id` column exists on older DBs
  try{
    const cols = db.prepare("PRAGMA table_info(sgr_plans)").all();
    const hasDiag = cols.find(c=>c.name==='diagnostic_id');
    if(!hasDiag){
      db.prepare('ALTER TABLE sgr_plans ADD COLUMN diagnostic_id INTEGER').run();
      console.log('Added diagnostic_id column to sgr_plans');
    }
  }catch(e){
    // ignore if something goes wrong (e.g., table not present yet)
    console.error('Could not ensure diagnostic_id column:', e && e.message);
  }

const app = express();
app.use(cors());
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended:true}));

// Session middleware (development only - use a proper store in production)
app.use(session({
  secret: 'ria-check-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

// Serve static frontend
app.use('/', express.static(path.join(__dirname)));
// Serve uploads (reports, attachments)
app.use('/uploads', express.static(UPLOADS));

// Multer for file uploads
const upload = multer({ dest: UPLOADS });

// Helper
function now(){ return new Date().toISOString(); }

// --- Authentication endpoints & helpers ---
app.post('/api/v1/signup', async (req,res)=>{
  const {name,email,password,role} = req.body;
  if(!email || !password) return res.status(400).json({error:'email+password required'});
  try{
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)');
    const info = stmt.run(name||'', email, hash, role||'user', now());
    res.json({ok:true,id:info.lastInsertRowid});
  }catch(e){
    res.status(500).json({error: String(e)});
  }
});

app.post('/api/v1/login', async (req,res)=>{
  const {email,password} = req.body;
  if(!email || !password) return res.status(400).json({error:'email+password required'});
  const row = db.prepare('SELECT id,name,email,password_hash,role FROM users WHERE email=?').get(email);
  if(!row) return res.status(401).json({error:'invalid credentials'});
  const ok = await bcrypt.compare(password, row.password_hash);
  if(!ok) return res.status(401).json({error:'invalid credentials'});
  req.session.user = {id:row.id, name:row.name, email:row.email, role:row.role};
  res.json({ok:true,user:{id:row.id,name:row.name,email:row.email,role:row.role}});
});

app.post('/api/v1/logout', (req,res)=>{
  req.session.destroy(()=>res.json({ok:true}));
});

app.get('/api/v1/session', (req,res)=>{
  if(req.session.user) return res.json({ok:true,user:req.session.user});
  res.json({ok:false});
});

function requireAuth(role){
  return (req,res,next)=>{
    if(!req.session.user) return res.status(401).json({error:'unauthenticated'});
    if(role && req.session.user.role !== role && req.session.user.role !== 'admin') return res.status(403).json({error:'forbidden'});
    next();
  }
}

// POST create system
app.post('/api/v1/systems', (req,res)=>{
  const {company_id, name, description, domain} = req.body;
  const stmt = db.prepare('INSERT INTO systems (company_id,name,description,domain,created_at) VALUES (?,?,?,?,?)');
  const info = stmt.run(company_id || null, name || 'Untitled', description || '', domain || '', now());
  res.json({ok:true,id:info.lastInsertRowid});
});

// POST diagnostic (store)
app.post('/api/v1/diagnostics', (req,res)=>{
  const {system, answers, result, created_by} = req.body;
  // If system provided with name but not stored, create quick system entry
  let system_id = null;
  if(system && system.id) system_id = system.id;
  else if(system && system.name){
    const s = db.prepare('INSERT INTO systems (name,description,domain,created_at) VALUES (?,?,?,?)');
    const info = s.run(system.name, system.description||'', system.domain||'', now());
    system_id = info.lastInsertRowid;
  }
  const payload = JSON.stringify({system,answers,result});
  const stmt = db.prepare('INSERT INTO diagnostics (system_id,created_by,created_at,score,level,payload_json,report_url) VALUES (?,?,?,?,?,?,?)');
  const info = stmt.run(system_id, created_by||null, now(), result.score||null, result.level||null, payload, null);
  // log
  db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)').run('diagnostic','New diagnostic created', JSON.stringify({diagnostic_id: info.lastInsertRowid}), now());
  res.json({ok:true,id:info.lastInsertRowid, url:`/api/v1/diagnostics/${info.lastInsertRowid}`});
});

// Generate Documentation Technique (Annexe IV) PDF for a diagnostic
const PDFDocument = require('pdfkit');
app.post('/api/v1/diagnostics/:id/generate-dt', (req,res)=>{
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM diagnostics WHERE id=?').get(id);
  if(!row) return res.status(404).json({error:'not found'});
  let payload = {};
  try{ payload = JSON.parse(row.payload_json); }catch(e){ payload = {}; }

  const reportDir = path.join(UPLOADS,'reports');
  if(!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const filename = `diagnostic_dt_${id}_${Date.now()}.pdf`;
  const filepath = path.join(reportDir, filename);

  const doc = new PDFDocument({autoFirstPage:true, margin:40});
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Title
  doc.fontSize(16).text('Documentation Technique (Annexe IV) - RIA Check & Go', {align:'center'});
  doc.moveDown();

  // Metadata
  doc.fontSize(11).text(`Diagnostic ID: ${id}`);
  doc.text(`Généré le: ${new Date().toISOString()}`);
  if(row.system_id) doc.text(`System ID: ${row.system_id}`);
  doc.moveDown();

  // Summary results
  doc.fontSize(12).text('Résumé du diagnostic', {underline:true});
  doc.moveDown(0.3);
  doc.fontSize(11).text(`Niveau estimé: ${row.level || 'N/A'}`);
  if(row.score) doc.text(`Score: ${row.score}`);
  doc.moveDown();

  // Reasons / obligations from payload
  const result = payload.result || {};
  if(result.reasons && result.reasons.length){
    doc.fontSize(12).text('Motifs détectés', {underline:true});
    result.reasons.forEach(r=>{ doc.fontSize(11).text('- ' + r); });
    doc.moveDown();
  }
  if(result.obligations && result.obligations.length){
    doc.fontSize(12).text('Obligations principales', {underline:true});
    result.obligations.forEach(o=>{ doc.fontSize(11).text('- ' + o); });
    doc.moveDown();
  }

  // Include questionnaire answers if present
  if(payload.answers){
    doc.fontSize(12).text('Réponses au questionnaire', {underline:true});
    Object.keys(payload.answers).forEach(k=>{
      doc.fontSize(11).text(`${k}: ${payload.answers[k]}`);
    });
    doc.moveDown();
  }

  // Placeholder for Annex IV sections
  doc.addPage();
  doc.fontSize(13).text('Annexe IV - Documentation technique (extrait)', {underline:true});
  doc.moveDown(0.5);
  doc.fontSize(11).text('1. Description générale du SIA:');
  doc.fontSize(10).text(payload.system?.description || 'À renseigner par le fournisseur.');
  doc.moveDown(0.3);
  doc.fontSize(11).text('2. Finalité et domaine d\'utilisation:');
  doc.fontSize(10).text(payload.system?.domain || 'À renseigner.');
  doc.moveDown(0.3);
  doc.fontSize(11).text('3. Données utilisées (entrainement/validation/test):');
  doc.fontSize(10).text('Consigner les jeux de données, sources et rapports de biais.');
  doc.moveDown(0.3);
  doc.fontSize(11).text('4. Procédure d\'évaluation de conformité:');
  doc.fontSize(10).text('Décrire tests, métriques, résultats d\'audit.');

  doc.end();
  stream.on('finish', ()=>{
    // update diagnostic.report_url
    const publicPath = `/uploads/reports/${filename}`;
    db.prepare('UPDATE diagnostics SET report_url=? WHERE id=?').run(publicPath, id);
    db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)').run('report','Documentation Technique générée', JSON.stringify({diagnostic_id:id, path:publicPath}), now());
    res.json({ok:true, url:publicPath});
  });
});

// GET diagnostic
app.get('/api/v1/diagnostics/:id', (req,res)=>{
  const id = req.params.id;
  const row = db.prepare('SELECT * FROM diagnostics WHERE id=?').get(id);
  if(!row) return res.status(404).json({error:'not found'});
  // parse payload
  let payload = null;
  try{ payload = JSON.parse(row.payload_json); }catch(e){ payload = null; }
  res.json({id:row.id, system_id:row.system_id, created_at:row.created_at, score:row.score, level:row.level, payload, report_url:row.report_url});
});

// Admin endpoints (protected)
app.get('/api/v1/admin/diagnostics', requireAuth('user'), (req,res)=>{
  const rows = db.prepare('SELECT * FROM diagnostics ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});
app.get('/api/v1/admin/logs', requireAuth('user'), (req,res)=>{
  const rows = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});
app.get('/api/v1/admin/incidents', requireAuth('user'), (req,res)=>{
  const rows = db.prepare('SELECT * FROM incidents ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});

// Admin: User management (CRUD)
app.get('/api/v1/admin/users', requireAuth('admin'), (req,res)=>{
  const rows = db.prepare('SELECT id,name,email,role,created_at FROM users ORDER BY id ASC').all();
  res.json(rows);
});

app.post('/api/v1/admin/users', requireAuth('admin'), async (req,res)=>{
  const {name,email,password,role} = req.body;
  if(!email || !password) return res.status(400).json({error:'email+password required'});
  try{
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)');
    const info = stmt.run(name||'', email, hash, role||'user', now());
    res.json({ok:true,id:info.lastInsertRowid});
  }catch(e){ res.status(500).json({error:String(e)}); }
});

app.put('/api/v1/admin/users/:id', requireAuth('admin'), async (req,res)=>{
  const id = req.params.id;
  const {name,role,password} = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if(!user) return res.status(404).json({error:'not found'});
  let hash = user.password_hash;
  if(password){ hash = await bcrypt.hash(password,10); }
  const stmt = db.prepare('UPDATE users SET name=?, role=?, password_hash=? WHERE id=?');
  stmt.run(name||user.name, role||user.role, hash, id);
  res.json({ok:true});
});

app.delete('/api/v1/admin/users/:id', requireAuth('admin'), (req,res)=>{
  const id = req.params.id;
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ok:true});
});

// --- SGR (plans d'action / tâches) ---
app.get('/api/v1/sgr/plans', requireAuth('user'), (req, res) => {
  const plans = db.prepare('SELECT * FROM sgr_plans ORDER BY created_at DESC').all();
  res.json({ok:true, plans});
});

app.post('/api/v1/sgr/plans', requireAuth('user'), (req, res) => {
  const { title, description, system_id, due_date, diagnostic_id } = req.body;
  const owner_id = req.session.user ? req.session.user.id : null;
  const stmt = db.prepare('INSERT INTO sgr_plans (title, description, system_id, owner_id, due_date, diagnostic_id) VALUES (?,?,?,?,?,?)');
  const info = stmt.run(title, description || '', system_id || null, owner_id, due_date || null, diagnostic_id || null);
  const plan = db.prepare('SELECT * FROM sgr_plans WHERE id = ?').get(info.lastInsertRowid);
  db.prepare('INSERT INTO logs (type, message, meta_json, created_at) VALUES (?,?,?,?)').run('sgr_plan', `Plan created: ${plan.title}`, JSON.stringify(plan), now());
  res.json({ok:true, plan});
});

// List plans for a given diagnostic
app.get('/api/v1/diagnostics/:id/plans', requireAuth('user'), (req, res) => {
  const did = req.params.id;
  const plans = db.prepare('SELECT * FROM sgr_plans WHERE diagnostic_id = ? ORDER BY created_at DESC').all(did);
  res.json({ok:true, plans});
});

// Create a plan attached to a diagnostic
app.post('/api/v1/diagnostics/:id/plans', requireAuth('user'), (req, res) => {
  const did = req.params.id;
  const { title, description, due_date, system_id } = req.body;
  const owner_id = req.session.user ? req.session.user.id : null;
  const stmt = db.prepare('INSERT INTO sgr_plans (title, description, system_id, owner_id, due_date, diagnostic_id) VALUES (?,?,?,?,?,?)');
  const info = stmt.run(title, description||'', system_id||null, owner_id, due_date||null, did);
  const plan = db.prepare('SELECT * FROM sgr_plans WHERE id = ?').get(info.lastInsertRowid);
  db.prepare('INSERT INTO logs (type, message, meta_json, created_at) VALUES (?,?,?,?)').run('sgr_plan', `Plan created from diagnostic: ${plan.title}`, JSON.stringify(plan), now());
  res.json({ok:true, plan});
});

app.get('/api/v1/sgr/plans/:id', requireAuth('user'), (req, res) => {
  const id = req.params.id;
  const plan = db.prepare('SELECT * FROM sgr_plans WHERE id = ?').get(id);
  if(!plan) return res.status(404).json({ok:false, error:'not_found'});
  const tasks = db.prepare('SELECT * FROM sgr_tasks WHERE plan_id = ? ORDER BY created_at').all(id);
  res.json({ok:true, plan, tasks});
});

app.put('/api/v1/sgr/plans/:id', requireAuth('user'), (req, res) => {
  const id = req.params.id;
  const { title, description, status, due_date } = req.body;
  db.prepare('UPDATE sgr_plans SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ?').run(title, description, status, due_date, id);
  const plan = db.prepare('SELECT * FROM sgr_plans WHERE id = ?').get(id);
  db.prepare('INSERT INTO logs (type, message, meta_json, created_at) VALUES (?,?,?,?)').run('sgr_plan_update', `Plan updated: ${plan.title}`, JSON.stringify(plan), now());
  res.json({ok:true, plan});
});

app.delete('/api/v1/sgr/plans/:id', requireAuth('user'), (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM sgr_tasks WHERE plan_id = ?').run(id);
  db.prepare('DELETE FROM sgr_plans WHERE id = ?').run(id);
  db.prepare('INSERT INTO logs (type, message, meta_json, created_at) VALUES (?,?,?,?)').run('sgr_plan_delete', `Plan deleted: ${id}`, JSON.stringify({id}), now());
  res.json({ok:true});
});

// Tasks
app.post('/api/v1/sgr/plans/:id/tasks', requireAuth('user'), (req, res) => {
  const plan_id = req.params.id;
  const { title, description, assignee_id, status } = req.body;
  const stmt = db.prepare('INSERT INTO sgr_tasks (plan_id, title, description, assignee_id, status) VALUES (?,?,?,?,?)');
  const info = stmt.run(plan_id, title, description || '', assignee_id || null, status || 'todo');
  const task = db.prepare('SELECT * FROM sgr_tasks WHERE id = ?').get(info.lastInsertRowid);
  db.prepare('INSERT INTO logs (type, message, meta_json, created_at) VALUES (?,?,?,?)').run('sgr_task', `Task created: ${task.title}`, JSON.stringify(task), now());
  res.json({ok:true, task});
});

app.put('/api/v1/sgr/tasks/:id', requireAuth('user'), (req, res) => {
  const id = req.params.id;
  const { title, description, assignee_id, status, comments } = req.body;
  db.prepare('UPDATE sgr_tasks SET title=?, description=?, assignee_id=?, status=?, comments=? WHERE id=?').run(title, description, assignee_id, status, comments ? JSON.stringify(comments) : null, id);
  const task = db.prepare('SELECT * FROM sgr_tasks WHERE id = ?').get(id);
  db.prepare('INSERT INTO logs (type, message, meta_json, created_at) VALUES (?,?,?,?)').run('sgr_task_update', `Task updated: ${task.title}`, JSON.stringify(task), now());
  res.json({ok:true, task});
});

app.get('/api/v1/sgr/tasks', requireAuth('user'), (req, res) => {
  const assignee = req.query.assignee;
  let tasks;
  if(assignee){
    tasks = db.prepare('SELECT * FROM sgr_tasks WHERE assignee_id = ? ORDER BY created_at DESC').all(assignee);
  } else {
    tasks = db.prepare('SELECT * FROM sgr_tasks ORDER BY created_at DESC').all();
  }
  res.json({ok:true, tasks});
});

// POST contact
app.post('/api/v1/contact', (req,res)=>{
  const {company,email,message} = req.body;
  const stmt = db.prepare('INSERT INTO contacts (company,email,message,created_at) VALUES (?,?,?,?)');
  const info = stmt.run(company,email,message,now());
  db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)').run('contact','Contact form submitted', JSON.stringify({contact_id:info.lastInsertRowid}), now());
  res.json({ok:true,id:info.lastInsertRowid});
});

// POST dataset metadata
app.post('/api/v1/datasets', (req,res)=>{
  const {system_id,type,description,metadata} = req.body;
  const stmt = db.prepare('INSERT INTO datasets (system_id,type,description,metadata_json,created_at) VALUES (?,?,?,?,?)');
  const info = stmt.run(system_id||null,type||'train',description||'', JSON.stringify(metadata||{}), now());
  db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)').run('dataset','Dataset metadata added', JSON.stringify({dataset_id:info.lastInsertRowid}), now());
  res.json({ok:true,id:info.lastInsertRowid});
});

// Logs endpoints
app.post('/api/v1/logs', (req,res)=>{
  const {type,message,meta} = req.body;
  const stmt = db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)');
  const info = stmt.run(type||'info', message||'', JSON.stringify(meta||{}), now());
  res.json({ok:true,id:info.lastInsertRowid});
});
app.get('/api/v1/logs', (req,res)=>{
  const rows = db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});

// Registration (stub) for UC7
app.post('/api/v1/register', (req,res)=>{
  const {system_id,payload} = req.body;
  const stmt = db.prepare('INSERT INTO registrations (system_id,payload_json,status,created_at) VALUES (?,?,?,?)');
  const info = stmt.run(system_id||null, JSON.stringify(payload||{}), 'pending', now());
  db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)').run('registration','Registration requested', JSON.stringify({registration_id:info.lastInsertRowid}), now());
  res.json({ok:true,id:info.lastInsertRowid,status:'pending'});
});

// Incidents endpoints (basic)
app.post('/api/v1/incidents', (req,res)=>{
  const {system_id,title,description,severity} = req.body;
  const stmt = db.prepare('INSERT INTO incidents (system_id,title,description,severity,created_at) VALUES (?,?,?,?,?)');
  const info = stmt.run(system_id||null,title||'',description||'',severity||'medium', now());
  db.prepare('INSERT INTO logs (type,message,meta_json,created_at) VALUES (?,?,?,?)').run('incident','New incident created', JSON.stringify({incident_id:info.lastInsertRowid}), now());
  res.json({ok:true,id:info.lastInsertRowid});
});
app.get('/api/v1/incidents', (req,res)=>{
  const rows = db.prepare('SELECT * FROM incidents ORDER BY id DESC LIMIT 200').all();
  res.json(rows);
});

// Simple health
app.get('/api/health', (req,res)=>res.json({ok:true, time: now()}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`RIA Check backend listening on http://localhost:${PORT}`));
