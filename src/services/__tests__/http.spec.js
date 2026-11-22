import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJson } from '../http';

const URL = 'https://api.test/search';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Behaves like real fetch: never settles until its signal aborts, then rejects with the reason
const hangUntilAborted = (_url, { signal }) =>
  new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)));

describe('getJson', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, 'fetch');
  });

  it('resolves to ok with the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ hitCount: 3 }));
    expect(await getJson(URL)).toEqual({ ok: true, data: { hitCount: 3 } });
  });

  it('asks the given URL for JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await getJson(URL);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(URL);
    expect(options.headers).toEqual({ Accept: 'application/json' });
  });

  it.each([400, 404, 500, 503])(
    'reports HTTP %i as an http error with its status',
    async (status) => {
      fetchMock.mockResolvedValue(jsonResponse({}, status));
      const result = await getJson(URL);
      expect(result.ok).toBe(false);
      expect(result.error).toMatchObject({ kind: 'http', status });
      expect(result.error.message).toEqual(expect.any(String));
    },
  );

  it('reports a network error when the request cannot be made', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await getJson(URL);
    expect(result.error).toMatchObject({ kind: 'network', status: null });
  });

  it('reports a parse error when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Maintenance</html>', { status: 200 }));
    const result = await getJson(URL);
    expect(result.error).toMatchObject({ kind: 'parse', status: 200 });
  });

  it('reports aborted when the caller cancels the request', async () => {
    fetchMock.mockImplementation(hangUntilAborted);
    const controller = new AbortController();
    const pending = getJson(URL, { signal: controller.signal });
    controller.abort();
    expect((await pending).error.kind).toBe('aborted');
  });

  it('reports a timeout when the server is too slow', async () => {
    fetchMock.mockImplementation(hangUntilAborted);
    const result = await getJson(URL, { timeoutMs: 10 });
    expect(result.error.kind).toBe('timeout');
  });

  it('never throws, whatever fetch does', async () => {
    fetchMock.mockRejectedValue(new Error('anything at all'));
    await expect(getJson(URL)).resolves.toMatchObject({ ok: false });
  });
});
