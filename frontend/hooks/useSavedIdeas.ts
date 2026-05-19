"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "ideaforge_saved_ideas";

export interface SavedIdea {
  id?: number | string;
  platform?: string;
  problem?: string;
  users?: string;
  idea?: string;
  features?: string[];
  core_features?: string[];
  monetization?: string;
  score?: number;
  created_at?: string;
  savedAt?: string;
  idea_name?: string;
  solution?: string;
  target_customer?: string;
  why_this_will_work?: string;
  monetization_model?: string;
  competitor_gap?: string;
  [key: string]: unknown;
}

const getIdeaKey = (idea: SavedIdea): string =>
  idea.id ? String(idea.id) : encodeURIComponent(idea.problem?.slice(0, 60) || "unknown");

export function useSavedIdeas() {
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: SavedIdea[] = JSON.parse(raw);
          return new Set(parsed.map((idea) => getIdeaKey(idea)));
        }
      } catch {
        // ignore
      }
    }
    return new Set();
  });

  const saveIdea = useCallback((idea: SavedIdea) => {
    setSavedIdeas((prev) => {
      const key = getIdeaKey(idea);
      if (prev.some((s) => getIdeaKey(s) === key)) return prev;
      const next = [{ ...idea, savedAt: new Date().toISOString() }, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSavedIds((prev) => {
      const key = getIdeaKey(idea);
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const unsaveIdea = useCallback((idea: SavedIdea) => {
    const key = getIdeaKey(idea);
    setSavedIdeas((prev) => {
      const next = prev.filter((s) => getIdeaKey(s) !== key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSavedIds((prev) => {
      const key = getIdeaKey(idea);
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const toggleSave = useCallback(
    (idea: SavedIdea) => {
      const key = getIdeaKey(idea);
      if (savedIds.has(key)) {
        unsaveIdea(idea);
      } else {
        saveIdea(idea);
      }
    },
    [savedIds, saveIdea, unsaveIdea]
  );

  const isSaved = useCallback(
    (idea: SavedIdea) => savedIds.has(getIdeaKey(idea)),
    [savedIds]
  );

  return { savedIdeas, savedIds, saveIdea, unsaveIdea, toggleSave, isSaved };
}
