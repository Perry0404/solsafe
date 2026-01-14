import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://www.solsafe.network'],
  credentials: true
}));

app.use(express.json());

const VISITOR_FILE = path.join(__dirname, 'visitor-count.json');
const SESSIONS_FILE = path.join(__dirname, 'visitor-sessions.json');

interface VisitorData {
  totalVisitors: number;
  lastUpdated: string;
}

interface VisitorSession {
  sessionId: string;
  timestamp: number;
  userAgent: string;
  route: string;
}

function readVisitorData(): VisitorData {
  try {
    if (fs.existsSync(VISITOR_FILE)) {
      const data = fs.readFileSync(VISITOR_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading visitor data:', error);
  }
  return { totalVisitors: 783, lastUpdated: new Date().toISOString() };
}

function writeVisitorData(data: VisitorData): void {
  try {
    fs.writeFileSync(VISITOR_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing visitor data:', error);
  }
}

function readSessions(): VisitorSession[] {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading sessions:', error);
  }
  return [];
}

function writeSessions(sessions: VisitorSession[]): void {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('Error writing sessions:', error);
  }
}

// Middleware to track page visits
app.use((req, res, next) => {
  // Skip tracking for API health checks and OPTIONS requests
  if (req.path === '/api/health' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Log visitor
  const sessionId = req.headers['x-session-id'] as string || `session-${Date.now()}-${Math.random()}`;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const route = req.path;
  
  console.log(`Visitor: ${route} | Session: ${sessionId.substring(0, 20)}...`);
  
  next();
});

app.get('/api/visitors', (req, res) => {
  const data = readVisitorData();
  res.json({
    count: data.totalVisitors,
    lastUpdated: data.lastUpdated
  });
});

app.post('/api/visitors', (req, res) => {
  const data = readVisitorData();
  data.totalVisitors += 1;
  data.lastUpdated = new Date().toISOString();
  writeVisitorData(data);
  
  // Track session
  const sessions = readSessions();
  const newSession: VisitorSession = {
    sessionId: req.body.sessionId || `session-${Date.now()}`,
    timestamp: Date.now(),
    userAgent: req.headers['user-agent'] || 'Unknown',
    route: req.body.route || '/'
  };
  
  sessions.push(newSession);
  
  // Keep only last 1000 sessions
  if (sessions.length > 1000) {
    sessions.splice(0, sessions.length - 1000);
  }
  
  writeSessions(sessions);
  
  res.json({
    count: data.totalVisitors,
    lastUpdated: data.lastUpdated,
    message: 'Visitor tracked successfully'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get analytics data
app.get('/api/analytics', (req, res) => {
  const data = readVisitorData();
  const sessions = readSessions();
  
  // Get unique visitors in last 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter(s => s.timestamp > oneDayAgo);
  const uniqueVisitors = new Set(recentSessions.map(s => s.sessionId)).size;
  
  res.json({
    totalVisitors: data.totalVisitors,
    last24Hours: recentSessions.length,
    uniqueVisitors24h: uniqueVisitors,
    lastUpdated: data.lastUpdated
  });
});

app.listen(PORT, () => {
  console.log(`Visitor API server running on http://localhost:${PORT}`);
  console.log(`Initial visitor count: ${readVisitorData().totalVisitors}`);
  console.log(`Tracking middleware enabled`);
});
