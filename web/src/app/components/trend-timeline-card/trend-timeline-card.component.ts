import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { YearSummary } from '../../models';
import { I18nService } from '../../i18n.service';
import { ChartCardComponent } from '../../shared/chart-card/chart-card.component';

@Component({
  selector: 'app-trend-timeline-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, ChartCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-timeline-card.component.html',
  styleUrls: ['./trend-timeline-card.component.css'],
})
export class TrendTimelineCardComponent {
  readonly summaries = input.required<YearSummary[]>();
  readonly i18n = inject(I18nService);

  readonly chartType: ChartType = 'bubble';

  get chartData(): ChartData<'bubble' | 'line'> {
    const sorted = [...this.summaries()].sort((a, b) => a.year - b.year);
    const points = sorted.map(summary => ({
      x: summary.year,
      y: Number(summary.average.toFixed(2)),
      r: Math.max(4, Math.min(14, Math.sqrt(summary.count) + 2)),
    }));

    const rolling = buildRollingAverage(sorted, 3).map(point => ({
      x: point.year,
      y: Number(point.value.toFixed(2)),
    }));

    return {
      datasets: [
        {
          type: 'bubble',
          label: this.i18n.t('chart.yearlyAvg'),
          data: points,
          backgroundColor: 'rgba(15, 107, 95, 0.35)',
          borderColor: '#0f6b5f',
          borderWidth: 1.5,
        },
        {
          type: 'line',
          label: this.i18n.t('chart.rollingAvg'),
          data: rolling,
          borderColor: '#0b4f47',
          backgroundColor: 'rgba(11, 79, 71, 0.12)',
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    };
  }

  get chartOptions(): ChartConfiguration<'bubble' | 'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: this.i18n.t('chart.year') },
          ticks: {
            stepSize: 5,
            callback: value => String(value).replace(/,/g, ''),
          },
        },
        y: {
          min: 0.5,
          max: 5,
          ticks: { stepSize: 0.5 },
          title: { display: true, text: this.i18n.t('chart.avgRating') },
        },
      },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: context => {
              const isLine = context.dataset.type === 'line';
              if (isLine) {
                return `${this.i18n.t('chart.rollingAvgShort')}: ${context.parsed.y}`;
              }
              const count = sortedCountAt(this.summaries(), Number(context.parsed.x));
              return `${this.i18n.t('label.avg')} ${context.parsed.y} • ${count} ${this.i18n.t('label.games')}`;
            },
          },
        },
      },
    };
  }
}

function buildRollingAverage(summaries: YearSummary[], windowSize: number) {
  const result: Array<{ year: number; value: number }> = [];
  for (let i = 0; i < summaries.length; i += 1) {
    const current = summaries[i];
    if (!current) {
      continue;
    }
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(summaries.length, start + windowSize);
    const slice = summaries.slice(start, end);
    const avg = slice.reduce((sum, item) => sum + item.average, 0) / slice.length;
    result.push({ year: current.year, value: avg });
  }
  return result;
}

function sortedCountAt(summaries: YearSummary[], year: number): number {
  const match = summaries.find(item => item.year === year);
  return match ? match.count : 0;
}
