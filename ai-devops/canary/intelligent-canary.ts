/**
 * Intelligent Canary Analysis System
 * AI-powered canary release decision making with automated rollout and rollback
 */

import { EventEmitter } from 'events';

export interface CanaryMetrics {
  timestamp: number;
  version: string;
  trafficPercentage: number;
  successRate: number;
  errorRate: number;
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  businessMetrics: {
    conversionRate: number;
    userSatisfaction: number;
    bounceRate: number;
    revenueImpact: number;
  };
  userFeedback: {
    positive: number;
    negative: number;
    neutral: number;
  };
  apdexScore: number;
  customMetrics: { [key: string]: number };
}

export interface CanaryDecision {
  action: 'CONTINUE' | 'PAUSE' | 'ROLLBACK' | 'ACCELERATE' | 'COMPLETE';
  confidence: number;
  reasoning: string[];
  nextTrafficPercentage?: number;
  waitDuration?: number;
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
}

export interface Issue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'PERFORMANCE' | 'ERRORS' | 'BUSINESS' | 'USER_EXPERIENCE' | 'INFRASTRUCTURE';
  description: string;
  impact: number; // 0-1 scale
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  threshold: number;
  actual: number;
}

export interface CanaryConfig {
  trafficSteps: number[];
  stepDuration: number; // minutes
  successThresholds: {
    errorRate: number;
    responseTime: number;
    successRate: number;
    apdexScore: number;
  };
  businessThresholds: {
    conversionRate: number;
    revenueImpact: number;
    userSatisfaction: number;
  };
  autoRollbackEnabled: boolean;
  maxDuration: number; // minutes
  requiredSampleSize: number;
}

export class IntelligentCanaryAnalyzer extends EventEmitter {
  private config: CanaryConfig;
  private currentCanary: string | null = null;
  private metricsHistory: Map<string, CanaryMetrics[]> = new Map();
  private baselineMetrics: CanaryMetrics | null = null;
  private decisionModel: any = null;
  private anomalyDetector: AnomalyDetector;

  constructor(config: CanaryConfig) {
    super();
    this.config = config;
    this.anomalyDetector = new AnomalyDetector();
    this.initializeDecisionModel();
  }

  /**
   * Initialize the AI decision model
   */
  private initializeDecisionModel(): void {
    this.decisionModel = {
      weights: {
        errorRate: 0.25,
        responseTime: 0.20,
        successRate: 0.20,
        businessMetrics: 0.15,
        userFeedback: 0.10,
        apdexScore: 0.10
      },
      thresholds: {
        rollback: 0.3,
        pause: 0.5,
        continue: 0.7,
        accelerate: 0.85
      }
    };

    console.log('🤖 Intelligent canary decision model initialized');
  }

  /**
   * Start a new canary deployment
   */
  public async startCanary(
    version: string, 
    initialTrafficPercentage: number = 5
  ): Promise<void> {
    if (this.currentCanary) {
      throw new Error('Another canary deployment is already in progress');
    }

    this.currentCanary = version;
    this.metricsHistory.set(version, []);

    // Establish baseline metrics from production
    await this.establishBaseline();

    // Initialize canary with minimal traffic
    await this.updateTrafficPercentage(initialTrafficPercentage);

    console.log(`🚀 Started canary deployment for version ${version} with ${initialTrafficPercentage}% traffic`);
    this.emit('canary-started', { version, initialTrafficPercentage });

    // Begin automated analysis cycle
    this.startAnalysisCycle();
  }

  /**
   * Establish baseline metrics from current production
   */
  private async establishBaseline(): Promise<void> {
    try {
      const response = await fetch('/api/metrics/production');
      this.baselineMetrics = await response.json();
      console.log('📊 Baseline metrics established');
    } catch (error) {
      console.warn('Could not establish baseline, using default values');
      this.baselineMetrics = this.getDefaultBaseline();
    }
  }

  /**
   * Start the automated analysis cycle
   */
  private startAnalysisCycle(): void {
    const interval = setInterval(async () => {
      if (!this.currentCanary) {
        clearInterval(interval);
        return;
      }

      try {
        const metrics = await this.collectMetrics();
        const decision = await this.analyzeMetrics(metrics);
        
        await this.executeDecision(decision);

        if (decision.action === 'COMPLETE' || decision.action === 'ROLLBACK') {
          clearInterval(interval);
          this.completeCanary(decision.action === 'COMPLETE');
        }
      } catch (error) {
        console.error('Error in canary analysis cycle:', error);
        await this.emergencyRollback('Analysis cycle error');
        clearInterval(interval);
      }
    }, 60000); // Analyze every minute
  }

  /**
   * Collect current canary metrics
   */
  private async collectMetrics(): Promise<CanaryMetrics> {
    const response = await fetch(`/api/metrics/canary/${this.currentCanary}`);
    const metrics: CanaryMetrics = await response.json();

    // Store metrics in history
    const history = this.metricsHistory.get(this.currentCanary!) || [];
    history.push(metrics);
    this.metricsHistory.set(this.currentCanary!, history);

    // Detect anomalies
    const anomalies = this.anomalyDetector.detect(metrics, history);
    if (anomalies.length > 0) {
      this.emit('anomalies-detected', { version: this.currentCanary, anomalies });
    }

    return metrics;
  }

  /**
   * Analyze metrics using AI decision model
   */
  public async analyzeMetrics(metrics: CanaryMetrics): Promise<CanaryDecision> {
    if (!this.baselineMetrics) {
      throw new Error('Baseline metrics not available');
    }

    // Calculate performance scores
    const performanceScore = this.calculatePerformanceScore(metrics);
    const businessScore = this.calculateBusinessScore(metrics);
    const userExperienceScore = this.calculateUserExperienceScore(metrics);
    const stabilityScore = this.calculateStabilityScore(metrics);

    // Weighted overall score
    const overallScore = 
      performanceScore * 0.3 +
      businessScore * 0.25 +
      userExperienceScore * 0.25 +
      stabilityScore * 0.2;

    // Identify issues
    const issues = this.identifyIssues(metrics);
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    const warnings = issues.filter(i => i.severity === 'HIGH' || i.severity === 'MEDIUM');

    // Generate decision
    const decision = await this.generateDecision(
      overallScore,
      metrics,
      criticalIssues,
      warnings
    );

    // Log decision for learning
    await this.logDecision(metrics, decision);

    return decision;
  }

  /**
   * Calculate performance score (0-1)
   */
  private calculatePerformanceScore(metrics: CanaryMetrics): number {
    if (!this.baselineMetrics) return 0.5;

    let score = 1.0;

    // Error rate comparison
    const errorRateIncrease = metrics.errorRate / this.baselineMetrics.errorRate;
    if (errorRateIncrease > 1.5) score -= 0.3;
    else if (errorRateIncrease > 1.2) score -= 0.1;

    // Response time comparison
    const responseTimeIncrease = metrics.responseTime.p95 / this.baselineMetrics.responseTime.p95;
    if (responseTimeIncrease > 1.5) score -= 0.3;
    else if (responseTimeIncrease > 1.2) score -= 0.1;

    // Success rate comparison
    const successRateDecrease = this.baselineMetrics.successRate - metrics.successRate;
    if (successRateDecrease > 5) score -= 0.3;
    else if (successRateDecrease > 2) score -= 0.1;

    // APDEX score
    if (metrics.apdexScore < 0.7) score -= 0.2;
    else if (metrics.apdexScore < 0.85) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate business impact score (0-1)
   */
  private calculateBusinessScore(metrics: CanaryMetrics): number {
    if (!this.baselineMetrics) return 0.5;

    let score = 1.0;

    // Conversion rate impact
    const conversionChange = (metrics.businessMetrics.conversionRate - 
                            this.baselineMetrics.businessMetrics.conversionRate) / 
                            this.baselineMetrics.businessMetrics.conversionRate;
    
    if (conversionChange < -0.1) score -= 0.4;
    else if (conversionChange < -0.05) score -= 0.2;
    else if (conversionChange > 0.05) score += 0.1;

    // Revenue impact
    if (metrics.businessMetrics.revenueImpact < -0.05) score -= 0.3;
    else if (metrics.businessMetrics.revenueImpact > 0.05) score += 0.1;

    // Bounce rate
    const bounceRateIncrease = metrics.businessMetrics.bounceRate / 
                              this.baselineMetrics.businessMetrics.bounceRate;
    if (bounceRateIncrease > 1.2) score -= 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate user experience score (0-1)
   */
  private calculateUserExperienceScore(metrics: CanaryMetrics): number {
    let score = 1.0;

    // User satisfaction
    if (metrics.businessMetrics.userSatisfaction < 3.5) score -= 0.3;
    else if (metrics.businessMetrics.userSatisfaction < 4.0) score -= 0.1;

    // User feedback sentiment
    const totalFeedback = metrics.userFeedback.positive + 
                         metrics.userFeedback.negative + 
                         metrics.userFeedback.neutral;
    
    if (totalFeedback > 10) {
      const negativeRatio = metrics.userFeedback.negative / totalFeedback;
      if (negativeRatio > 0.3) score -= 0.4;
      else if (negativeRatio > 0.15) score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate system stability score (0-1)
   */
  private calculateStabilityScore(metrics: CanaryMetrics): number {
    if (!this.baselineMetrics) return 0.5;

    let score = 1.0;

    // CPU usage
    const cpuIncrease = metrics.cpuUsage / this.baselineMetrics.cpuUsage;
    if (cpuIncrease > 1.5) score -= 0.2;
    else if (cpuIncrease > 1.3) score -= 0.1;

    // Memory usage
    const memoryIncrease = metrics.memoryUsage / this.baselineMetrics.memoryUsage;
    if (memoryIncrease > 1.5) score -= 0.2;
    else if (memoryIncrease > 1.3) score -= 0.1;

    // Network latency
    const latencyIncrease = metrics.networkLatency / this.baselineMetrics.networkLatency;
    if (latencyIncrease > 1.5) score -= 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Identify issues in current metrics
   */
  private identifyIssues(metrics: CanaryMetrics): Issue[] {
    const issues: Issue[] = [];

    // Critical error rate
    if (metrics.errorRate > this.config.successThresholds.errorRate * 2) {
      issues.push({
        severity: 'CRITICAL',
        category: 'ERRORS',
        description: `Error rate is ${metrics.errorRate.toFixed(2)}%, critically high`,
        impact: 0.9,
        trend: this.calculateTrend('errorRate', metrics.errorRate),
        threshold: this.config.successThresholds.errorRate,
        actual: metrics.errorRate
      });
    }

    // High response time
    if (metrics.responseTime.p95 > this.config.successThresholds.responseTime * 1.5) {
      issues.push({
        severity: 'HIGH',
        category: 'PERFORMANCE',
        description: `P95 response time is ${metrics.responseTime.p95}ms, exceeding threshold`,
        impact: 0.7,
        trend: this.calculateTrend('responseTime', metrics.responseTime.p95),
        threshold: this.config.successThresholds.responseTime,
        actual: metrics.responseTime.p95
      });
    }

    // Low success rate
    if (metrics.successRate < this.config.successThresholds.successRate) {
      issues.push({
        severity: 'HIGH',
        category: 'ERRORS',
        description: `Success rate is ${metrics.successRate.toFixed(1)}%, below threshold`,
        impact: 0.8,
        trend: this.calculateTrend('successRate', metrics.successRate),
        threshold: this.config.successThresholds.successRate,
        actual: metrics.successRate
      });
    }

    // Business metrics issues
    if (metrics.businessMetrics.conversionRate < this.config.businessThresholds.conversionRate) {
      issues.push({
        severity: 'MEDIUM',
        category: 'BUSINESS',
        description: 'Conversion rate below acceptable threshold',
        impact: 0.6,
        trend: this.calculateTrend('conversionRate', metrics.businessMetrics.conversionRate),
        threshold: this.config.businessThresholds.conversionRate,
        actual: metrics.businessMetrics.conversionRate
      });
    }

    return issues.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Generate decision based on analysis
   */
  private async generateDecision(
    overallScore: number,
    metrics: CanaryMetrics,
    criticalIssues: Issue[],
    warnings: Issue[]
  ): Promise<CanaryDecision> {
    const reasoning: string[] = [];
    let action: CanaryDecision['action'] = 'CONTINUE';
    let nextTrafficPercentage = metrics.trafficPercentage;
    let waitDuration = this.config.stepDuration;

    // Critical issues trigger immediate rollback
    if (criticalIssues.length > 0) {
      action = 'ROLLBACK';
      reasoning.push(`Critical issues detected: ${criticalIssues.map(i => i.description).join(', ')}`);
    }
    // Low overall score
    else if (overallScore < this.decisionModel.thresholds.rollback) {
      action = 'ROLLBACK';
      reasoning.push(`Overall score ${overallScore.toFixed(2)} below rollback threshold`);
    }
    // Moderate issues or score
    else if (overallScore < this.decisionModel.thresholds.pause || warnings.length > 2) {
      action = 'PAUSE';
      reasoning.push(`Pausing deployment due to warnings or moderate score (${overallScore.toFixed(2)})`);
      waitDuration = this.config.stepDuration * 2; // Wait longer
    }
    // Good performance - accelerate
    else if (overallScore > this.decisionModel.thresholds.accelerate && warnings.length === 0) {
      action = 'ACCELERATE';
      const nextStepIndex = this.config.trafficSteps.findIndex(step => step > metrics.trafficPercentage);
      if (nextStepIndex !== -1) {
        // Skip a step for acceleration
        const acceleratedIndex = Math.min(nextStepIndex + 1, this.config.trafficSteps.length - 1);
        nextTrafficPercentage = this.config.trafficSteps[acceleratedIndex];
        reasoning.push(`Excellent performance (${overallScore.toFixed(2)}), accelerating to ${nextTrafficPercentage}%`);
      }
    }
    // Standard progression
    else if (overallScore > this.decisionModel.thresholds.continue) {
      const nextStepIndex = this.config.trafficSteps.findIndex(step => step > metrics.trafficPercentage);
      if (nextStepIndex !== -1) {
        nextTrafficPercentage = this.config.trafficSteps[nextStepIndex];
        reasoning.push(`Good performance (${overallScore.toFixed(2)}), continuing to ${nextTrafficPercentage}%`);
      } else {
        action = 'COMPLETE';
        reasoning.push('All traffic steps completed successfully');
      }
    }

    // Check if we've reached 100% traffic
    if (nextTrafficPercentage >= 100 && action !== 'ROLLBACK') {
      action = 'COMPLETE';
      reasoning.push('Canary deployment completed successfully');
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(action, warnings, overallScore);

    return {
      action,
      confidence: this.calculateDecisionConfidence(overallScore, criticalIssues, warnings),
      reasoning,
      nextTrafficPercentage: action === 'CONTINUE' || action === 'ACCELERATE' ? nextTrafficPercentage : undefined,
      waitDuration,
      criticalIssues,
      warnings,
      recommendations
    };
  }

  /**
   * Execute the canary decision
   */
  private async executeDecision(decision: CanaryDecision): Promise<void> {
    console.log(`🎯 Canary decision: ${decision.action} (confidence: ${decision.confidence.toFixed(2)})`);
    
    this.emit('decision-made', { 
      version: this.currentCanary, 
      decision,
      timestamp: Date.now()
    });

    switch (decision.action) {
      case 'CONTINUE':
      case 'ACCELERATE':
        if (decision.nextTrafficPercentage) {
          await this.updateTrafficPercentage(decision.nextTrafficPercentage);
        }
        break;

      case 'PAUSE':
        console.log(`⏸️  Pausing canary for ${decision.waitDuration} minutes`);
        break;

      case 'ROLLBACK':
        await this.executeRollback(decision.reasoning.join('; '));
        break;

      case 'COMPLETE':
        await this.updateTrafficPercentage(100);
        break;
    }

    // Send notifications for critical decisions
    if (decision.action === 'ROLLBACK' || decision.criticalIssues.length > 0) {
      await this.sendAlert(decision);
    }
  }

  /**
   * Update traffic percentage for canary
   */
  private async updateTrafficPercentage(percentage: number): Promise<void> {
    try {
      await fetch(`/api/canary/${this.currentCanary}/traffic`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      });

      console.log(`📊 Updated canary traffic to ${percentage}%`);
      this.emit('traffic-updated', { version: this.currentCanary, percentage });
    } catch (error) {
      console.error('Failed to update traffic percentage:', error);
      throw error;
    }
  }

  /**
   * Execute rollback
   */
  private async executeRollback(reason: string): Promise<void> {
    try {
      await fetch(`/api/canary/${this.currentCanary}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      console.log(`🔄 Executed rollback for ${this.currentCanary}: ${reason}`);
      this.emit('rollback-executed', { version: this.currentCanary, reason });
    } catch (error) {
      console.error('Failed to execute rollback:', error);
      throw error;
    }
  }

  /**
   * Emergency rollback
   */
  private async emergencyRollback(reason: string): Promise<void> {
    console.error(`🚨 EMERGENCY ROLLBACK: ${reason}`);
    await this.executeRollback(`EMERGENCY: ${reason}`);
    await this.sendAlert({
      action: 'ROLLBACK',
      confidence: 1.0,
      reasoning: [`EMERGENCY ROLLBACK: ${reason}`],
      criticalIssues: [],
      warnings: [],
      recommendations: ['Investigate immediately', 'Check system health', 'Review logs']
    });
  }

  /**
   * Complete canary deployment
   */
  private completeCanary(success: boolean): void {
    const version = this.currentCanary!;
    this.currentCanary = null;

    if (success) {
      console.log(`✅ Canary deployment completed successfully for ${version}`);
      this.emit('canary-completed', { version, success: true });
    } else {
      console.log(`❌ Canary deployment failed for ${version}`);
      this.emit('canary-completed', { version, success: false });
    }
  }

  /**
   * Send alert for critical decisions
   */
  private async sendAlert(decision: CanaryDecision): Promise<void> {
    const alert = {
      severity: decision.action === 'ROLLBACK' ? 'CRITICAL' : 'WARNING',
      version: this.currentCanary,
      action: decision.action,
      reasoning: decision.reasoning,
      timestamp: Date.now()
    };

    try {
      await fetch('/api/alerts/canary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }

    this.emit('alert-sent', alert);
  }

  // Helper methods
  private calculateTrend(metric: string, currentValue: number): 'IMPROVING' | 'STABLE' | 'DEGRADING' {
    // Simplified trend calculation - in reality, would analyze historical data
    return Math.random() > 0.5 ? 'STABLE' : Math.random() > 0.5 ? 'IMPROVING' : 'DEGRADING';
  }

  private calculateDecisionConfidence(
    overallScore: number, 
    criticalIssues: Issue[], 
    warnings: Issue[]
  ): number {
    let confidence = 0.8;
    
    if (criticalIssues.length > 0) confidence = 0.95; // High confidence in rollback
    else if (warnings.length > 3) confidence = 0.75;
    else if (overallScore > 0.9) confidence = 0.95;
    else if (overallScore < 0.4) confidence = 0.9;
    
    return confidence;
  }

  private generateRecommendations(
    action: CanaryDecision['action'], 
    warnings: Issue[], 
    score: number
  ): string[] {
    const recommendations: string[] = [];

    switch (action) {
      case 'ROLLBACK':
        recommendations.push('Investigate root cause immediately');
        recommendations.push('Fix issues before next deployment attempt');
        recommendations.push('Review deployment process');
        break;

      case 'PAUSE':
        recommendations.push('Monitor metrics closely');
        recommendations.push('Consider manual intervention if issues persist');
        recommendations.push('Prepare rollback plan');
        break;

      case 'CONTINUE':
      case 'ACCELERATE':
        recommendations.push('Continue monitoring key metrics');
        recommendations.push('Prepare for next traffic increase');
        break;

      case 'COMPLETE':
        recommendations.push('Monitor production metrics for next 24 hours');
        recommendations.push('Document lessons learned');
        recommendations.push('Update baseline metrics');
        break;
    }

    if (warnings.length > 0) {
      recommendations.push('Address identified warnings when possible');
    }

    return recommendations;
  }

  private async logDecision(metrics: CanaryMetrics, decision: CanaryDecision): Promise<void> {
    const logEntry = {
      timestamp: Date.now(),
      version: this.currentCanary,
      metrics,
      decision,
      modelVersion: '1.0.0'
    };

    try {
      await fetch('/api/canary-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.warn('Failed to log decision:', error);
    }
  }

  private getDefaultBaseline(): CanaryMetrics {
    return {
      timestamp: Date.now(),
      version: 'baseline',
      trafficPercentage: 100,
      successRate: 99.5,
      errorRate: 0.5,
      responseTime: { p50: 100, p95: 200, p99: 300 },
      throughput: 1000,
      cpuUsage: 60,
      memoryUsage: 70,
      networkLatency: 50,
      businessMetrics: {
        conversionRate: 3.5,
        userSatisfaction: 4.2,
        bounceRate: 25,
        revenueImpact: 0
      },
      userFeedback: { positive: 80, negative: 10, neutral: 10 },
      apdexScore: 0.85,
      customMetrics: {}
    };
  }
}

/**
 * Anomaly Detection for Canary Metrics
 */
class AnomalyDetector {
  private readonly ANOMALY_THRESHOLD = 2; // Standard deviations

  detect(current: CanaryMetrics, history: CanaryMetrics[]): string[] {
    const anomalies: string[] = [];

    if (history.length < 3) return anomalies; // Need minimum history

    // Check for statistical anomalies
    const metrics = ['errorRate', 'responseTime.p95', 'successRate', 'cpuUsage', 'memoryUsage'];
    
    for (const metric of metrics) {
      const values = history.map(h => this.getNestedValue(h, metric));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
      
      const currentValue = this.getNestedValue(current, metric);
      const zScore = Math.abs((currentValue - mean) / stdDev);
      
      if (zScore > this.ANOMALY_THRESHOLD) {
        anomalies.push(`${metric}: ${currentValue} (z-score: ${zScore.toFixed(2)})`);
      }
    }

    return anomalies;
  }

  private getNestedValue(obj: any, path: string): number {
    return path.split('.').reduce((current, key) => current?.[key], obj) || 0;
  }
}

export default IntelligentCanaryAnalyzer;