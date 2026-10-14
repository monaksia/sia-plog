import { useState, useEffect } from 'react';
export default function useResource(load) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    load({ signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState({ data: null, loading: false, error }); });
    return () => controller.abort();
  }, [load, version]);
  return { ...state, retry: () => setVersion(v => v + 1) };
}
