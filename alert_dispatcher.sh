#!/bin/bash

PROMETHEUS_URL="http://localhost:9090"
LOG_FILE="alerts.log"
CHECK_INTERVAL=30

touch "$LOG_FILE"

fetch_alerts() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    response=$(curl -s "${PROMETHEUS_URL}/api/v1/alerts")
    
    if [ $? -ne 0 ]; then
        echo "[$timestamp] ERROR: Failed to connect to Prometheus" | tee -a "$LOG_FILE"
        return 1
    fi
    
    if command -v jq &> /dev/null; then
        firing_alerts=$(echo "$response" | jq -r '.data.alerts[] | select(.state=="firing")')
        
        if [ -z "$firing_alerts" ]; then
            echo "[$timestamp] No active alerts" | tee -a "$LOG_FILE"
        else
            echo "[$timestamp] ACTIVE ALERTS:" | tee -a "$LOG_FILE"
            echo "$response" | jq -r '.data.alerts[] | select(.state=="firing") | 
                "  Alert: \(.labels.alertname), State: \(.state), Active Since: \(.activeAt)"' | tee -a "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
        fi
    else
        alert_count=$(echo "$response" | grep -o '"state":"firing"' | wc -l)
        
        if [ "$alert_count" -eq 0 ]; then
            echo "[$timestamp] No active alerts" | tee -a "$LOG_FILE"
        else
            echo "[$timestamp] Found $alert_count firing alert(s)" | tee -a "$LOG_FILE"
            echo "$response" >> "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
        fi
    fi
}

while true; do
    fetch_alerts
    sleep "$CHECK_INTERVAL"
done
