import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { GeneralStats, TrendInsight } from '../../models';
import { formatRating } from '../../insights';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-general-stats-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './general-stats-card.component.html',
  styleUrls: ['./general-stats-card.component.css'],
})
export class GeneralStatsCardComponent {
  readonly stats = input.required<GeneralStats>();
  readonly trend = input.required<TrendInsight>();
  readonly i18n = inject(I18nService);

  formatRating(value: number): string {
    return formatRating(value);
  }

  readonly chartType: ChartType = 'line';

  get trendData(): ChartData<'line'> {
    const labels = this.trend().points.map(point => String(point.year));
    const data = this.trend().points.map(point => Number(point.value.toFixed(2)));
    return {
      labels,
      datasets: [
        {
          data,
          label: this.i18n.t('chart.avgRating'),
          borderColor: '#0f6b5f',
          backgroundColor: 'rgba(15, 107, 95, 0.15)',
          pointBackgroundColor: '#0b4f47',
          pointRadius: 3,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }

  get chartOptions(): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: this.i18n.t('chart.year') },
          grid: { color: 'rgba(28, 28, 28, 0.08)' },
        },
        y: {
          title: { display: true, text: this.i18n.t('chart.avgRating') },
          min: 0.5,
          max: 5,
          ticks: { stepSize: 0.5 },
          grid: { color: 'rgba(28, 28, 28, 0.08)' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
    };
  }
}
