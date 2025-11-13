# Observability & Monitoring Stack

A complete observability setup using Prometheus, Grafana, and Node Exporter to monitor a demo application with automated alerting.

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Demo App  │─────▶│  Prometheus  │─────▶│   Grafana   │
│ (Node.js)   │      │   (Metrics)  │      │ (Dashboard) │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │
      │              ┌───────▼────────┐
      │              │ Alert Rules    │
      │              │ - CPU > 70%    │
      │              │ - App Down     │
      │              └────────────────┘
      │
      ▼
┌─────────────┐
│ /metrics    │
│ Endpoint    │
└─────────────┘
```

## 📦 Components

- **Demo App**: Node.js/Express app exposing Prometheus metrics
- **Prometheus**: Metrics collection and alerting
- **Node Exporter**: System-level metrics
- **Grafana**: Metrics visualization and dashboards
- **Alert Dispatcher**: Bash script for alert logging

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Port 3000, 3001, 9090, 9100 available

### 1. Start the Stack

```bash
docker-compose up -d
```

### 2. Access Services

- **Demo App**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Node Exporter**: http://localhost:9100

### 3. Run Alert Dispatcher (Optional)

```bash
chmod +x alert_dispatcher.sh
./alert_dispatcher.sh
```

## 🎯 Testing Alerts

### Trigger High CPU Alert

```bash
curl http://localhost:3000/stress
```

This sets CPU to 85% (above 70% threshold). Within 10-15 seconds, you'll see:
- Alert in Prometheus: http://localhost:9090/alerts
- Alert in Grafana dashboard
- Alert logged by `alert_dispatcher.sh`

### Make App Unhealthy

```bash
curl http://localhost:3000/unhealthy
```

### Reset to Normal

```bash
curl http://localhost:3000/normal
```

### Custom Values

```bash
# Set CPU to 50%
curl http://localhost:3000/set-cpu/50

# Set Memory to 600MB
curl http://localhost:3000/set-memory/600
```

## 📊 Demo App Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | API documentation |
| `/metrics` | Prometheus metrics |
| `/health` | Health check |
| `/stress` | Simulate CPU spike (85%) |
| `/unhealthy` | Mark app as unhealthy |
| `/normal` | Reset to normal state |
| `/set-cpu/:value` | Set CPU % (0-100) |
| `/set-memory/:value` | Set memory in MB |

## 📈 Metrics Exposed

- `app_cpu_usage_percent` - CPU usage percentage
- `app_memory_usage_bytes` - Memory usage in bytes
- `app_health_status` - Health status (1=healthy, 0=unhealthy)
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram

## 🚨 Alert Rules

### HighCPUUsage
- **Condition**: CPU > 70%
- **Duration**: 10 seconds
- **Severity**: Warning

### ApplicationUnhealthy
- **Condition**: Health status = 0
- **Duration**: 10 seconds
- **Severity**: Critical

### ApplicationDown
- **Condition**: App not responding
- **Duration**: 30 seconds
- **Severity**: Critical

### HighMemoryUsage
- **Condition**: Memory > 500MB
- **Duration**: 10 seconds
- **Severity**: Warning

## 🛠️ Project Structure

```
observability-monitoring-stack/
├── app/
│   ├── server.js           # Demo application
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # App container image
├── prometheus/
│   ├── prometheus.yml      # Prometheus config
│   └── alert.rules.yml     # Alert definitions
├── grafana/
│   ├── provisioning/       # Auto-provisioning configs
│   └── dashboards/
│       └── grafana-dashboard.json
├── docker-compose.yml      # Docker Compose configuration
├── alert_dispatcher.sh     # Alert logging script
└── README.md
```

## 🧹 Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v
```
# ci-cd-dev-demo
