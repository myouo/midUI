import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import testCasesRouter from './src/routes/test-cases.js';
import configRouter from './src/routes/config.js';
import testExecutionRouter from './src/routes/test-execution.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.use('/api/test-cases', testCasesRouter);
app.use('/api/config', configRouter);
app.use('/api/test-cases', testExecutionRouter);

app.use('/reports', express.static(path.join(__dirname, '../reports')));
app.use('/midscene-reports', express.static(path.join(__dirname, 'midscene_run/report'), {
  index: ['index.html']
}));

app.get('/api/midscene/latest-report', (req, res) => {
  const reportDir = path.join(__dirname, 'midscene_run/report');
  const files = fs.readdirSync(reportDir)
    .filter(f => f.endsWith('.html'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    res.json({ reportUrl: `/midscene-reports/${files[0]}` });
  } else {
    res.status(404).json({ error: 'No report found' });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
