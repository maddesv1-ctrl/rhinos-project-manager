const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Datenbank initialisieren
const db = new Database('rhinos.db');

// Tabellen erstellen
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    assigned_to TEXT,
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

// API Routes

// Projekte
app.get('/api/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
  const result = stmt.run(name, description);
  res.json({ id: result.lastInsertRowid, name, description });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  const stmt = db.prepare('UPDATE projects SET name = ?, description = ?, status = ? WHERE id = ?');
  stmt.run(name, description, status, id);
  res.json({ id, name, description, status });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ success: true });
});

// Tasks
app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    ORDER BY t.created_at DESC
  `).all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { project_id, title, description, assigned_to, due_date } = req.body;
  const stmt = db.prepare('INSERT INTO tasks (project_id, title, description, assigned_to, due_date) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(project_id, title, description, assigned_to, due_date);
  res.json({ id: result.lastInsertRowid, project_id, title, description, assigned_to, due_date });
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, assigned_to, due_date } = req.body;
  const stmt = db.prepare('UPDATE tasks SET title = ?, description = ?, status = ?, assigned_to = ?, due_date = ? WHERE id = ?');
  stmt.run(title, description, status, assigned_to, due_date, id);
  res.json({ id, title, description, status, assigned_to, due_date });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ success: true });
});

// Server starten
app.listen(PORT, () => {
  console.log(`🦏 Rhinos Project Manager läuft auf http://localhost:${PORT}`);
});
