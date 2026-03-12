/**
 * Session preferences for project history
 * Stored in localStorage for quick access
 */

const LAST_ACTIVE_PROJECT_ID_KEY = 'lovart-last-active-project-id';

/**
 * Get the last active project id from localStorage
 */
export function getLastActiveProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_ACTIVE_PROJECT_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the last active project id in localStorage
 */
export function setLastActiveProjectId(id: string): void {
  try {
    localStorage.setItem(LAST_ACTIVE_PROJECT_ID_KEY, id);
  } catch (error) {
    console.warn('Failed to set last active project id:', error);
  }
}

/**
 * Clear the last active project id from localStorage
 */
export function clearLastActiveProjectId(): void {
  try {
    localStorage.removeItem(LAST_ACTIVE_PROJECT_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear last active project id:', error);
  }
}
