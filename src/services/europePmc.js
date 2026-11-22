// Europe PMC article search: builds the request and maps the response to plain article objects.
import { failure, getJson } from './http';

const SEARCH_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const ARTICLE_URL = 'https://europepmc.org/article';

export const PAGE_SIZE = 25;

const textOf = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent;

// Titles hold tags as <i> or as &lt;i&gt;: pass 1 decodes, pass 2 strips. DOMParser runs nothing.
const toPlainText = (html = '') => textOf(textOf(html)).trim();

export const toArticle = (result) => ({
  id: `${result.source}-${result.id}`,
  title: toPlainText(result.title),
  authors: result.authorString ?? '',
  year: result.pubYear ?? '',
  url: `${ARTICLE_URL}/${result.source}/${result.id}`,
});

export const toSearchPage = (response) => ({
  hitCount: response.hitCount ?? 0,
  nextCursorMark: response.nextCursorMark ?? null,
  articles: (response.resultList?.result ?? []).map(toArticle),
});

export const searchArticles = async ({ query, cursorMark = '*', signal }) => {
  const params = new URLSearchParams({
    query,
    format: 'json',
    resultType: 'lite',
    pageSize: String(PAGE_SIZE),
    cursorMark,
  });

  const result = await getJson(`${SEARCH_URL}?${params}`, { signal });
  if (!result.ok) return result;

  // Some API errors arrive as HTTP 200 with errCode/errMsg in the body
  if (result.data.errCode) return failure('http', result.data.errCode, result.data.errMsg);

  return { ok: true, data: toSearchPage(result.data) };
};
