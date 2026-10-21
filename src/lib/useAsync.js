import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Charge une ressource et la recharge quand `deps` change.
 * Les réponses arrivées après un changement de deps sont ignorées.
 */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const callId = useRef(0);

  const run = useCallback(() => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => id === callId.current && setState({ data, error: null, loading: false }))
      .catch((error) => id === callId.current && setState((s) => ({ ...s, error, loading: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  /** Remplace localement la donnée (après une mutation réussie) */
  const mutate = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: run, mutate };
}
