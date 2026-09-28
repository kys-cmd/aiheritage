import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'data', 'contest_db.json');

app.use(express.json({ limit: '50mb' }));

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Digital Heritage Contest Platform',
    timestamp: new Date().toISOString(),
  });
});

// Contest Data persistent API
app.get('/api/contest-data', (req, res) => {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(content);
    } else {
      res.json({ judges: [], submissions: [], evaluations: [] });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contest-data', (req, res) => {
  try {
    let existing: any = {};
    if (fs.existsSync(dbPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      } catch {}
    }
    const merged = { ...existing, ...req.body };
    fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf-8');
    res.json({ success: true, data: merged });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Production static file serving
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Contest Platform Server listening on port ${PORT}`);
});
