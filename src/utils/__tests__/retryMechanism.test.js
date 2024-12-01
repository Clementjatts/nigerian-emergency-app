import { retryWithBackoff, RetryQueue } from '../retryMechanism';
import { jest, expect, describe, it, beforeEach } from '@jest/globals';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('should succeed on first try if operation succeeds', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    jest.setTimeout(10000);
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const promise = retryWithBackoff(operation, {
      initialDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2,
    });

    // Fast-forward through all delays
    jest.runAllTimers();

    const result = await promise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 4xx errors', async () => {
    const error = new Error('Bad Request');
    error.status = 400;
    const operation = jest.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(operation)).rejects.toThrow('Bad Request');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should respect maxRetries limit', async () => {
    jest.setTimeout(10000);
    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

    const promise = retryWithBackoff(operation, {
      maxRetries: 2,
      initialDelay: 100,
    });

    // Fast-forward through all delays
    jest.runAllTimers();

    await expect(promise).rejects.toThrow('Always fails');
    expect(operation).toHaveBeenCalledTimes(3); // Initial try + 2 retries
  });
});

describe('retryQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('should process operations in order', async () => {
    jest.setTimeout(10000);
    const operation1 = jest.fn().mockResolvedValue('result1');
    const operation2 = jest.fn().mockResolvedValue('result2');
    const queue = new RetryQueue();

    queue.enqueue('key1', operation1);
    queue.enqueue('key2', operation2);

    // Fast-forward through all delays
    jest.runAllTimers();

    await Promise.all([
      queue.processQueue(),
      new Promise(resolve => setTimeout(resolve, 0)),
    ]);

    expect(operation1).toHaveBeenCalledTimes(1);
    expect(operation2).toHaveBeenCalledTimes(1);
    expect(queue.queue).toHaveLength(0);
  });

  it('should handle errors in queue processing', async () => {
    jest.setTimeout(10000);
    const error = new Error('Operation failed');
    const operation = jest.fn().mockRejectedValue(error);
    const queue = new RetryQueue();

    queue.enqueue('key1', operation);

    // Fast-forward through all delays
    jest.runAllTimers();

    await Promise.all([
      queue.processQueue(),
      new Promise(resolve => setTimeout(resolve, 0)),
    ]);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(queue.queue).toHaveLength(0);
  });
});
