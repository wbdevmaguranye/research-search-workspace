import { describe, it, expect, vi } from 'vitest';
import { getJson } from '../http';
import { PAGE_SIZE, searchArticles, toArticle, toSearchPage } from '../europePmc';
import searchResponse from './stubs/searchResponse.json';

// Mock only the transport; keep the real failure() helper
vi.mock('../http', async (importOriginal) => ({ ...(await importOriginal()), getJson: vi.fn() }));

const requestedParams = () => new URL(getJson.mock.calls.at(-1)[0]).searchParams;

describe('searchArticles', () => {
  it('requests 25 results per page as JSON, starting at the first page', async () => {
    getJson.mockResolvedValue({ ok: true, data: searchResponse });
    await searchArticles({ query: 'cancer AND immunotherapy' });

    const params = requestedParams();
    expect(PAGE_SIZE).toBe(25);
    expect(params.get('query')).toBe('cancer AND immunotherapy');
    expect(params.get('format')).toBe('json');
    expect(params.get('pageSize')).toBe('25');
    expect(params.get('cursorMark')).toBe('*');
    expect(params.get('resultType')).toBe('lite');
  });

  it('sends the given cursor and passes the cancel signal through', async () => {
    getJson.mockResolvedValue({ ok: true, data: searchResponse });
    const { signal } = new AbortController();
    await searchArticles({ query: 'cancer', cursorMark: 'AoIIP2CE', signal });

    expect(requestedParams().get('cursorMark')).toBe('AoIIP2CE');
    expect(getJson.mock.calls.at(-1)[1]).toEqual({ signal });
  });

  it('returns a page of plain article objects', async () => {
    getJson.mockResolvedValue({ ok: true, data: searchResponse });
    const result = await searchArticles({ query: 'coli' });

    expect(result.ok).toBe(true);
    expect(result.data.hitCount).toBe(3172);
    expect(result.data.nextCursorMark).toBe('AoIIP/YqoCg1MjExNjczMg==');
    expect(result.data.articles).toHaveLength(3);
    expect(result.data.articles[0]).toEqual({
      id: 'MED-39559263',
      title: 'Enterotoxigenic Escherichia coli in Blantyre, Malawi.',
      authors:
        'Ashton PM, Katuah ZJ, Botomani A, Kutambe BM, Cunliffe NA, von Mentzer A, Msefula C, Jere KC.',
      year: '2024',
      url: 'https://europepmc.org/article/MED/39559263',
    });
  });

  it('turns an error reported inside a 200 response into a failure', async () => {
    const errMsg = 'Invalid page size provided. Valid size is between 1 and 1000';
    getJson.mockResolvedValue({ ok: true, data: { errCode: 404, errMsg } });

    expect(await searchArticles({ query: 'cancer' })).toEqual({
      ok: false,
      error: { kind: 'http', status: 404, message: errMsg },
    });
  });

  it('passes transport failures through unchanged', async () => {
    const failed = { ok: false, error: { kind: 'network', status: null, message: 'Offline' } };
    getJson.mockResolvedValue(failed);
    expect(await searchArticles({ query: 'cancer' })).toBe(failed);
  });
});

describe('toArticle', () => {
  it('converts title markup to plain text', () => {
    const article = toArticle(searchResponse.resultList.result[2]);
    expect(article.title).toBe(
      'Kaempferol restores the susceptibility of ESBLs Escherichia coli to Ceftiofur.',
    );
  });

  it('also strips tags that arrive entity-encoded (real title, MED 43027907)', () => {
    const title =
      'Glycosyltransferases from &lt;i&gt;Saussurea involucrata&lt;/i&gt; Involved in Flavonoid Synthesis';
    expect(toArticle({ id: '1', source: 'MED', title }).title).toBe(
      'Glycosyltransferases from Saussurea involucrata Involved in Flavonoid Synthesis',
    );
  });

  it('keeps a genuine less-than sign', () => {
    const article = toArticle({ id: '1', source: 'MED', title: 'Survival when p &lt; 0.05' });
    expect(article.title).toBe('Survival when p < 0.05');
  });

  it('decodes HTML entities and never keeps tags', () => {
    const article = toArticle({
      id: '1',
      source: 'MED',
      title: 'A &amp; B &lt;3 <script>x</script>',
    });
    expect(article.title).toBe('A & B <3 x');
  });

  it('uses empty strings for missing fields', () => {
    expect(toArticle({ id: 'PPR1', source: 'PPR' })).toEqual({
      id: 'PPR-PPR1',
      title: '',
      authors: '',
      year: '',
      url: 'https://europepmc.org/article/PPR/PPR1',
    });
  });
});

describe('toSearchPage', () => {
  it('handles a search with no results', () => {
    expect(toSearchPage({ hitCount: 0, resultList: { result: [] } })).toEqual({
      hitCount: 0,
      nextCursorMark: null,
      articles: [],
    });
  });
});
