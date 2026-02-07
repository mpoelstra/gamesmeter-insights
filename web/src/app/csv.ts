import { VoteRow } from './models';

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  const headers: string[] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  const pushCell = () => {
    row.push(current);
    current = '';
  };

  const pushRow = () => {
    if (row.length === 0) {
      return;
    }
    if (headers.length === 0) {
      headers.push(...row);
    } else {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      pushCell();
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      pushCell();
      pushRow();
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }

  return { headers, rows };
}

export function toVoteRows(parsed: ParsedCsv): VoteRow[] {
  const headerMap = new Map<string, number>();
  parsed.headers.forEach((header, index) => {
    headerMap.set(header.trim().toLowerCase(), index);
  });

  const getIndex = (key: string) => headerMap.get(key.trim().toLowerCase()) ?? -1;

  const indices = {
    id: getIndex('GamesMeter id'),
    title: getIndex('titel'),
    year: getIndex('jaar'),
    altTitle: getIndex('alternatieve titel'),
    platform: getIndex('platform'),
    rating: getIndex('stem'),
    placed: getIndex('geplaatst'),
  };

  return parsed.rows.map(row => {
    const safe = (idx: number): string => {
      if (idx < 0 || idx >= row.length) {
        return '';
      }
      return row[idx] ?? '';
    };
    const yearRaw = safe(indices.year);
    const ratingRaw = safe(indices.rating);
    const placedRaw = safe(indices.placed);

    return {
      id: parseNumber(safe(indices.id)),
      title: safe(indices.title) || 'Unknown title',
      year: parseNumber(yearRaw),
      altTitle: normalizeString(safe(indices.altTitle)),
      platform: normalizeString(safe(indices.platform)),
      rating: parseNumber(ratingRaw),
      placed: parsePlacedDate(placedRaw),
      raw: row,
    } satisfies VoteRow;
  });
}

function normalizeString(value: string): string | null {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function parseNumber(value: string): number | null {
  const cleaned = value.trim();
  if (cleaned.length === 0) {
    return null;
  }
  const numberValue = Number(cleaned.replace(',', '.'));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parsePlacedDate(value: string): Date | null {
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }
  const match = cleaned.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4] ?? '0');
  const minutes = Number(match[5] ?? '0');
  const seconds = Number(match[6] ?? '0');
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
