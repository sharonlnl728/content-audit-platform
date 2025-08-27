export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'performance' | 'security' | 'business';
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  severity: Alert['severity'];
  category: Alert['category'];
  enabled: boolean;
  cooldown: number; // Cooldown time (milliseconds)
  lastTriggered?: Date;
}

export interface AlertConfig {
  maxAlerts: number;
  autoAcknowledge: boolean;
  notificationSound: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
}

class AlertService {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private config: AlertConfig;
  private listeners: Array<(alert: Alert) => void> = [];

  constructor() {
    this.config = {
      maxAlerts: 100,
      autoAcknowledge: false,
      notificationSound: true,
      emailNotifications: false,
      slackNotifications: false
    };

    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds threshold',
        condition: 'error_rate > threshold',
        threshold: 0.1, // 10%
        severity: 'high',
        category: 'performance',
        enabled: true,
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        description: 'Average response time exceeds threshold',
        condition: 'avg_response_time > threshold',
        threshold: 2000, // 2 seconds
        severity: 'medium',
        category: 'performance',
        enabled: true,
        cooldown: 600000 // 10 minutes
      },
      {
        id: 'queue-overflow',
        name: 'Queue Overflow',
        description: 'Processing queue length exceeds threshold',
        condition: 'queue_length > threshold',
        threshold: 1000,
        severity: 'critical',
        category: 'system',
        enabled: true,
        cooldown: 120000 // 2 minutes
      },
      {
        id: 'system-memory-high',
        name: 'High Memory Usage',
        description: 'System memory usage exceeds threshold',
        condition: 'memory_usage > threshold',
        threshold: 0.9, // 90%
        severity: 'medium',
        category: 'system',
        enabled: true,
        cooldown: 300000 // 5 minutes
      }
    ];
  }

  // Add alert
  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.unshift(newAlert);

    // Limit alert count
    if (this.alerts.length > this.config.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.config.maxAlerts);
    }

    // Trigger listeners
    this.listeners.forEach(listener => listener(newAlert));

    // Play notification sound
    if (this.config.notificationSound) {
      this.playNotificationSound();
    }

    return newAlert;
  }

  // Check metrics and trigger alerts
  checkMetrics(metrics: Record<string, number>): Alert[] {
    const triggeredAlerts: Alert[] = [];

    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown time
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown) {
        return;
      }

      let shouldTrigger = false;
      let actualValue = 0;

      // Check metrics based on rule conditions
      switch (rule.id) {
        case 'high-error-rate':
          actualValue = metrics.errorRate || 0;
          shouldTrigger = actualValue > rule.threshold;
          break;
        case 'slow-response-time':
          actualValue = metrics.avgResponseTime || 0;
          shouldTrigger = actualValue > rule.threshold;
          break;
        case 'queue-overflow':
          actualValue = metrics.queueLength || 0;
          shouldTrigger = actualValue > rule.threshold;
          break;
        case 'system-memory-high':
          actualValue = metrics.memoryUsage || 0;
          shouldTrigger = actualValue > rule.threshold;
          break;
      }

      if (shouldTrigger) {
        const alert = this.addAlert({
          type: rule.severity === 'critical' ? 'error' : 
                rule.severity === 'high' ? 'warning' : 'info',
          title: rule.name,
          message: `${rule.description}. Current value: ${actualValue}, Threshold: ${rule.threshold}`,
          severity: rule.severity,
          category: rule.category,
          metadata: { ruleId: rule.id, actualValue, threshold: rule.threshold }
        });

        triggeredAlerts.push(alert);
        rule.lastTriggered = new Date();
      }
    });

    return triggeredAlerts;
  }

  // Get all alerts
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  // Get unacknowledged alerts
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  // Clear acknowledged alerts
  clearAcknowledgedAlerts(): number {
    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => !alert.acknowledged);
    return initialCount - this.alerts.length;
  }

  // Add alert listener
  addListener(listener: (alert: Alert) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

      // Play notification sound
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Update configuration
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get configuration
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  // Get rules
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  // Update rules
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }
}

// Create global alert service instance
export const alertService = new AlertService();
export default AlertService;






