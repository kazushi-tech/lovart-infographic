/**
 * IndexedDB store for project history
 */

import type { ProjectRecord } from '../types/project';

const DB_NAME = 'lovart-project-history';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

/**
 * Open the IndexedDB database and create the object store if needed
 */
export async function openProjectStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Create object store with id as key path
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('byUpdatedAt', 'updatedAt');
        store.createIndex('byCreatedAt', 'createdAt');
        store.createIndex('byStatus', 'status');
        store.createIndex('byOutputTarget', 'outputTarget');
      }
    };
  });
}

/**
 * List all projects, ordered by updatedAt descending
 */
export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await openProjectStore();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('byUpdatedAt');
    const request = index.openCursor(null, 'prev');
    const projects: ProjectRecord[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        projects.push(cursor.value as ProjectRecord);
        cursor.continue();
      } else {
        resolve(projects);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to list projects: ${request.error?.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get a single project by id
 */
export async function getProject(id: string): Promise<ProjectRecord | null> {
  const db = await openProjectStore();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as ProjectRecord | null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get project: ${request.error?.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Save or update a project
 */
export async function saveProject(project: ProjectRecord): Promise<void> {
  const db = await openProjectStore();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(project);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save project: ${request.error?.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a project by id
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await openProjectStore();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete project: ${request.error?.message}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Duplicate a project by id, creating a new record with a unique id
 */
export async function duplicateProject(id: string): Promise<ProjectRecord> {
  const original = await getProject(id);
  if (!original) {
    throw new Error(`Project with id ${id} not found`);
  }

  const duplicated: ProjectRecord = {
    ...original,
    id: crypto.randomUUID(),
    title: `${original.title} (コピー)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProject(duplicated);
  return duplicated;
}
