/**
 * Internetes keresés integráció az AI-hoz
 * 
 * Több keresőmotor támogatása (DuckDuckGo, Google Custom Search, stb.)
 */

import { logger } from '@/lib/logger';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

/**
 * DuckDuckGo keresés (ingyenes, nincs API kulcs szükséges)
 */
async function searchDuckDuckGo(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  try {
    // DuckDuckGo HTML scraping (egyszerű megoldás)
    // Alternatíva: használjunk egy library-t vagy API-t
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Egyszerű HTML parsing (regex alapú - nem ideális, de működik)
    // Jobb megoldás: cheerio vagy puppeteer használata
    const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g;

    let match;
    let index = 0;

    while ((match = titleRegex.exec(html)) !== null && index < maxResults) {
      const url = match[1];
      const title = match[2].trim();
      
      // Snippet keresése
      const snippetMatch = snippetRegex.exec(html);
      const snippet = snippetMatch ? snippetMatch[1].trim() : '';

      if (url && title) {
        results.push({
          title,
          url,
          snippet,
          source: 'DuckDuckGo',
        });
        index++;
      }
    }

    return results;
  } catch (error: any) {
    logger.error('DuckDuckGo search error', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Google Custom Search API (ha van API kulcs)
 */
async function searchGoogle(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    logger.warn('Google Search API credentials not configured');
    return [];
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${maxResults}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Search API failed: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    if (data.items) {
      for (const item of data.items) {
        results.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          source: 'Google',
        });
      }
    }

    return results;
  } catch (error: any) {
    logger.error('Google Search API error', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Web keresés - több forrásból
 */
export async function searchWeb(
  query: string,
  maxResults: number = 5,
  useGoogle: boolean = false
): Promise<SearchResult[]> {
  try {
    logger.info('Web keresés indítása', { query, maxResults });

    let results: SearchResult[] = [];

    // Először próbáljuk a Google-t (ha be van állítva)
    if (useGoogle) {
      results = await searchGoogle(query, maxResults);
    }

    // Ha nincs elég eredmény, vagy nincs Google, használjuk a DuckDuckGo-t
    if (results.length < maxResults) {
      const duckDuckGoResults = await searchDuckDuckGo(query, maxResults - results.length);
      results = [...results, ...duckDuckGoResults];
    }

    logger.info('Web keresés befejezve', { query, resultsCount: results.length });
    return results.slice(0, maxResults);
  } catch (error: any) {
    logger.error('Web keresés hiba', error instanceof Error ? error : new Error(String(error)), { query });
    return [];
  }
}

/**
 * Web keresés és kontextus formázása AI-hoz
 */
export async function searchAndFormatContext(
  query: string,
  maxResults: number = 3
): Promise<string> {
  const results = await searchWeb(query, maxResults);

  if (results.length === 0) {
    return 'Nem található információ az interneten.';
  }

  const formattedResults = results.map((result, index) => {
    return `[${index + 1}] ${result.title}
URL: ${result.url}
${result.snippet}
---`;
  }).join('\n\n');

  return `Internetes keresési eredmények a következő témában: "${query}"

${formattedResults}

Használd ezeket az információkat a válaszodban, de mindig jelöld meg a forrást.`;
}

