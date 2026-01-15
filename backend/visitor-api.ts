import express from 'express';
import cors from 'cors';
import { put, head } from '@vercel/blob';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://www.solsafe.network', 'https://solsafe.network'],
  credentials: true
}));

app.use(express.json());

interface VisitorData {
  totalVisitors: number;
  lastUpdated: string;
  sessions: VisitorSession[];
}

interface VisitorSession {
  sessionId: string;
  timestamp: number;
  userAgent: string;
  route: string;
}

const BLOB_URL = 'visitor-data.json';

// In-memory cache for faster reads (refreshed from blob on cold start)
let dataCache: VisitorData = {
  totalVisitors: 783,
  lastUpdated: new Date().toISOString(),
  sessions: []
};

// Read data from blob or use cached version
async function getData(): Promise<VisitorData> {
  try {
    // In production (Vercel), try to fetch from blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blobHead = await head(BLOB_URL).catch(() => null);
      if (blobHead) {
        const response = await fetch(blobHead.url);
        const data = await response.json();
        dataCache = data;
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading from blob:', error);
  }
  return dataCache;
}

// Write data to blob
async function saveData(data: VisitorData): Promise<void> {
  try {
    dataCache = data;
    
    // In production, save to blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(BLOB_URL, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json'
      });
    }
  } catch (error) {
    console.error('Error saving to blob:', error);
  }
}

// API endpoint to track visitors
app.post('/api/visitors', async (req, res) => {
  try {
    const { sessionId, route } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const data = await getData();
    data.totalVisitors += 1;
    data.lastUpdated = new Date().toISOString();
    
    const session: VisitorSession = {
      sessionId,
      timestamp: Date.now(),
      userAgent: req.headers['user-agent'] || 'Unknown',
      route: route || '/'
    };

    data.sessions.unshift(session);
    
    // Keep only last 1000 sessions
    if (data.sessions.length > 1000) {
      data.sessions = data.sessions.slice(0, 1000);
    }

    await saveData(data);

    res.json({
      count: data.totalVisitors,
      lastUpdated: data.lastUpdated,
      message: 'Visitor tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ error: 'Failed to track visitor' });
  }
});

// API endpoint to get visitor count
app.get('/api/visitors', async (req, res) => {
  try {
    const data = await getData();
    res.json({
      totalVisitors: data.totalVisitors,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('Error getting visitor data:', error);
    res.status(500).json({ error: 'Failed to get visitor data' });
  }
});

// API endpoint to get sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const data = await getData();
    res.json({ sessions: data.sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Dashboard HTML endpoint
app.get('/dashboard', async (req, res) => {
  try {
    const data = await getData();
    
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentSessions = data.sessions.filter(s => s.timestamp > oneDayAgo);
    const recentCount = recentSessions.length;
    const uniqueVisitors = new Set(recentSessions.map(s => s.sessionId)).size;

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SolSafe Analytics Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #8a2be2, #da70d6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header p {
      color: #9e9e9e;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(138, 43, 226, 0.1);
      border: 1px solid rgba(138, 43, 226, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      transition: transform 0.3s ease;
    }
    .stat-card:hover {
      transform: translateY(-5px);
      border-color: rgba(138, 43, 226, 0.6);
    }
    .stat-value {
      font-size: 3rem;
      font-weight: 800;
      color: #8a2be2;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      color: #9e9e9e;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sessions-table {
      background: rgba(138, 43, 226, 0.05);
      border: 1px solid rgba(138, 43, 226, 0.2);
      border-radius: 12px;
      padding: 2rem;
      overflow-x: auto;
    }
    .sessions-table h2 {
      margin-bottom: 1.5rem;
      color: #da70d6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(138, 43, 226, 0.2);
    }
    th {
      color: #8a2be2;
      font-weight: 600;
    }
    td {
      color: #ccc;
      font-size: 0.9rem;
    }
    tr:hover {
      background: rgba(138, 43, 226, 0.1);
    }
    .refresh-btn {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #8a2be2, #da70d6);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .refresh-btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 SolSafe Analytics Dashboard</h1>
      <p>Real-time visitor tracking and analytics</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${data.totalVisitors}</div>
        <div class="stat-label">Total Visitors</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${recentCount}</div>
        <div class="stat-label">Visits (24h)</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${uniqueVisitors}</div>
        <div class="stat-label">Unique Visitors (24h)</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">${data.sessions.length}</div>
        <div class="stat-label">Total Sessions</div>
      </div>
    </div>

    <div class="sessions-table">
      <h2>📊 Recent Sessions (Last 50)</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Route</th>
            <th>Session ID</th>
            <th>User Agent</th>
          </tr>
        </thead>
        <tbody>
          ${data.sessions.slice(0, 50).map(session => `
            <tr>
              <td>${new Date(session.timestamp).toLocaleString()}</td>
              <td>${session.route}</td>
              <td>${session.sessionId.substring(0, 20)}...</td>
              <td>${session.userAgent.substring(0, 70)}...</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <a href="/dashboard" class="refresh-btn">🔄 Refresh Dashboard</a>
    </div>
  </div>

  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => {
      window.location.reload();
    }, 30000);
  </script>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Only listen if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`Visitor API server running on http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
    const data = await getData();
    console.log(`Initial visitor count: ${data.totalVisitors}`);
    console.log(`Tracking middleware enabled`);
  });
}

// Export for Vercel serverless deployment
export default app;
