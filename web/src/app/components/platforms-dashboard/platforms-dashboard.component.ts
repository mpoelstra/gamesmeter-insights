import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { VoteRow } from '../../models';
import { I18nService } from '../../i18n.service';

interface PlatformStats {
  name: string;
  count: number;
  average: number;
  stdDev: number;
}

interface YearPlatform {
  year: number;
  platform: string;
  count: number;
  average: number;
}

interface EraPeak {
  era: string;
  decade: number;
  platform: string;
  average: number;
  count: number;
}

@Component({
  selector: 'app-platforms-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platforms-dashboard.component.html',
  styleUrls: ['./platforms-dashboard.component.css'],
})
export class PlatformsDashboardComponent {
  readonly rows = input.required<VoteRow[]>();
  readonly i18n = inject(I18nService);

  readonly platforms = computed<PlatformStats[]>(() =>
    buildPlatformStats(this.rows(), this.i18n.t('label.platformUnknown')),
  );
  readonly topPlatforms = computed(() => this.platforms().slice(0, 6));
  readonly yearSeries = computed(() =>
    buildYearPlatform(this.rows(), this.i18n.t('label.platformUnknown')),
  );
  readonly years = computed(() => [...new Set(this.yearSeries().map(item => item.year))].sort((a, b) => a - b));
  readonly platformNames = computed(() => this.topPlatforms().map(item => item.name));
  readonly eraPeaks = computed(() => buildEraPeaks(this.yearSeries()));
  readonly eraLows = computed(() => buildEraLows(this.yearSeries()));

  readonly chartTypeLine: ChartType = 'line';
  readonly chartTypeBubble: ChartType = 'bubble';

  get ribbonData(): ChartData<'line'> {
    const labels = this.years().map(year => String(year));
    const names = this.platformNames();
    const dataByPlatform = mapYearPlatform(this.yearSeries(), names);
    return {
      labels,
      datasets: names.map((name, index) => ({
        label: name,
        data: labels.map(label => dataByPlatform.get(`${label}|${name}`)?.average ?? null),
        borderColor: palette(index),
        backgroundColor: transparentize(palette(index), 0.2),
        tension: 0.25,
        pointRadius: 0,
      })),
    };
  }

  get ribbonOptions(): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: {
          min: 0.5,
          max: 5,
          ticks: { stepSize: 0.5 },
          title: { display: true, text: this.i18n.t('chart.avgRating') },
        },
      },
      plugins: { legend: { position: 'bottom' } },
    };
  }

  get eraBandsData(): ChartData<'line'> {
    const labels = this.years().map(year => String(year));
    const names = this.platformNames();
    const dataByPlatform = mapYearPlatform(this.yearSeries(), names);
    return {
      labels,
      datasets: names.map((name, index) => ({
        label: name,
        data: labels.map(label => dataByPlatform.get(`${label}|${name}`)?.count ?? 0),
        borderColor: palette(index),
        backgroundColor: transparentize(palette(index), 0.55),
        fill: true,
        pointRadius: 0,
      })),
    };
  }

  get eraBandsOptions(): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: this.i18n.t('chart.gamesRated') } },
      },
      plugins: { legend: { position: 'bottom' } },
    };
  }


  get bubbleData(): ChartData<'bubble'> {
    const names = this.platformNames();
    const dataByPlatform = mapYearPlatform(this.yearSeries(), names);
    const points = this.yearSeries()
      .filter(item => names.includes(item.platform))
      .map(item => ({
        x: item.year,
        y: Number(item.average.toFixed(2)),
        r: Math.max(4, Math.min(14, Math.sqrt(item.count) + 2)),
        platform: item.platform,
      }));

    return {
      datasets: [
        {
          label: this.i18n.t('platforms.platformDrift'),
          data: points,
          backgroundColor: points.map(point => transparentize(palette(names.indexOf(point.platform)), 0.35)),
          borderColor: points.map(point => palette(names.indexOf(point.platform))),
          borderWidth: 1.5,
        },
      ],
    };
  }

  get bubbleOptions(): ChartConfiguration<'bubble'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: this.i18n.t('chart.year') } },
        y: {
          min: 0.5,
          max: 5,
          ticks: { stepSize: 0.5 },
          title: { display: true, text: this.i18n.t('chart.avgRating') },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => {
              const raw = context.raw as { x: number; y: number; r: number; platform?: string };
              const platform = raw.platform ?? this.i18n.t('chart.platform');
              return `${platform}: ${raw.y}`;
            },
          },
        },
      },
    };
  }

  readonly signature = computed(() => {
    const list = this.platforms();
    if (list.length === 0) {
      return null;
    }
    const mostPlayed = list[0];
    const highestAvg = [...list].sort((a, b) => b.average - a.average)[0];
    const consistent = [...list]
      .filter(item => item.count >= 5)
      .sort((a, b) => a.stdDev - b.stdDev)[0];
    return { mostPlayed, highestAvg, consistent };
  });
}

function buildPlatformStats(rows: VoteRow[], unknownLabel: string): PlatformStats[] {
  const map = new Map<string, number[]>();
  for (const row of rows) {
    if (row.rating === null) {
      continue;
    }
    const platform = row.platform ?? unknownLabel;
    const list = map.get(platform) ?? [];
    list.push(row.rating);
    map.set(platform, list);
  }
  return [...map.entries()]
    .map(([name, ratings]) => ({
      name,
      count: ratings.length,
      average: mean(ratings),
      stdDev: stdDev(ratings),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildYearPlatform(rows: VoteRow[], unknownLabel: string): YearPlatform[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    if (row.rating === null || row.year === null) {
      continue;
    }
    const key = `${row.year}|${row.platform ?? unknownLabel}`;
    const entry = map.get(key) ?? { total: 0, count: 0 };
    entry.total += row.rating;
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.entries()].map(([key, data]) => {
    const [yearRaw, platformRaw] = key.split('|');
    const year = Number(yearRaw);
    const platform = platformRaw ?? unknownLabel;
    return { year, platform, count: data.count, average: data.total / Math.max(data.count, 1) };
  });
}

function buildEraPeaks(series: YearPlatform[]): EraPeak[] {
  const map = new Map<string, { platform: string; total: number; count: number }>();
  for (const item of series) {
    const decade = Math.floor(item.year / 10) * 10;
    const era = `${String(decade).slice(2)}'s`;
    const key = `${decade}|${item.platform}`;
    const entry = map.get(key) ?? { platform: item.platform, total: 0, count: 0 };
    entry.total += item.average * item.count;
    entry.count += item.count;
    map.set(key, entry);
  }
  const byEra = new Map<string, EraPeak>();
  for (const [key, data] of map.entries()) {
    const [decadeRaw] = key.split('|');
    const decade = Number(decadeRaw);
    const era = Number.isFinite(decade) ? `${String(decade).slice(2)}'s` : 'Unknown';
    const average = data.total / Math.max(data.count, 1);
    const existing = byEra.get(era);
    if (!existing || data.count > existing.count) {
      byEra.set(era, { era, decade, platform: data.platform, average, count: data.count });
    }
  }
  return [...byEra.values()].sort((a, b) => a.decade - b.decade);
}

function buildEraLows(series: YearPlatform[]): EraPeak[] {
  const map = new Map<string, { platform: string; total: number; count: number }>();
  for (const item of series) {
    const decade = Math.floor(item.year / 10) * 10;
    const key = `${decade}|${item.platform}`;
    const entry = map.get(key) ?? { platform: item.platform, total: 0, count: 0 };
    entry.total += item.average * item.count;
    entry.count += item.count;
    map.set(key, entry);
  }
  const byEra = new Map<string, EraPeak>();
  for (const [key, data] of map.entries()) {
    const [decadeRaw] = key.split('|');
    const decade = Number(decadeRaw);
    const era = Number.isFinite(decade) ? `${String(decade).slice(2)}'s` : 'Unknown';
    const average = data.total / Math.max(data.count, 1);
    const existing = byEra.get(era);
    if (!existing || data.count < existing.count) {
      byEra.set(era, { era, decade, platform: data.platform, average, count: data.count });
    }
  }
  return [...byEra.values()].sort((a, b) => a.decade - b.decade);
}

function mapYearPlatform(series: YearPlatform[], platforms: string[]) {
  const map = new Map<string, YearPlatform>();
  for (const item of series) {
    if (!platforms.includes(item.platform)) {
      continue;
    }
    map.set(`${item.year}|${item.platform}`, item);
  }
  return map;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function stdDev(values: number[]): number {
  const avg = mean(values);
  const variance = mean(values.map(value => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function palette(index: number): string {
  const colors = ['#0f6b5f', '#d8a42a', '#c95a4f', '#315c7a', '#8a4d8f', '#5a7d4f'];
  return colors[index % colors.length] ?? '#0f6b5f';
}

function transparentize(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
