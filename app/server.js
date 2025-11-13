const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = 3000;

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const cpuUsageGauge = new client.Gauge({
  name: 'app_cpu_usage_percent',
  help: 'Current CPU usage percentage',
  registers: [register]
});

const memoryUsageGauge = new client.Gauge({
  name: 'app_memory_usage_bytes',
  help: 'Current memory usage in bytes',
  registers: [register]
});

const healthStatusGauge = new client.Gauge({
  name: 'app_health_status',
  help: 'Application health status (1 = healthy, 0 = unhealthy)',
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// State variables for simulating metrics
let isHealthy = true;
let simulatedCPU = 25; // Default 25%
let simulatedMemory = 100 * 1024 * 1024; // Default 100MB

// Update metrics periodically
setInterval(() => {
  cpuUsageGauge.set(simulatedCPU);
  memoryUsageGauge.set(simulatedMemory);
  healthStatusGauge.set(isHealthy ? 1 : 0);
}, 1000);

// Middleware to track request duration and count
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
});

// Routes

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  if (isHealthy) {
    res.status(200).json({ status: 'healthy', cpu: simulatedCPU, memory: simulatedMemory });
  } else {
    res.status(503).json({ status: 'unhealthy', cpu: simulatedCPU, memory: simulatedMemory });
  }
});

// Simulate high CPU usage (triggers alert)
app.get('/stress', (req, res) => {
  simulatedCPU = 85; // Set CPU to 85% (above 70% threshold)
  res.json({ 
    message: 'High CPU load simulated', 
    cpu: simulatedCPU,
    alert: 'CPU usage above 70% threshold - alert should trigger!'
  });
});

// Reset to normal state
app.get('/normal', (req, res) => {
  simulatedCPU = 25;
  simulatedMemory = 100 * 1024 * 1024;
  isHealthy = true;
  res.json({ 
    message: 'Reset to normal state', 
    cpu: simulatedCPU, 
    memory: simulatedMemory,
    healthy: isHealthy
  });
});

// Make app unhealthy
app.get('/unhealthy', (req, res) => {
  isHealthy = false;
  res.json({ 
    message: 'App marked as unhealthy - alert should trigger!',
    healthy: isHealthy
  });
});

// Manually set CPU percentage
app.get('/set-cpu/:value', (req, res) => {
  const value = parseFloat(req.params.value);
  if (isNaN(value) || value < 0 || value > 100) {
    return res.status(400).json({ error: 'CPU value must be between 0 and 100' });
  }
  simulatedCPU = value;
  res.json({ message: 'CPU usage updated', cpu: simulatedCPU });
});

// Manually set memory (in MB)
app.get('/set-memory/:value', (req, res) => {
  const value = parseFloat(req.params.value);
  if (isNaN(value) || value < 0) {
    return res.status(400).json({ error: 'Memory value must be positive' });
  }
  simulatedMemory = value * 1024 * 1024; // Convert MB to bytes
  res.json({ message: 'Memory usage updated', memory_mb: value });
});

// Home page with instructions
app.get('/', (req, res) => {
  res.json({
    message: 'Observability Demo App',
    endpoints: {
      '/metrics': 'Prometheus metrics endpoint',
      '/health': 'Health check',
      '/stress': 'Simulate high CPU (85%)',
      '/normal': 'Reset to normal state',
      '/unhealthy': 'Mark app as unhealthy',
      '/set-cpu/:value': 'Set CPU usage (0-100)',
      '/set-memory/:value': 'Set memory usage in MB'
    },
    current_state: {
      cpu: simulatedCPU,
      memory_mb: Math.round(simulatedMemory / 1024 / 1024),
      healthy: isHealthy
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Demo app running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Metrics available at http://0.0.0.0:${PORT}/metrics`);
  console.log(`❤️  Health check at http://0.0.0.0:${PORT}/health`);
});
