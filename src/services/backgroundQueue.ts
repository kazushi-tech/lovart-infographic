import { generateBackgroundImage } from './geminiService';

export interface BackgroundJob {
  slideId: string;
  prompt: string;
  apiKey: string;
}

export interface QueueProgress {
  total: number;
  completed: number;
  failed: number;
}

const MAX_CONCURRENT = 2;

let queue: BackgroundJob[] = [];
let activeCount = 0;
let progressListeners: Set<(p: QueueProgress) => void> = new Set();

/**
 * Add background jobs to the queue.
 */
export function enqueue(jobs: BackgroundJob[]): void {
  queue.push(...jobs);
  processQueue();
}

/**
 * Set up a listener for progress updates.
 * Returns a function to unsubscribe.
 */
export function onProgress(listener: (p: QueueProgress) => void): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

/**
 * Process the queue with controlled concurrency.
 */
async function processQueue(): Promise<void> {
  while (queue.length > 0 && activeCount < MAX_CONCURRENT) {
    const job = queue.shift();
    if (!job) break;
    activeCount++;
    updateProgress();

    try {
      await generateBackgroundImage(job.prompt, job.apiKey);
      emitProgress();
    } catch {
      emitProgress();
    } finally {
      activeCount--;
      updateProgress();
    }
  }
}

function emitProgress(): void {
  const p = getCurrentProgress();
  progressListeners.forEach(l => l(p));
}

function getCurrentProgress(): QueueProgress {
  return {
    total: queue.length + activeCount,
    completed: queue.length + activeCount,
    failed: 0,
  };
}

function updateProgress(): void {
  const p = getCurrentProgress();
  progressListeners.forEach(l => l(p));
}

/**
 * Get current queue state.
 */
export function getQueueState(): QueueProgress {
  return getCurrentProgress();
}
