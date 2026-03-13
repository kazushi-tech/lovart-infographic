import React, { useState, useEffect, useCallback } from 'react';
import { saveDeck as saveRecord, getDeck, listDecks, deleteDeck } from '../history/indexedDb';
import type { DeckRecord, DeckSummary } from '../history/schema';

export function useDeckHistory() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listDecks();
      setDecks(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveDeck = useCallback(
    async (record: DeckRecord): Promise<void> => {
      await saveRecord(record);
      await refresh();
    },
    [refresh],
  );

  const loadDeck = useCallback(
    async (id: string): Promise<DeckRecord | undefined> => {
      return getDeck(id);
    },
    [],
  );

  const removeDeck = useCallback(
    async (id: string): Promise<void> => {
      await deleteDeck(id);
      await refresh();
    },
    [refresh],
  );

  return { decks, isLoading, saveDeck, loadDeck, removeDeck, refresh };
}
