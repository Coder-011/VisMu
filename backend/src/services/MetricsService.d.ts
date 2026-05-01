export declare class MetricsService {
    logMetric(sessionId: string, latency: number, confidence: number, note: string | null): Promise<void>;
    getPerformanceMetrics(): Promise<any>;
}
export declare const metricsService: MetricsService;
//# sourceMappingURL=MetricsService.d.ts.map