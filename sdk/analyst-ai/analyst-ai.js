/**
 * ANALYST-AI SDK
 * AI-powered data analysis and insights generation
 * 
 * RSHIP-2026-ANALYST-AI-001 | Sovereign Intelligence Substrate
 * 
 * Provides analytical capabilities including:
 * - Statistical analysis
 * - Pattern detection
 * - Trend analysis
 * - Anomaly detection
 * - Report generation
 * 
 * @module sdk/analyst-ai
 * @version 1.0.0
 * @license RSHIP-SOVEREIGN
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// Analysis types
const ANALYSIS_TYPES = {
    STATISTICAL: 'statistical',
    TREND: 'trend',
    PATTERN: 'pattern',
    ANOMALY: 'anomaly',
    CORRELATION: 'correlation',
    FORECAST: 'forecast',
    COMPARISON: 'comparison'
};

// Confidence levels
const CONFIDENCE = {
    VERY_HIGH: 0.95,
    HIGH: 0.85,
    MEDIUM: 0.7,
    LOW: 0.5,
    VERY_LOW: 0.3
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════

class Statistics {
    /**
     * Calculate mean
     */
    static mean(data) {
        if (!data.length) return 0;
        return data.reduce((sum, v) => sum + v, 0) / data.length;
    }
    
    /**
     * Calculate median
     */
    static median(data) {
        if (!data.length) return 0;
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    /**
     * Calculate mode
     */
    static mode(data) {
        if (!data.length) return null;
        const counts = {};
        data.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const max = Math.max(...Object.values(counts));
        return Object.keys(counts).find(k => counts[k] === max);
    }
    
    /**
     * Calculate variance
     */
    static variance(data) {
        if (!data.length) return 0;
        const m = this.mean(data);
        return data.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / data.length;
    }
    
    /**
     * Calculate standard deviation
     */
    static stdDev(data) {
        return Math.sqrt(this.variance(data));
    }
    
    /**
     * Calculate min
     */
    static min(data) {
        return Math.min(...data);
    }
    
    /**
     * Calculate max
     */
    static max(data) {
        return Math.max(...data);
    }
    
    /**
     * Calculate range
     */
    static range(data) {
        return this.max(data) - this.min(data);
    }
    
    /**
     * Calculate percentile
     */
    static percentile(data, p) {
        const sorted = [...data].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) return sorted[lower];
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    }
    
    /**
     * Calculate quartiles
     */
    static quartiles(data) {
        return {
            q1: this.percentile(data, 25),
            q2: this.percentile(data, 50),
            q3: this.percentile(data, 75),
            iqr: this.percentile(data, 75) - this.percentile(data, 25)
        };
    }
    
    /**
     * Calculate z-score
     */
    static zScore(value, mean, stdDev) {
        if (stdDev === 0) return 0;
        return (value - mean) / stdDev;
    }
    
    /**
     * Full statistical summary
     */
    static summary(data) {
        return {
            count: data.length,
            mean: this.mean(data),
            median: this.median(data),
            mode: this.mode(data),
            stdDev: this.stdDev(data),
            variance: this.variance(data),
            min: this.min(data),
            max: this.max(data),
            range: this.range(data),
            ...this.quartiles(data)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

class TrendAnalyzer {
    /**
     * Linear regression
     */
    static linearRegression(data) {
        const n = data.length;
        if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
        
        // x values are indices
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumX2 += i * i;
            sumY2 += data[i] * data[i];
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // R-squared
        const meanY = sumY / n;
        let ssRes = 0, ssTot = 0;
        for (let i = 0; i < n; i++) {
            const predicted = slope * i + intercept;
            ssRes += Math.pow(data[i] - predicted, 2);
            ssTot += Math.pow(data[i] - meanY, 2);
        }
        const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
        
        return {
            slope,
            intercept,
            r2,
            trend: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable'
        };
    }
    
    /**
     * Moving average
     */
    static movingAverage(data, window = 3) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - window + 1);
            const windowData = data.slice(start, i + 1);
            result.push(Statistics.mean(windowData));
        }
        return result;
    }
    
    /**
     * Exponential moving average
     */
    static exponentialMA(data, alpha = 0.3) {
        if (!data.length) return [];
        
        const result = [data[0]];
        for (let i = 1; i < data.length; i++) {
            result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
        }
        return result;
    }
    
    /**
     * Detect trend changes
     */
    static detectTrendChanges(data, threshold = 0.1) {
        const changes = [];
        const ma = this.movingAverage(data, 5);
        
        for (let i = 1; i < ma.length - 1; i++) {
            const prevSlope = ma[i] - ma[i - 1];
            const nextSlope = ma[i + 1] - ma[i];
            
            if (Math.sign(prevSlope) !== Math.sign(nextSlope) && Math.abs(nextSlope - prevSlope) > threshold) {
                changes.push({
                    index: i,
                    value: data[i],
                    type: nextSlope > prevSlope ? 'upturn' : 'downturn'
                });
            }
        }
        
        return changes;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

class AnomalyDetector {
    /**
     * Z-score based anomaly detection
     */
    static zScoreMethod(data, threshold = 3) {
        const mean = Statistics.mean(data);
        const stdDev = Statistics.stdDev(data);
        
        return data.map((value, index) => {
            const z = Statistics.zScore(value, mean, stdDev);
            return {
                index,
                value,
                zScore: z,
                isAnomaly: Math.abs(z) > threshold
            };
        }).filter(d => d.isAnomaly);
    }
    
    /**
     * IQR-based anomaly detection
     */
    static iqrMethod(data, k = 1.5) {
        const { q1, q3, iqr } = Statistics.quartiles(data);
        const lower = q1 - k * iqr;
        const upper = q3 + k * iqr;
        
        return data.map((value, index) => ({
            index,
            value,
            isAnomaly: value < lower || value > upper,
            bound: value < lower ? 'lower' : value > upper ? 'upper' : null
        })).filter(d => d.isAnomaly);
    }
    
    /**
     * Moving average deviation
     */
    static maDeviationMethod(data, window = 5, threshold = 2) {
        const ma = TrendAnalyzer.movingAverage(data, window);
        const deviations = data.map((v, i) => Math.abs(v - ma[i]));
        const avgDeviation = Statistics.mean(deviations);
        
        return data.map((value, index) => {
            const deviation = Math.abs(value - ma[index]);
            return {
                index,
                value,
                deviation,
                isAnomaly: deviation > avgDeviation * threshold
            };
        }).filter(d => d.isAnomaly);
    }
    
    /**
     * Combined anomaly score
     */
    static detectAnomalies(data, config = {}) {
        const zAnomalies = this.zScoreMethod(data, config.zThreshold || 3);
        const iqrAnomalies = this.iqrMethod(data, config.iqrK || 1.5);
        const maAnomalies = this.maDeviationMethod(data, config.maWindow || 5, config.maThreshold || 2);
        
        // Combine by index
        const combined = {};
        
        const addAnomaly = (anomaly, method) => {
            if (!combined[anomaly.index]) {
                combined[anomaly.index] = {
                    index: anomaly.index,
                    value: anomaly.value,
                    methods: [],
                    confidence: 0
                };
            }
            combined[anomaly.index].methods.push(method);
            combined[anomaly.index].confidence += 0.33;
        };
        
        zAnomalies.forEach(a => addAnomaly(a, 'zscore'));
        iqrAnomalies.forEach(a => addAnomaly(a, 'iqr'));
        maAnomalies.forEach(a => addAnomaly(a, 'ma'));
        
        return Object.values(combined)
            .map(a => ({ ...a, confidence: Math.min(1, a.confidence) }))
            .sort((a, b) => b.confidence - a.confidence);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATTERN DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

class PatternDetector {
    /**
     * Detect seasonality
     */
    static detectSeasonality(data, maxPeriod = null) {
        const n = data.length;
        maxPeriod = maxPeriod || Math.floor(n / 2);
        
        const mean = Statistics.mean(data);
        const normalized = data.map(v => v - mean);
        
        // Calculate autocorrelation for different lags
        const autocorrelations = [];
        
        for (let lag = 1; lag <= maxPeriod; lag++) {
            let numerator = 0;
            let denominator = 0;
            
            for (let i = 0; i < n - lag; i++) {
                numerator += normalized[i] * normalized[i + lag];
            }
            
            for (let i = 0; i < n; i++) {
                denominator += normalized[i] * normalized[i];
            }
            
            autocorrelations.push({
                lag,
                correlation: denominator > 0 ? numerator / denominator : 0
            });
        }
        
        // Find peaks
        const peaks = [];
        for (let i = 1; i < autocorrelations.length - 1; i++) {
            const curr = autocorrelations[i];
            const prev = autocorrelations[i - 1];
            const next = autocorrelations[i + 1];
            
            if (curr.correlation > prev.correlation && curr.correlation > next.correlation && curr.correlation > 0.3) {
                peaks.push(curr);
            }
        }
        
        return {
            autocorrelations: autocorrelations.slice(0, 20),  // First 20
            peaks,
            period: peaks.length > 0 ? peaks[0].lag : null,
            hasSeasonality: peaks.length > 0 && peaks[0].correlation > 0.5
        };
    }
    
    /**
     * Detect repeating patterns
     */
    static findRepeatingPatterns(data, minLength = 3, maxLength = 10) {
        const patterns = [];
        const n = data.length;
        
        for (let len = minLength; len <= Math.min(maxLength, Math.floor(n / 2)); len++) {
            for (let start = 0; start <= n - 2 * len; start++) {
                const pattern = data.slice(start, start + len);
                let matches = 0;
                
                for (let i = start + len; i <= n - len; i++) {
                    const candidate = data.slice(i, i + len);
                    const similarity = this._similarity(pattern, candidate);
                    
                    if (similarity > 0.9) {
                        matches++;
                    }
                }
                
                if (matches > 0) {
                    patterns.push({
                        pattern,
                        startIndex: start,
                        length: len,
                        matches: matches + 1
                    });
                }
            }
        }
        
        // Deduplicate
        return patterns.filter((p, i, arr) => 
            !arr.slice(0, i).some(q => 
                q.startIndex === p.startIndex && q.length === p.length
            )
        ).slice(0, 10);
    }
    
    static _similarity(a, b) {
        if (a.length !== b.length) return 0;
        
        const rangeA = Math.max(...a) - Math.min(...a) || 1;
        const rangeB = Math.max(...b) - Math.min(...b) || 1;
        
        let diff = 0;
        for (let i = 0; i < a.length; i++) {
            diff += Math.abs((a[i] / rangeA) - (b[i] / rangeB));
        }
        
        return 1 - (diff / a.length);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYST
// ═══════════════════════════════════════════════════════════════════════════════

class Analyst {
    constructor(config = {}) {
        this.id = config.id || `ANALYST-${Date.now()}`;
        this.name = config.name || 'Data Analyst';
        this.events = new EventEmitter();
        
        // Analysis history
        this.history = [];
        this.maxHistory = config.maxHistory || 100;
        
        // Metrics
        this.analysesPerformed = 0;
        this.phiAccumulated = 0;
    }
    
    /**
     * Perform full analysis
     */
    analyze(data, config = {}) {
        const startTime = Date.now();
        this.analysesPerformed++;
        
        const analysis = {
            id: `ANALYSIS-${Date.now()}`,
            dataPoints: data.length,
            timestamp: Date.now(),
            results: {}
        };
        
        try {
            // Statistical summary
            analysis.results.statistics = Statistics.summary(data);
            
            // Trend analysis
            analysis.results.trend = TrendAnalyzer.linearRegression(data);
            analysis.results.movingAverage = TrendAnalyzer.movingAverage(data, config.maWindow || 5);
            analysis.results.trendChanges = TrendAnalyzer.detectTrendChanges(data);
            
            // Anomaly detection
            analysis.results.anomalies = AnomalyDetector.detectAnomalies(data, config);
            
            // Pattern detection
            analysis.results.seasonality = PatternDetector.detectSeasonality(data);
            
            // Insights
            analysis.insights = this._generateInsights(analysis.results);
            
            analysis.success = true;
            analysis.latency = Date.now() - startTime;
            
            this.phiAccumulated += PHI_INV * 0.1;
            
        } catch (error) {
            analysis.success = false;
            analysis.error = error.message;
        }
        
        // Store in history
        this.history.push(analysis);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        this.events.emit('analysis:complete', analysis);
        
        return analysis;
    }
    
    /**
     * Generate insights from analysis
     */
    _generateInsights(results) {
        const insights = [];
        
        // Trend insight
        if (results.trend.r2 > 0.5) {
            insights.push({
                type: 'trend',
                confidence: results.trend.r2,
                message: `Data shows ${results.trend.trend} trend with R² = ${results.trend.r2.toFixed(3)}`
            });
        }
        
        // Anomaly insight
        if (results.anomalies.length > 0) {
            const highConfidence = results.anomalies.filter(a => a.confidence > 0.6);
            insights.push({
                type: 'anomaly',
                confidence: highConfidence.length > 0 ? 0.8 : 0.5,
                message: `Detected ${results.anomalies.length} anomalies (${highConfidence.length} high confidence)`
            });
        }
        
        // Variability insight
        const cv = results.statistics.stdDev / (results.statistics.mean || 1);
        if (cv > 0.5) {
            insights.push({
                type: 'variability',
                confidence: 0.7,
                message: `High variability detected (CV = ${cv.toFixed(2)})`
            });
        }
        
        // Seasonality insight
        if (results.seasonality.hasSeasonality) {
            insights.push({
                type: 'pattern',
                confidence: results.seasonality.peaks[0].correlation,
                message: `Seasonal pattern detected with period of ${results.seasonality.period}`
            });
        }
        
        return insights;
    }
    
    /**
     * Quick statistical summary
     */
    summarize(data) {
        return Statistics.summary(data);
    }
    
    /**
     * Find anomalies
     */
    findAnomalies(data, config = {}) {
        return AnomalyDetector.detectAnomalies(data, config);
    }
    
    /**
     * Analyze trend
     */
    analyzeTrend(data) {
        return {
            regression: TrendAnalyzer.linearRegression(data),
            movingAverage: TrendAnalyzer.movingAverage(data),
            changes: TrendAnalyzer.detectTrendChanges(data)
        };
    }
    
    /**
     * Get analyst status
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            analysesPerformed: this.analysesPerformed,
            historySize: this.history.length,
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Constants
    PHI,
    PHI_INV,
    ANALYSIS_TYPES,
    CONFIDENCE,
    
    // Classes
    Statistics,
    TrendAnalyzer,
    AnomalyDetector,
    PatternDetector,
    Analyst,
    
    // Factory
    createAnalyst(config = {}) {
        return new Analyst(config);
    },
    
    // Protocol info
    id: 'RSHIP-2026-ANALYST-AI-001',
    name: 'Analyst AI SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'analyst-ai',
            version: '1.0.0',
            analysisTypes: Object.keys(ANALYSIS_TYPES).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ANALYST-AI SDK');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const { createAnalyst, Statistics } = module.exports;
    
    // Generate test data with trend and anomalies
    const data = [];
    for (let i = 0; i < 50; i++) {
        let value = 10 + i * 0.5 + Math.sin(i * 0.5) * 3 + (Math.random() - 0.5) * 2;
        if (i === 25) value = 50;  // Anomaly
        if (i === 35) value = -5;  // Anomaly
        data.push(value);
    }
    
    console.log('\n1. Creating analyst...');
    const analyst = createAnalyst({ name: 'TestAnalyst' });
    
    console.log('\n2. Statistical summary:');
    const stats = Statistics.summary(data);
    console.log(`   Mean: ${stats.mean.toFixed(2)}, Std Dev: ${stats.stdDev.toFixed(2)}`);
    console.log(`   Min: ${stats.min.toFixed(2)}, Max: ${stats.max.toFixed(2)}`);
    
    console.log('\n3. Full analysis...');
    const analysis = analyst.analyze(data);
    console.log(`   Trend: ${analysis.results.trend.trend} (R² = ${analysis.results.trend.r2.toFixed(3)})`);
    console.log(`   Anomalies: ${analysis.results.anomalies.length}`);
    console.log(`   Seasonality: ${analysis.results.seasonality.hasSeasonality ? 'Yes' : 'No'}`);
    
    console.log('\n4. Insights:');
    for (const insight of analysis.insights) {
        console.log(`   [${insight.type}] ${insight.message}`);
    }
    
    console.log('\n5. Analyst status:', analyst.getStatus());
    
    console.log('\n✓ ANALYST-AI operational');
}
