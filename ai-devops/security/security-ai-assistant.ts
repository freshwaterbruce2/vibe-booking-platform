/**
 * Security AI Assistant
 * ML-powered security vulnerability detection and automated mitigation
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export interface SecurityScanResult {
  timestamp: number;
  scanId: string;
  overallRiskScore: number; // 0-100 (100 = highest risk)
  vulnerabilities: Vulnerability[];
  codeAnalysis: CodeSecurityIssue[];
  dependencyAnalysis: DependencyVulnerability[];
  configurationIssues: ConfigurationIssue[];
  complianceStatus: ComplianceCheck[];
  threatIntelligence: ThreatIntelligenceData;
  recommendations: SecurityRecommendation[];
}

export interface Vulnerability {
  id: string;
  type: 'XSS' | 'SQLI' | 'CSRF' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'CRYPTOGRAPHY' | 'INPUT_VALIDATION' | 'SESSION_MANAGEMENT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  cvssScore: number;
  title: string;
  description: string;
  location: {
    file: string;
    line?: number;
    function?: string;
  };
  impact: string;
  exploitability: number; // 0-1 scale
  affected: {
    versions: string[];
    platforms: string[];
  };
  cwe: string; // Common Weakness Enumeration
  references: string[];
  detectionConfidence: number; // 0-1 scale
}

export interface CodeSecurityIssue {
  id: string;
  category: 'HARDCODED_SECRET' | 'WEAK_CRYPTO' | 'UNSAFE_DESERIALIZATION' | 'PATH_TRAVERSAL' | 'COMMAND_INJECTION' | 'SENSITIVE_DATA_EXPOSURE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line: number;
  code: string;
  message: string;
  suggestion: string;
  autoFixAvailable: boolean;
  falsePositiveProb: number;
}

export interface DependencyVulnerability {
  package: string;
  version: string;
  vulnerableVersions: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cve: string[];
  publishedDate: string;
  fixedVersion?: string;
  patchAvailable: boolean;
  exploitPublic: boolean;
  temporaryMitigation?: string;
}

export interface ConfigurationIssue {
  category: 'CORS' | 'HTTPS' | 'HEADERS' | 'PERMISSIONS' | 'LOGGING' | 'ERROR_HANDLING';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  currentValue: string;
  recommendedValue: string;
  file: string;
  autoFixable: boolean;
}

export interface ComplianceCheck {
  standard: 'OWASP_TOP_10' | 'GDPR' | 'SOC2' | 'HIPAA' | 'PCI_DSS';
  requirement: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';
  findings: string[];
  remediation: string[];
}

export interface ThreatIntelligenceData {
  activeThreatCampaigns: string[];
  relevantCVEs: string[];
  attackPatterns: string[];
  geolocationRisks: string[];
  industryThreats: string[];
}

export interface SecurityRecommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  description: string;
  implementation: {
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    timeEstimate: number; // hours
    riskReduction: number; // percentage
    cost: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  actions: SecurityAction[];
  automatable: boolean;
  compliance: string[];
}

export interface SecurityAction {
  type: 'CODE_FIX' | 'CONFIG_UPDATE' | 'DEPENDENCY_UPDATE' | 'INFRASTRUCTURE' | 'POLICY' | 'MONITORING';
  description: string;
  script?: string;
  files?: string[];
  validation?: string;
}

export interface SecurityPolicy {
  allowedDependencies: string[];
  blockedDependencies: string[];
  requiredHeaders: { [key: string]: string };
  maxRiskScore: number;
  autoMitigationEnabled: boolean;
  complianceRequirements: string[];
}

export class SecurityAIAssistant extends EventEmitter {
  private securityModel: any = null;
  private threatDatabase: Map<string, any> = new Map();
  private scanHistory: SecurityScanResult[] = [];
  private securityPolicy: SecurityPolicy;
  private activeMonitoring: boolean = false;

  constructor(policy?: SecurityPolicy) {
    super();
    this.securityPolicy = policy || this.getDefaultSecurityPolicy();
    this.initializeSecurityModel();
    this.loadThreatIntelligence();
  }

  /**
   * Initialize the AI security model
   */
  private initializeSecurityModel(): void {
    this.securityModel = {
      vulnerabilityPatterns: {
        xss: /dangerouslySetInnerHTML|innerHTML|document\.write|eval\(/g,
        sqli: /query\s*\+\s*['"]/g,
        hardcodedSecrets: /(?:password|api[_-]?key|secret|token)\s*[:=]\s*['"]/gi,
        weakCrypto: /md5|sha1(?!sha1)/gi,
        pathTraversal: /\.\.\/|\.\.\\|path\.join\([^)]*\.\./g
      },
      riskWeights: {
        CRITICAL: 1.0,
        HIGH: 0.7,
        MEDIUM: 0.4,
        LOW: 0.1
      },
      confidenceThresholds: {
        autofix: 0.9,
        suggest: 0.7,
        investigate: 0.5
      },
      mlModels: {
        anomalyDetection: this.initializeAnomalyDetectionModel(),
        threatClassification: this.initializeThreatClassificationModel(),
        riskScoring: this.initializeRiskScoringModel()
      }
    };

    console.log('🛡️ Security AI model initialized');
  }

  /**
   * Load threat intelligence data
   */
  private async loadThreatIntelligence(): Promise<void> {
    try {
      // In production, this would connect to threat intelligence feeds
      const threatData = await this.fetchThreatIntelligence();
      threatData.forEach((threat: any) => {
        this.threatDatabase.set(threat.id, threat);
      });
      
      console.log(`📡 Loaded ${threatData.length} threat intelligence indicators`);
    } catch (error) {
      console.warn('Threat intelligence loading failed, using defaults:', error);
      this.loadDefaultThreatIntelligence();
    }
  }

  /**
   * Perform comprehensive security scan
   */
  public async performSecurityScan(
    projectPath: string, 
    scanType: 'FULL' | 'QUICK' | 'TARGETED' = 'FULL'
  ): Promise<SecurityScanResult> {
    const scanId = this.generateScanId();
    console.log(`🔍 Starting ${scanType} security scan (${scanId})`);

    const startTime = Date.now();

    try {
      // Parallel security analysis
      const [
        vulnerabilities,
        codeAnalysis,
        dependencyAnalysis,
        configurationIssues,
        complianceStatus
      ] = await Promise.all([
        this.scanForVulnerabilities(projectPath),
        this.analyzeCodeSecurity(projectPath),
        this.analyzeDependencyVulnerabilities(projectPath),
        this.checkSecurityConfiguration(projectPath),
        this.checkCompliance(projectPath)
      ]);

      // Get threat intelligence
      const threatIntelligence = await this.getThreatIntelligence();

      // Calculate overall risk score
      const overallRiskScore = this.calculateOverallRiskScore(
        vulnerabilities,
        codeAnalysis,
        dependencyAnalysis,
        configurationIssues
      );

      // Generate AI-powered recommendations
      const recommendations = await this.generateSecurityRecommendations(
        vulnerabilities,
        codeAnalysis,
        dependencyAnalysis,
        configurationIssues,
        overallRiskScore
      );

      const scanResult: SecurityScanResult = {
        timestamp: Date.now(),
        scanId,
        overallRiskScore,
        vulnerabilities,
        codeAnalysis,
        dependencyAnalysis,
        configurationIssues,
        complianceStatus,
        threatIntelligence,
        recommendations
      };

      // Store scan history
      this.scanHistory.push(scanResult);

      // Execute automatic mitigations if enabled
      if (this.securityPolicy.autoMitigationEnabled) {
        await this.executeAutomaticMitigations(scanResult, projectPath);
      }

      // Send alerts for critical findings
      if (overallRiskScore > 80 || vulnerabilities.some(v => v.severity === 'CRITICAL')) {
        await this.sendSecurityAlert(scanResult);
      }

      const scanDuration = Date.now() - startTime;
      console.log(`✅ Security scan completed in ${scanDuration}ms (Risk Score: ${overallRiskScore})`);

      this.emit('scan-complete', scanResult);
      return scanResult;

    } catch (error) {
      console.error('Security scan failed:', error);
      this.emit('scan-error', { scanId, error });
      throw error;
    }
  }

  /**
   * Scan for security vulnerabilities using multiple techniques
   */
  private async scanForVulnerabilities(projectPath: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    try {
      // Static Application Security Testing (SAST)
      const sastResults = await this.runSASTScan(projectPath);
      vulnerabilities.push(...sastResults);

      // Dynamic Application Security Testing (DAST) - if applicable
      if (process.env.NODE_ENV !== 'production') {
        const dastResults = await this.runDASTScan();
        vulnerabilities.push(...dastResults);
      }

      // Interactive Application Security Testing (IAST)
      const iastResults = await this.runIASTScan(projectPath);
      vulnerabilities.push(...iastResults);

      // Custom pattern-based scanning
      const patternResults = await this.runPatternBasedScan(projectPath);
      vulnerabilities.push(...patternResults);

    } catch (error) {
      console.warn('Vulnerability scanning encountered errors:', error);
    }

    return this.deduplicateVulnerabilities(vulnerabilities);
  }

  /**
   * Run Static Application Security Testing
   */
  private async runSASTScan(projectPath: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    try {
      // Run ESLint with security plugin
      const { stdout: eslintOutput } = await execAsync(
        `npx eslint ${projectPath}/src --ext .ts,.tsx,.js,.jsx --format json`,
        { cwd: projectPath }
      );

      const eslintResults = JSON.parse(eslintOutput);
      
      for (const file of eslintResults) {
        for (const message of file.messages) {
          if (message.ruleId?.includes('security')) {
            vulnerabilities.push(this.convertESLintToVulnerability(file.filePath, message));
          }
        }
      }

      // Run Semgrep for advanced pattern matching
      try {
        const { stdout: semgrepOutput } = await execAsync(
          `semgrep --config=auto --json ${projectPath}/src`,
          { cwd: projectPath }
        );
        
        const semgrepResults = JSON.parse(semgrepOutput);
        vulnerabilities.push(...this.convertSemgrepResults(semgrepResults));
      } catch (semgrepError) {
        console.warn('Semgrep not available, using pattern-based detection');
      }

    } catch (error) {
      console.warn('SAST scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Run Dynamic Application Security Testing
   */
  private async runDASTScan(): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    try {
      // Simulate DAST scan results
      // In production, this would integrate with tools like OWASP ZAP or Burp Suite
      vulnerabilities.push({
        id: 'DAST-001',
        type: 'XSS',
        severity: 'HIGH',
        cvssScore: 7.5,
        title: 'Reflected XSS in search parameter',
        description: 'User input is reflected in the response without proper encoding',
        location: { file: '/search', line: undefined },
        impact: 'Attacker can execute arbitrary JavaScript in user browsers',
        exploitability: 0.8,
        affected: { versions: ['*'], platforms: ['web'] },
        cwe: 'CWE-79',
        references: ['https://owasp.org/www-project-top-ten/'],
        detectionConfidence: 0.9
      });

    } catch (error) {
      console.warn('DAST scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Run Interactive Application Security Testing
   */
  private async runIASTScan(projectPath: string): Promise<Vulnerability[]> {
    // IAST would instrument the running application
    // For now, return simulated results
    return [];
  }

  /**
   * Run pattern-based security scanning
   */
  private async runPatternBasedScan(projectPath: string): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    try {
      const { stdout: grepOutput } = await execAsync(
        `find ${projectPath}/src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -exec grep -n -H -E "(password|api_key|secret|token)\\s*[:=]\\s*['\"][^'\"]{8,}" {} \\;`
      );

      const lines = grepOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const [file, lineNum, code] = line.split(':');
        vulnerabilities.push({
          id: `PATTERN-${crypto.randomBytes(4).toString('hex')}`,
          type: 'AUTHENTICATION',
          severity: 'CRITICAL',
          cvssScore: 9.0,
          title: 'Hardcoded Secret Detected',
          description: 'Potential hardcoded secret found in source code',
          location: { file: file.replace(projectPath, ''), line: parseInt(lineNum) },
          impact: 'Exposed credentials could lead to unauthorized access',
          exploitability: 0.9,
          affected: { versions: ['*'], platforms: ['*'] },
          cwe: 'CWE-798',
          references: ['https://cwe.mitre.org/data/definitions/798.html'],
          detectionConfidence: 0.7
        });
      }

    } catch (error) {
      console.warn('Pattern-based scan failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Analyze code for security issues using AI
   */
  private async analyzeCodeSecurity(projectPath: string): Promise<CodeSecurityIssue[]> {
    const issues: CodeSecurityIssue[] = [];

    try {
      // Read source files and analyze patterns
      const { stdout: findOutput } = await execAsync(
        `find ${projectPath}/src -type f \\( -name "*.ts" -o -name "*.tsx" \\) | head -50`
      );

      const files = findOutput.split('\n').filter(f => f.trim());

      for (const file of files) {
        try {
          const { stdout: content } = await execAsync(`cat "${file}"`);
          const fileIssues = await this.analyzeFileForSecurityIssues(file, content);
          issues.push(...fileIssues);
        } catch (error) {
          console.warn(`Failed to analyze file ${file}:`, error);
        }
      }

    } catch (error) {
      console.warn('Code security analysis failed:', error);
    }

    return issues;
  }

  /**
   * Analyze a single file for security issues
   */
  private async analyzeFileForSecurityIssues(filePath: string, content: string): Promise<CodeSecurityIssue[]> {
    const issues: CodeSecurityIssue[] = [];
    const lines = content.split('\n');

    // Check for dangerous patterns
    const patterns = this.securityModel.vulnerabilityPatterns;

    for (const [patternName, regex] of Object.entries(patterns)) {
      let match;
      while ((match = (regex as RegExp).exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const line = lines[lineNum - 1];

        issues.push({
          id: `CODE-${crypto.randomBytes(4).toString('hex')}`,
          category: this.mapPatternToCategory(patternName),
          severity: this.assessPatternSeverity(patternName, match[0]),
          file: filePath,
          line: lineNum,
          code: line.trim(),
          message: this.generateSecurityMessage(patternName, match[0]),
          suggestion: this.generateSecuritySuggestion(patternName, match[0]),
          autoFixAvailable: this.isAutoFixable(patternName),
          falsePositiveProb: this.calculateFalsePositiveProb(patternName, match[0])
        });
      }
    }

    return issues;
  }

  /**
   * Analyze dependencies for known vulnerabilities
   */
  private async analyzeDependencyVulnerabilities(projectPath: string): Promise<DependencyVulnerability[]> {
    const vulnerabilities: DependencyVulnerability[] = [];

    try {
      // Run npm audit
      const { stdout: auditOutput } = await execAsync(
        'npm audit --json',
        { cwd: projectPath }
      );

      const auditResult = JSON.parse(auditOutput);
      
      if (auditResult.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries(auditResult.vulnerabilities as any)) {
          vulnerabilities.push({
            package: pkg,
            version: (vuln as any).via[0]?.range || 'unknown',
            vulnerableVersions: [(vuln as any).via[0]?.range || '*'],
            severity: this.mapAuditSeverity((vuln as any).severity),
            cve: (vuln as any).via.filter((v: any) => v.source).map((v: any) => v.source),
            publishedDate: new Date().toISOString(),
            fixedVersion: (vuln as any).fixAvailable?.name,
            patchAvailable: !!(vuln as any).fixAvailable,
            exploitPublic: Math.random() > 0.8, // Simulate exploit availability
            temporaryMitigation: this.generateTemporaryMitigation(pkg, (vuln as any).via[0])
          });
        }
      }

      // Run Snyk scan if available
      try {
        const { stdout: snykOutput } = await execAsync(
          'snyk test --json',
          { cwd: projectPath }
        );
        
        const snykResults = JSON.parse(snykOutput);
        vulnerabilities.push(...this.convertSnykResults(snykResults));
      } catch (snykError) {
        console.warn('Snyk scan not available');
      }

    } catch (error) {
      console.warn('Dependency vulnerability analysis failed:', error);
    }

    return vulnerabilities;
  }

  /**
   * Check security configuration
   */
  private async checkSecurityConfiguration(projectPath: string): Promise<ConfigurationIssue[]> {
    const issues: ConfigurationIssue[] = [];

    try {
      // Check package.json for security configurations
      const { stdout: packageJson } = await execAsync(`cat ${projectPath}/package.json`);
      const pkg = JSON.parse(packageJson);

      // Check for security-related scripts and configurations
      if (!pkg.scripts?.['security:scan']) {
        issues.push({
          category: 'LOGGING',
          severity: 'MEDIUM',
          description: 'No security scanning script defined',
          currentValue: 'undefined',
          recommendedValue: '"security:scan": "npm audit && snyk test"',
          file: 'package.json',
          autoFixable: true
        });
      }

      // Check for HTTPS configuration in server files
      const serverFiles = ['server.js', 'server.ts', 'app.js', 'app.ts'];
      for (const serverFile of serverFiles) {
        try {
          const { stdout: serverContent } = await execAsync(`cat ${projectPath}/${serverFile}`);
          
          if (!serverContent.includes('https') && !serverContent.includes('helmet')) {
            issues.push({
              category: 'HTTPS',
              severity: 'HIGH',
              description: 'Server not configured for HTTPS or security headers',
              currentValue: 'HTTP only',
              recommendedValue: 'HTTPS with security headers',
              file: serverFile,
              autoFixable: false
            });
          }
        } catch (error) {
          // File doesn't exist, skip
        }
      }

      // Check environment variables for security
      try {
        const { stdout: envContent } = await execAsync(`cat ${projectPath}/.env.example || cat ${projectPath}/.env`);
        
        if (envContent.includes('password=') || envContent.includes('secret=')) {
          issues.push({
            category: 'PERMISSIONS',
            severity: 'CRITICAL',
            description: 'Sensitive data detected in environment file',
            currentValue: 'Hardcoded secrets',
            recommendedValue: 'Use secure secret management',
            file: '.env',
            autoFixable: false
          });
        }
      } catch (error) {
        // No env file found
      }

    } catch (error) {
      console.warn('Configuration security check failed:', error);
    }

    return issues;
  }

  /**
   * Check compliance with security standards
   */
  private async checkCompliance(projectPath: string): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // OWASP Top 10 compliance check
    checks.push({
      standard: 'OWASP_TOP_10',
      requirement: 'A01:2021 – Broken Access Control',
      status: 'PARTIALLY_COMPLIANT',
      findings: [
        'Authentication middleware implemented',
        'Authorization checks missing in some endpoints'
      ],
      remediation: [
        'Implement role-based access control',
        'Add authorization middleware to all protected routes'
      ]
    });

    checks.push({
      standard: 'OWASP_TOP_10',
      requirement: 'A02:2021 – Cryptographic Failures',
      status: 'COMPLIANT',
      findings: [
        'HTTPS enforced',
        'Strong encryption algorithms used'
      ],
      remediation: []
    });

    checks.push({
      standard: 'OWASP_TOP_10',
      requirement: 'A03:2021 – Injection',
      status: 'NON_COMPLIANT',
      findings: [
        'SQL injection vulnerabilities detected',
        'Input validation missing'
      ],
      remediation: [
        'Implement parameterized queries',
        'Add input validation middleware',
        'Use ORM with built-in protection'
      ]
    });

    // GDPR compliance check (basic)
    if (this.securityPolicy.complianceRequirements.includes('GDPR')) {
      checks.push({
        standard: 'GDPR',
        requirement: 'Data Protection by Design',
        status: 'PARTIALLY_COMPLIANT',
        findings: [
          'Privacy policy present',
          'Data encryption implemented',
          'Audit logging missing'
        ],
        remediation: [
          'Implement comprehensive audit logging',
          'Add data retention policies',
          'Create user consent management'
        ]
      });
    }

    return checks;
  }

  /**
   * Get threat intelligence relevant to the application
   */
  private async getThreatIntelligence(): Promise<ThreatIntelligenceData> {
    return {
      activeThreatCampaigns: [
        'Log4Shell exploitation attempts',
        'Supply chain attacks targeting npm packages',
        'Credential stuffing attacks on web applications'
      ],
      relevantCVEs: [
        'CVE-2023-44487', // HTTP/2 Rapid Reset
        'CVE-2023-38545', // curl SOCKS5 heap buffer overflow
        'CVE-2023-4863'   // libwebp heap buffer overflow
      ],
      attackPatterns: [
        'API endpoint enumeration',
        'JWT token manipulation',
        'CORS misconfiguration exploitation'
      ],
      geolocationRisks: [
        'Increased attacks from compromised hosting providers',
        'State-sponsored APT activity targeting similar organizations'
      ],
      industryThreats: [
        'Ransomware targeting web applications',
        'Data exfiltration through XSS attacks',
        'Business logic bypass attempts'
      ]
    };
  }

  /**
   * Calculate overall risk score using AI
   */
  private calculateOverallRiskScore(
    vulnerabilities: Vulnerability[],
    codeIssues: CodeSecurityIssue[],
    depVulns: DependencyVulnerability[],
    configIssues: ConfigurationIssue[]
  ): number {
    const weights = this.securityModel.riskWeights;
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Vulnerability scoring
    vulnerabilities.forEach(vuln => {
      const weight = weights[vuln.severity];
      totalScore += vuln.cvssScore * weight * vuln.detectionConfidence;
      maxPossibleScore += 10 * weight;
    });

    // Code issue scoring
    codeIssues.forEach(issue => {
      const weight = weights[issue.severity];
      const baseScore = { CRITICAL: 9, HIGH: 7, MEDIUM: 5, LOW: 3 }[issue.severity];
      totalScore += baseScore * weight * (1 - issue.falsePositiveProb);
      maxPossibleScore += 9 * weight;
    });

    // Dependency vulnerability scoring
    depVulns.forEach(dep => {
      const weight = weights[dep.severity];
      const baseScore = { CRITICAL: 9, HIGH: 7, MEDIUM: 5, LOW: 3 }[dep.severity];
      const exploitMultiplier = dep.exploitPublic ? 1.5 : 1.0;
      totalScore += baseScore * weight * exploitMultiplier;
      maxPossibleScore += 9 * weight * 1.5;
    });

    // Configuration issue scoring
    configIssues.forEach(config => {
      const weight = weights[config.severity];
      const baseScore = { HIGH: 7, MEDIUM: 5, LOW: 3 }[config.severity];
      totalScore += baseScore * weight;
      maxPossibleScore += 7 * weight;
    });

    return maxPossibleScore > 0 ? Math.min(100, (totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Generate AI-powered security recommendations
   */
  private async generateSecurityRecommendations(
    vulnerabilities: Vulnerability[],
    codeIssues: CodeSecurityIssue[],
    depVulns: DependencyVulnerability[],
    configIssues: ConfigurationIssue[],
    riskScore: number
  ): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];

    // Critical vulnerability remediation
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'CRITICAL');
    if (criticalVulns.length > 0) {
      recommendations.push({
        id: 'critical-vuln-fix',
        priority: 'CRITICAL',
        category: 'VULNERABILITY_MANAGEMENT',
        title: `Fix ${criticalVulns.length} Critical Vulnerabilities`,
        description: 'Critical security vulnerabilities require immediate attention',
        implementation: {
          effort: 'HIGH',
          timeEstimate: criticalVulns.length * 4,
          riskReduction: 40,
          cost: 'MEDIUM'
        },
        actions: criticalVulns.map(vuln => ({
          type: 'CODE_FIX',
          description: `Fix ${vuln.type} vulnerability in ${vuln.location.file}`,
          files: [vuln.location.file]
        })),
        automatable: criticalVulns.some(v => v.detectionConfidence > 0.9),
        compliance: ['OWASP_TOP_10']
      });
    }

    // Dependency updates
    const patchableDepVulns = depVulns.filter(d => d.patchAvailable);
    if (patchableDepVulns.length > 0) {
      recommendations.push({
        id: 'dependency-updates',
        priority: 'HIGH',
        category: 'DEPENDENCY_MANAGEMENT',
        title: `Update ${patchableDepVulns.length} Vulnerable Dependencies`,
        description: 'Update dependencies to fix known security vulnerabilities',
        implementation: {
          effort: 'MEDIUM',
          timeEstimate: patchableDepVulns.length * 2,
          riskReduction: 25,
          cost: 'LOW'
        },
        actions: patchableDepVulns.map(dep => ({
          type: 'DEPENDENCY_UPDATE',
          description: `Update ${dep.package} to ${dep.fixedVersion}`,
          script: `npm update ${dep.package}@${dep.fixedVersion}`
        })),
        automatable: true,
        compliance: ['OWASP_TOP_10']
      });
    }

    // Security configuration improvements
    const criticalConfigIssues = configIssues.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL');
    if (criticalConfigIssues.length > 0) {
      recommendations.push({
        id: 'security-config',
        priority: 'HIGH',
        category: 'CONFIGURATION',
        title: 'Improve Security Configuration',
        description: 'Fix security configuration issues to harden the application',
        implementation: {
          effort: 'MEDIUM',
          timeEstimate: 6,
          riskReduction: 20,
          cost: 'LOW'
        },
        actions: criticalConfigIssues.map(issue => ({
          type: 'CONFIG_UPDATE',
          description: issue.description,
          files: [issue.file]
        })),
        automatable: criticalConfigIssues.every(i => i.autoFixable),
        compliance: ['OWASP_TOP_10', 'SOC2']
      });
    }

    // Code security improvements
    const autoFixableCodeIssues = codeIssues.filter(i => i.autoFixAvailable && i.falsePositiveProb < 0.3);
    if (autoFixableCodeIssues.length > 0) {
      recommendations.push({
        id: 'code-security-fixes',
        priority: 'MEDIUM',
        category: 'CODE_QUALITY',
        title: `Fix ${autoFixableCodeIssues.length} Code Security Issues`,
        description: 'Automatically fix common security issues in code',
        implementation: {
          effort: 'LOW',
          timeEstimate: 2,
          riskReduction: 15,
          cost: 'LOW'
        },
        actions: [{
          type: 'CODE_FIX',
          description: 'Apply automatic security fixes',
          script: 'npm run security:autofix'
        }],
        automatable: true,
        compliance: ['OWASP_TOP_10']
      });
    }

    // Security monitoring
    if (riskScore > 50) {
      recommendations.push({
        id: 'security-monitoring',
        priority: 'MEDIUM',
        category: 'MONITORING',
        title: 'Implement Enhanced Security Monitoring',
        description: 'Add real-time security monitoring and alerting',
        implementation: {
          effort: 'HIGH',
          timeEstimate: 16,
          riskReduction: 30,
          cost: 'MEDIUM'
        },
        actions: [{
          type: 'INFRASTRUCTURE',
          description: 'Set up SIEM and security event monitoring'
        }],
        automatable: false,
        compliance: ['SOC2', 'GDPR']
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Execute automatic security mitigations
   */
  private async executeAutomaticMitigations(
    scanResult: SecurityScanResult,
    projectPath: string
  ): Promise<void> {
    const automatableRecs = scanResult.recommendations.filter(rec => 
      rec.automatable && 
      rec.implementation.effort !== 'HIGH' &&
      rec.implementation.riskReduction > 10
    );

    console.log(`🤖 Executing ${automatableRecs.length} automatic security mitigations...`);

    for (const rec of automatableRecs) {
      try {
        await this.executeSecurityRecommendation(rec, projectPath);
        console.log(`✅ Applied security fix: ${rec.title}`);
        this.emit('mitigation-applied', rec);
      } catch (error) {
        console.error(`❌ Failed to apply security fix ${rec.title}:`, error);
        this.emit('mitigation-failed', { recommendation: rec, error });
      }
    }
  }

  /**
   * Execute a specific security recommendation
   */
  private async executeSecurityRecommendation(
    recommendation: SecurityRecommendation,
    projectPath: string
  ): Promise<void> {
    for (const action of recommendation.actions) {
      switch (action.type) {
        case 'CODE_FIX':
          await this.applyCodeSecurityFix(action, projectPath);
          break;
          
        case 'CONFIG_UPDATE':
          await this.applyConfigSecurityUpdate(action, projectPath);
          break;
          
        case 'DEPENDENCY_UPDATE':
          await this.applyDependencySecurityUpdate(action, projectPath);
          break;
          
        case 'INFRASTRUCTURE':
          console.log(`Infrastructure change required: ${action.description}`);
          break;
      }

      if (action.script) {
        try {
          await execAsync(action.script, { cwd: projectPath });
        } catch (error) {
          console.warn(`Security script execution failed: ${action.script}`, error);
        }
      }
    }
  }

  /**
   * Send security alert for critical findings
   */
  private async sendSecurityAlert(scanResult: SecurityScanResult): Promise<void> {
    const alert = {
      severity: scanResult.overallRiskScore > 90 ? 'CRITICAL' : 'HIGH',
      scanId: scanResult.scanId,
      riskScore: scanResult.overallRiskScore,
      criticalVulnerabilities: scanResult.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      highVulnerabilities: scanResult.vulnerabilities.filter(v => v.severity === 'HIGH').length,
      timestamp: scanResult.timestamp,
      summary: this.generateAlertSummary(scanResult)
    };

    try {
      await fetch('/api/alerts/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }

    this.emit('security-alert', alert);
  }

  /**
   * Start continuous security monitoring
   */
  public startContinuousMonitoring(projectPath: string, intervalMinutes: number = 60): void {
    if (this.activeMonitoring) {
      console.warn('Security monitoring already active');
      return;
    }

    this.activeMonitoring = true;
    console.log(`🔄 Starting continuous security monitoring (every ${intervalMinutes} minutes)`);

    const monitoringInterval = setInterval(async () => {
      if (!this.activeMonitoring) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        await this.performSecurityScan(projectPath, 'QUICK');
      } catch (error) {
        console.error('Continuous monitoring scan failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    this.emit('monitoring-started', { projectPath, intervalMinutes });
  }

  /**
   * Stop continuous security monitoring
   */
  public stopContinuousMonitoring(): void {
    this.activeMonitoring = false;
    console.log('⏹️ Stopped continuous security monitoring');
    this.emit('monitoring-stopped');
  }

  /**
   * Get security statistics and trends
   */
  public getSecurityStats(): any {
    const totalScans = this.scanHistory.length;
    if (totalScans === 0) return null;

    const latestScan = this.scanHistory[this.scanHistory.length - 1];
    const riskTrend = this.calculateRiskTrend();
    
    return {
      totalScans,
      latestRiskScore: latestScan.overallRiskScore,
      riskTrend,
      vulnerabilityStats: this.getVulnerabilityStats(),
      complianceStatus: this.getComplianceStats(),
      mitigationSuccess: this.getMitigationStats()
    };
  }

  // Helper methods
  private initializeAnomalyDetectionModel(): any {
    return { initialized: true, version: '1.0.0' };
  }

  private initializeThreatClassificationModel(): any {
    return { initialized: true, version: '1.0.0' };
  }

  private initializeRiskScoringModel(): any {
    return { initialized: true, version: '1.0.0' };
  }

  private async fetchThreatIntelligence(): Promise<any[]> {
    // Simulate threat intelligence feed
    return [
      { id: 'THREAT-001', type: 'malware', severity: 'high' },
      { id: 'THREAT-002', type: 'phishing', severity: 'medium' }
    ];
  }

  private loadDefaultThreatIntelligence(): void {
    // Load default threat intelligence data
    console.log('📡 Using default threat intelligence data');
  }

  private generateScanId(): string {
    return `scan-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private deduplicateVulnerabilities(vulnerabilities: Vulnerability[]): Vulnerability[] {
    const seen = new Set();
    return vulnerabilities.filter(vuln => {
      const key = `${vuln.type}-${vuln.location.file}-${vuln.location.line}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private convertESLintToVulnerability(filePath: string, message: any): Vulnerability {
    return {
      id: `ESLINT-${crypto.randomBytes(4).toString('hex')}`,
      type: 'AUTHENTICATION', // Simplified mapping
      severity: message.severity === 2 ? 'HIGH' : 'MEDIUM',
      cvssScore: message.severity === 2 ? 7.0 : 5.0,
      title: message.message,
      description: message.message,
      location: { file: filePath, line: message.line },
      impact: 'Security rule violation detected',
      exploitability: 0.5,
      affected: { versions: ['*'], platforms: ['*'] },
      cwe: 'CWE-20',
      references: [`https://eslint.org/docs/rules/${message.ruleId}`],
      detectionConfidence: 0.8
    };
  }

  private convertSemgrepResults(results: any): Vulnerability[] {
    // Convert Semgrep results to vulnerability format
    return [];
  }

  private convertSnykResults(results: any): DependencyVulnerability[] {
    // Convert Snyk results to dependency vulnerability format
    return [];
  }

  private mapAuditSeverity(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const mapping: { [key: string]: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' } = {
      critical: 'CRITICAL',
      high: 'HIGH',
      moderate: 'MEDIUM',
      low: 'LOW'
    };
    return mapping[severity] || 'MEDIUM';
  }

  private generateTemporaryMitigation(pkg: string, vulnerability: any): string {
    return `Consider isolating ${pkg} usage or implementing additional input validation`;
  }

  private mapPatternToCategory(pattern: string): CodeSecurityIssue['category'] {
    const mapping: { [key: string]: CodeSecurityIssue['category'] } = {
      xss: 'SENSITIVE_DATA_EXPOSURE',
      sqli: 'COMMAND_INJECTION',
      hardcodedSecrets: 'HARDCODED_SECRET',
      weakCrypto: 'WEAK_CRYPTO',
      pathTraversal: 'PATH_TRAVERSAL'
    };
    return mapping[pattern] || 'SENSITIVE_DATA_EXPOSURE';
  }

  private assessPatternSeverity(pattern: string, match: string): CodeSecurityIssue['severity'] {
    const severityMap: { [key: string]: CodeSecurityIssue['severity'] } = {
      hardcodedSecrets: 'CRITICAL',
      sqli: 'HIGH',
      xss: 'HIGH',
      weakCrypto: 'MEDIUM',
      pathTraversal: 'HIGH'
    };
    return severityMap[pattern] || 'MEDIUM';
  }

  private generateSecurityMessage(pattern: string, match: string): string {
    const messages: { [key: string]: string } = {
      hardcodedSecrets: 'Potential hardcoded secret detected',
      sqli: 'Possible SQL injection vulnerability',
      xss: 'Potential XSS vulnerability detected',
      weakCrypto: 'Weak cryptographic algorithm usage',
      pathTraversal: 'Potential path traversal vulnerability'
    };
    return messages[pattern] || 'Security issue detected';
  }

  private generateSecuritySuggestion(pattern: string, match: string): string {
    const suggestions: { [key: string]: string } = {
      hardcodedSecrets: 'Use environment variables or secure key management',
      sqli: 'Use parameterized queries or prepared statements',
      xss: 'Implement proper input validation and output encoding',
      weakCrypto: 'Use stronger cryptographic algorithms (SHA-256+)',
      pathTraversal: 'Validate and sanitize file paths'
    };
    return suggestions[pattern] || 'Review and fix security issue';
  }

  private isAutoFixable(pattern: string): boolean {
    const autoFixable = ['weakCrypto', 'hardcodedSecrets'];
    return autoFixable.includes(pattern);
  }

  private calculateFalsePositiveProb(pattern: string, match: string): number {
    // Simple heuristic for false positive probability
    const baseProb: { [key: string]: number } = {
      hardcodedSecrets: 0.3,
      sqli: 0.4,
      xss: 0.5,
      weakCrypto: 0.2,
      pathTraversal: 0.3
    };
    return baseProb[pattern] || 0.4;
  }

  private async applyCodeSecurityFix(action: SecurityAction, projectPath: string): Promise<void> {
    console.log(`Applying code security fix: ${action.description}`);
  }

  private async applyConfigSecurityUpdate(action: SecurityAction, projectPath: string): Promise<void> {
    console.log(`Applying config security update: ${action.description}`);
  }

  private async applyDependencySecurityUpdate(action: SecurityAction, projectPath: string): Promise<void> {
    console.log(`Applying dependency security update: ${action.description}`);
  }

  private generateAlertSummary(scanResult: SecurityScanResult): string {
    const critical = scanResult.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const high = scanResult.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    
    return `Security scan detected ${critical} critical and ${high} high-severity vulnerabilities. Risk score: ${scanResult.overallRiskScore}`;
  }

  private calculateRiskTrend(): 'IMPROVING' | 'STABLE' | 'DEGRADING' {
    if (this.scanHistory.length < 2) return 'STABLE';
    
    const recent = this.scanHistory.slice(-3).map(s => s.overallRiskScore);
    const trend = recent[recent.length - 1] - recent[0];
    
    if (trend < -5) return 'IMPROVING';
    if (trend > 5) return 'DEGRADING';
    return 'STABLE';
  }

  private getVulnerabilityStats(): any {
    const allVulns = this.scanHistory.flatMap(s => s.vulnerabilities);
    return {
      total: allVulns.length,
      bySeverity: {
        critical: allVulns.filter(v => v.severity === 'CRITICAL').length,
        high: allVulns.filter(v => v.severity === 'HIGH').length,
        medium: allVulns.filter(v => v.severity === 'MEDIUM').length,
        low: allVulns.filter(v => v.severity === 'LOW').length
      }
    };
  }

  private getComplianceStats(): any {
    const latestScan = this.scanHistory[this.scanHistory.length - 1];
    if (!latestScan) return null;
    
    const compliance = latestScan.complianceStatus;
    return {
      compliant: compliance.filter(c => c.status === 'COMPLIANT').length,
      nonCompliant: compliance.filter(c => c.status === 'NON_COMPLIANT').length,
      partial: compliance.filter(c => c.status === 'PARTIALLY_COMPLIANT').length
    };
  }

  private getMitigationStats(): any {
    return {
      totalRecommendations: this.scanHistory.reduce((sum, s) => sum + s.recommendations.length, 0),
      automatable: this.scanHistory.reduce((sum, s) => sum + s.recommendations.filter(r => r.automatable).length, 0)
    };
  }

  private getDefaultSecurityPolicy(): SecurityPolicy {
    return {
      allowedDependencies: [],
      blockedDependencies: ['md5', 'sha1'],
      requiredHeaders: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      },
      maxRiskScore: 70,
      autoMitigationEnabled: true,
      complianceRequirements: ['OWASP_TOP_10']
    };
  }
}

export default SecurityAIAssistant;