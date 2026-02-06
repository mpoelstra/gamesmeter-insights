import { computed, inject, Injectable, signal } from '@angular/core';
import { parseCsv, toVoteRows } from '../csv';
import { buildGamerProfile, buildGeneralStats, buildTrendInsight, buildYearSummaries } from '../insights';
import { GamerProfile, GeneralStats, TrendInsight, VoteRow, YearSummary } from '../models';
import { I18nService } from '../i18n.service';

export type DataStatus = 'empty' | 'ready' | 'error';

@Injectable({
  providedIn: 'root',
})
export class InsightsService {
  private readonly storageKey = 'gamesmeter:lastCsv';
  private readonly rows = signal<VoteRow[]>([]);
  private readonly i18n = inject(I18nService);
  readonly allRows = computed<VoteRow[]>(() => this.rows());
  readonly fileName = signal<string | null>(null);
  readonly status = signal<DataStatus>('empty');

  readonly yearSummaries = computed<YearSummary[]>(() => buildYearSummaries(this.rows()));
  readonly stats = computed<GeneralStats>(() => buildGeneralStats(this.rows(), this.i18n.t('label.platformUnknown')));
  readonly trend = computed<TrendInsight>(() => buildTrendInsight(this.yearSummaries(), this.i18n.t.bind(this.i18n)));
  readonly profile = computed<GamerProfile>(() =>
    buildGamerProfile(this.stats(), this.trend(), this.yearSummaries(), this.i18n.t.bind(this.i18n)),
  );
  readonly highestRatedYears = computed(() =>
    [...this.yearSummaries()]
      .filter(summary => summary.count >= 3)
      .sort((a, b) => b.average - a.average)
      .slice(0, 3),
  );

  constructor() {
    this.restoreFromCache();
  }

  loadCsvText(text: string, name: string) {
    try {
      const parsed = parseCsv(text);
      const rows = toVoteRows(parsed);
      this.rows.set(rows);
      this.fileName.set(name);
      this.status.set('ready');
      this.persistToCache(text, name);
    } catch (error) {
      console.error(error);
      this.status.set('error');
    }
  }

  reset() {
    this.rows.set([]);
    this.fileName.set(null);
    this.status.set('empty');
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Unable to clear cached CSV', error);
    }
  }

  private restoreFromCache() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }
      const cached = JSON.parse(raw) as { name: string; text: string } | null;
      if (!cached?.text) {
        return;
      }
      const parsed = parseCsv(cached.text);
      const rows = toVoteRows(parsed);
      this.rows.set(rows);
      this.fileName.set(cached.name ?? this.i18n.t('file.cached'));
      this.status.set('ready');
    } catch (error) {
      console.warn('Unable to restore cached CSV', error);
    }
  }

  private persistToCache(text: string, name: string) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ name, text }));
    } catch (error) {
      console.warn('Unable to cache CSV', error);
    }
  }
}
