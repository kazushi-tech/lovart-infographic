import { requestBackgroundImage } from './generationClient';

export interface BackgroundJob {
  slideId: string;
  prompt: string;
  apiKey?: string;
}

export interface QueueProgress {
  total: number;
  completed: number;
  failed: number;
  latestResult?: {
    slideId: string;
    imageUrl?: string;
    error?: string;
  };
}

const MAX_CONCURRENT = 2;

let queue: BackgroundJob[] = [];
let activeCount = 0;
let totalCount = 0;
let completedCount = 0;
let failedCount = 0;
let progressListeners: Set<(p: QueueProgress) => void> = new Set();

/**
 * Add background jobs to the queue.
 */
export function enqueue(jobs: BackgroundJob[]): void {
  if (jobs.length === 0) return;
  queue.push(...jobs);
  totalCount += jobs.length;
  emitProgress();
  void processQueue();
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
    emitProgress();
    void runJob(job);
  }
}

async function runJob(job: BackgroundJob): Promise<void> {
  try {
    const imageUrl = await requestBackgroundImage(job.prompt, job.apiKey);
    completedCount++;
    emitProgress({ slideId: job.slideId, imageUrl });
  } catch (error) {
    failedCount++;
    emitProgress({
      slideId: job.slideId,
      error: error instanceof Error ? error.message : 'Unknown background generation error',
    });
  } finally {
    activeCount--;
    if (queue.length > 0) {
      void processQueue();
      return;
    }

    emitProgress();

    if (activeCount === 0) {
      totalCount = 0;
      completedCount = 0;
      failedCount = 0;
    }
  }
}

function emitProgress(latestResult?: QueueProgress['latestResult']): void {
  const p = getCurrentProgress(latestResult);
  progressListeners.forEach(l => l(p));
}

function getCurrentProgress(latestResult?: QueueProgress['latestResult']): QueueProgress {
  return {
    total: totalCount,
    completed: completedCount,
    failed: failedCount,
    latestResult,
  };
}

function updateProgress(): void {
  emitProgress();
}

/**
 * Get current queue state.
 */
export function getQueueState(): QueueProgress {
  return getCurrentProgress();
}
