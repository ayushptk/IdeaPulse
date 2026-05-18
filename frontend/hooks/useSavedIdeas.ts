"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ideaforge_saved_ideas";

export interface SavedIdea {
  id?: number | string;
  platform?: string;
  problem?: string;
  users?: string;
  idea?: string;
  features?: string[];
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
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedIdea[] = JSON.parse(raw);
        setTimeout(() => {
          setSavedIdeas(parsed);
          setSavedIds(new Set(parsed.map((idea) => getIdeaKey(idea))));
        }, 0);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

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
