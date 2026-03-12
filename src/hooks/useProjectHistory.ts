/**
 * Custom hook for managing project history and persistence.
 *
 * Provides state and functions for:
 * - Loading, creating, opening, saving, updating, deleting, duplicating projects
 * - Autosave with debouncing
 * - Session resume (restore last active project)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectRecord, ProjectStatus, EntryMode, SourceMaterialType, OutputTarget } from '../types/project';
import * as projectStore from '../lib/projectStore';
import * as prefs from '../lib/projectSessionPrefs';

// Autosave debounce delay in milliseconds
const AUTOSAVE_DELAY = 500;

// Changes that trigger autosave
type MeaningfulChange =
  | 'slides'
  | 'interviewData'
  | 'briefContent';

interface CreateProjectParams {
  title: string;
  description?: string;
  entryMode: EntryMode;
  sourceMaterialType?: SourceMaterialType;
  outputTarget: OutputTarget;
}

interface UseProjectHistoryReturn {
  // State
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  isLoading: boolean;
  error: string | null;

  // Functions
  loadProjects: () => Promise<void>;
  createProject: (params: CreateProjectParams) => Promise<ProjectRecord>;
  openProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  updateActiveProject: (updates: Partial<ProjectRecord>) => void;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<ProjectRecord>;
  closeProject: () => void;

  // Autosave trigger
  triggerAutosave: (changeType: MeaningfulChange) => void;
}

/**
 * Custom hook for managing project history
 */
export function useProjectHistory(): UseProjectHistoryReturn {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref for autosave debounce timer
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all projects
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allProjects = await projectStore.listProjects();
      setProjects(allProjects);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load projects';
      setError(message);
      console.error('Error loading projects:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new project
  const createProject = useCallback(async (params: CreateProjectParams): Promise<ProjectRecord> => {
    setError(null);
    const now = new Date().toISOString();

    const newProject: ProjectRecord = {
      id: crypto.randomUUID(),
      title: params.title,
      description: params.description,
      entryMode: params.entryMode,
      sourceMaterialType: params.sourceMaterialType,
      outputTarget: params.outputTarget,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await projectStore.saveProject(newProject);
      setProjects((prev) => [newProject, ...prev]);
      setActiveProject(newProject);
      prefs.setLastActiveProjectId(newProject.id);
      return newProject;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create project';
      setError(message);
      console.error('Error creating project:', e);
      throw e;
    }
  }, []);

  // Open an existing project
  const openProject = useCallback(async (id: string) => {
    setError(null);
    try {
      const project = await projectStore.getProject(id);
      if (!project) {
        throw new Error(`Project with id ${id} not found`);
      }
      setActiveProject(project);
      prefs.setLastActiveProjectId(id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to open project';
      setError(message);
      console.error('Error opening project:', e);
      throw e;
    }
  }, []);

  // Save the current active project
  const saveCurrentProject = useCallback(async () => {
    if (!activeProject) {
      return;
    }
    setError(null);
    try {
      await projectStore.saveProject(activeProject);
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? activeProject : p))
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save project';
      setError(message);
      console.error('Error saving project:', e);
      throw e;
    }
  }, [activeProject]);

  // Update active project partially (autosave will be triggered externally)
  const updateActiveProject = useCallback((updates: Partial<ProjectRecord>) => {
    setActiveProject((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (id: string) => {
    setError(null);
    try {
      await projectStore.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        prefs.clearLastActiveProjectId();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete project';
      setError(message);
      console.error('Error deleting project:', e);
      throw e;
    }
  }, [activeProject]);

  // Duplicate a project
  const duplicateProject = useCallback(async (id: string): Promise<ProjectRecord> => {
    setError(null);
    try {
      const duplicated = await projectStore.duplicateProject(id);
      setProjects((prev) => [duplicated, ...prev]);
      return duplicated;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to duplicate project';
      setError(message);
      console.error('Error duplicating project:', e);
      throw e;
    }
  }, []);

  // Close the current project
  const closeProject = useCallback(() => {
    setActiveProject(null);
    prefs.clearLastActiveProjectId();
  }, []);

  // Trigger autosave with debounce
  const triggerAutosave = useCallback((changeType: MeaningfulChange) => {
    if (!activeProject) {
      return;
    }

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer
    autosaveTimerRef.current = setTimeout(async () => {
      await saveCurrentProject();
    }, AUTOSAVE_DELAY);
  }, [activeProject, saveCurrentProject]);

  // Load projects on mount and try to resume last session
  useEffect(() => {
    const init = async () => {
      await loadProjects();

      const lastActiveId = prefs.getLastActiveProjectId();
      if (lastActiveId) {
        try {
          const project = await projectStore.getProject(lastActiveId);
          if (project) {
            setActiveProject(project);
          }
        } catch (e) {
          console.warn('Failed to restore last active project:', e);
        }
      }
    };

    init();

    // Cleanup autosave timer on unmount
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [loadProjects]);

  return {
    // State
    projects,
    activeProject,
    isLoading,
    error,

    // Functions
    loadProjects,
    createProject,
    openProject,
    saveCurrentProject,
    updateActiveProject,
    deleteProject,
    duplicateProject,
    closeProject,

    // Autosave trigger
    triggerAutosave,
  };
}
