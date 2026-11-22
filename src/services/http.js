// fetch wrapper that never throws: resolves to { ok: true, data } or { ok: false, error }.

const TIMEOUT_MS = 15000;

const MESSAGES = {
  network: 'Could not reach the server. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  aborted: 'The request was cancelled.',
  parse: 'The server sent a response that could not be read.',
};

export const failure = (kind, status = null, message = MESSAGES[kind]) => ({
  ok: false,
  error: { kind, status, message },
});

// AbortError: cancelled by the caller; TimeoutError: our time limit ran out
const kindOf = (error, fallback) => {
  if (error?.name === 'AbortError') return 'aborted';
  if (error?.name === 'TimeoutError') return 'timeout';
  return fallback;
};

const httpMessage = (status) =>
  status >= 500
    ? 'The search service is unavailable right now. Please try again later.'
    : `The search request failed (error ${status}).`;

export const getJson = async (url, { signal, timeoutMs = TIMEOUT_MS } = {}) => {
  const signals = signal
    ? [signal, AbortSignal.timeout(timeoutMs)]
    : [AbortSignal.timeout(timeoutMs)];

  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.any(signals),
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    return failure(kindOf(error, 'network'));
  }

  if (!response.ok) {
    return failure('http', response.status, httpMessage(response.status));
  }

  try {
    return { ok: true, data: await response.json() };
  } catch (error) {
    return failure(kindOf(error, 'parse'), response.status);
  }
};
