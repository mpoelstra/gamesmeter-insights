import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { I18nService } from '../../i18n.service';
import { InsightsService } from '../../services/insights.service';
import { IgdbGame, IgdbService } from '../../services/igdb.service';
import { VoteRow } from '../../models';
import { CoverImageComponent } from '../../shared/cover-image/cover-image.component';
import { CommonModule } from '@angular/common';
import { COVER_PROXY_BASE } from '../../app.config';

@Component({
  selector: 'app-hidden-gems-card',
  standalone: true,
  imports: [CommonModule, CoverImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hidden-gems-card.component.html',
  styleUrls: ['./hidden-gems-card.component.css'],
})
export class HiddenGemsCardComponent {
  readonly i18n = inject(I18nService);
  private readonly insights = inject(InsightsService);
  private readonly igdb = inject(IgdbService);
  private readonly coverProxyBase = inject(COVER_PROXY_BASE);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly progress = signal({ done: 0, total: 0 });
  readonly hiddenGems = signal<GemResult[]>([]);
  readonly hotTakes = signal<GemResult[]>([]);
  private readonly lastRunKey = signal<string | null>(null);

  readonly rows = computed(() => this.insights.allRows());
  readonly status = computed(() => this.insights.status());

  constructor() {
    effect(() => {
      if (this.status() !== 'ready') {
        return;
      }
      const key = `${this.insights.fileName() ?? 'file'}:${this.rows().length}`;
      if (this.lastRunKey() === key) {
        return;
      }
      this.lastRunKey.set(key);
      this.runAnalysis();
    });
  }

  async runAnalysis() {
    this.isLoading.set(true);
    this.error.set(null);
    this.hiddenGems.set([]);
    this.hotTakes.set([]);

    try {
      const pool = this.rows().filter(row => row.title && typeof row.rating === 'number');
      const rows = pickHybridSample(pool, 60);

      const cache = readCache();
      const results: GemResult[] = [];
      let done = 0;
      this.progress.set({ done, total: rows.length });

      for (const row of rows) {
        const key = cacheKey(row);
        let match = cache[key];
        if (!match) {
          const candidates = await this.igdb.searchGames(row.title);
          match = pickBestMatch(row, candidates);
          cache[key] = match ?? null;
          writeCache(cache);
          await wait(320);
        }
        if (match?.aggregated_rating) {
          const publicScore = match.aggregated_rating / 20;
          results.push({
            row,
            match,
            publicScore,
            delta: (row.rating ?? 0) - publicScore,
          });
        }
        done += 1;
        this.progress.set({ done, total: rows.length });
      }

      const gems = [...results]
        .filter(item => item.delta >= 0.6)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 6);
      const hotTakes = [...results]
        .filter(item => item.delta <= -0.6)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 6);
      this.hiddenGems.set(gems);
      this.hotTakes.set(hotTakes);
    } catch (err) {
      console.error(err);
      this.error.set(this.i18n.t('hiddenGems.error'));
    } finally {
      this.isLoading.set(false);
    }
  }

  coverUrlFor(id: number | null): string | null {
    if (!id) {
      return null;
    }
    return `${this.coverProxyBase}/${id}`;
  }

}

interface GemResult {
  row: VoteRow;
  match: IgdbGame;
  publicScore: number;
  delta: number;
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(goty|remastered|definitive|deluxe|edition|collection|complete|hd)\b/g, '')
    .replace(/[:’'".,!?()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickBestMatch(row: VoteRow, candidates: IgdbGame[]): IgdbGame | null {
  if (!candidates.length) {
    return null;
  }
  const target = normalizeTitle(row.title);
  const year = row.year ?? null;

  let best: { score: number; game: IgdbGame } | null = null;
  for (const game of candidates) {
    let score = 0;
    const name = normalizeTitle(game.name);
    if (name === target) score += 3;
    if (name.includes(target) || target.includes(name)) score += 2;
    if (year && game.first_release_date) {
      const igdbYear = new Date(game.first_release_date * 1000).getUTCFullYear();
      score += Math.max(0, 2 - Math.abs(igdbYear - year) / 2);
    }
    if (!best || score > best.score) {
      best = { score, game };
    }
  }
  return best?.game ?? candidates[0] ?? null;
}

function cacheKey(row: VoteRow): string {
  return `${normalizeTitle(row.title)}|${row.platform ?? ''}|${row.year ?? ''}`;
}

type CacheMap = Record<string, IgdbGame | null>;

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem('gamesmeter:igdb-cache');
    if (!raw) return {};
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

function writeCache(cache: CacheMap) {
  try {
    localStorage.setItem('gamesmeter:igdb-cache', JSON.stringify(cache));
  } catch {
    // ignore cache write errors
  }
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function pickHybridSample(rows: VoteRow[], total: number): VoteRow[] {
  if (rows.length <= total) {
    return rows;
  }
  const sorted = [...rows].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const top = sorted.slice(0, Math.min(15, sorted.length));
  const bottom = [...sorted].reverse().slice(0, Math.min(15, sorted.length));
  const middlePool = rows.filter(row => !top.includes(row) && !bottom.includes(row));
  const remaining = Math.max(0, total - top.length - bottom.length);
  const middle = pickRandom(middlePool, remaining);
  return [...top, ...middle, ...bottom];
}
