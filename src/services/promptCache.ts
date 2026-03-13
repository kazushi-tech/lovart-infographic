import type { ResearchPacket } from '../demoData';

const researchCache = new Map<string, ResearchPacket>();
const bgImageCache = new Map<string, string>();

const MAX_CACHE_SIZE = 50;

/**
 * Generate a cache key from theme and preferences.
 */
export function hashResearchKey(theme: string, preferences: any): string {
  const prefsStr = JSON.stringify(preferences || {});
  return `research:${theme}:${prefsStr}`;
}

/**
 * Generate a cache key for background image.
 */
export function hashBgKey(theme: string, styleId: string, pageKind: string, bgPrompt: string): string {
  return `bg:${theme}:${styleId}:${pageKind}:${bgPrompt}`;
}

/**
 * Get cached research packet.
 */
export function getCachedResearch(key: string): ResearchPacket | undefined {
  return researchCache.get(key);
}

/**
 * Set cached research packet.
 */
export function setCachedResearch(key: string, packet: ResearchPacket): void {
  if (researchCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest
    const firstKey = researchCache.keys().next().value;
    if (firstKey) researchCache.delete(firstKey);
  }
  researchCache.set(key, packet);
}

/**
 * Get cached background image URL.
 */
export function getCachedBgImage(key: string): string | undefined {
  return bgImageCache.get(key);
}

/**
 * Set cached background image URL.
 */
export function setCachedBgImage(key: string, url: string): void {
  if (bgImageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = bgImageCache.keys().next().value;
    if (firstKey) bgImageCache.delete(firstKey);
  }
  bgImageCache.set(key, url);
}

/**
 * Clear all caches.
 */
export function clearAll(): void {
  researchCache.clear();
  bgImageCache.clear();
}
