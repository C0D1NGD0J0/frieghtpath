import type { Provider, Status, CompletionMetrics, APIResponse } from '../lib/types';

describe('Type Definitions', () => {
  it('should create valid Provider object', () => {
    const provider: Provider = {
      provider: 'google',
      displayName: 'Google Gemini',
    };
    expect(provider.provider).toBe('google');
    expect(provider.displayName).toBe('Google Gemini');
  });

  it('should accept valid Status values', () => {
    const statuses: Status[] = ['idle', 'streaming', 'complete', 'error'];
    statuses.forEach(status => {
      const s: Status = status;
      expect(['idle', 'streaming', 'complete', 'error']).toContain(s);
    });
  });

  it('should create valid CompletionMetrics object', () => {
    const metrics: CompletionMetrics = {
      durationInMilliseconds: 1500,
      tokensUsed: 250,
      estimatedCost: 0.0025,
    };
    expect(metrics.durationInMilliseconds).toBeGreaterThan(0);
    expect(metrics.tokensUsed).toBeGreaterThan(0);
    expect(metrics.estimatedCost).toBeGreaterThanOrEqual(0);
  });

  it('should create valid APIResponse object', () => {
    const response: APIResponse = {
      content: 'Test response',
      status: 'complete',
      metrics: {
        durationInMilliseconds: 1000,
        tokensUsed: 100,
        estimatedCost: 0.001,
      },
    };
    expect(response.content).toBe('Test response');
    expect(response.status).toBe('complete');
    expect(response.metrics).toBeDefined();
  });
});
