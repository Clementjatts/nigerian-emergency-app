const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};

export const retryWithBackoff = async (
  operation,
  config = DEFAULT_RETRY_CONFIG
) => {
  const { maxRetries, initialDelayMs, maxDelayMs, backoffFactor } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError = null;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's a client error (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelayMs);
    }
  }

  throw lastError;
};

export const retryQueue = {
  queue: [],
  isProcessing: false,

  async add(operation, key) {
    this.queue.push({ operation, key });
    if (!this.isProcessing) {
      await this.processQueue();
    }
  },

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { operation, key } = this.queue[0];

      try {
        await retryWithBackoff(operation);
        this.queue.shift(); // Remove the successful operation
      } catch (error) {
        console.error(`Failed to process operation for key ${key}:`, error);
        // Move failed operation to the end of the queue if it's a network error
        if (error.name === 'NetworkError') {
          const failedOperation = this.queue.shift();
          this.queue.push(failedOperation);
        } else {
          // Remove permanently if it's not a network error
          this.queue.shift();
        }
      }

      // Add delay between retries
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
  },
};
