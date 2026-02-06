import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { YearSummary } from '../../models';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-year-averages-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './year-averages-card.component.html',
  styleUrls: ['./year-averages-card.component.css'],
})
export class YearAveragesCardComponent {
  readonly summaries = input.required<YearSummary[]>();
  readonly i18n = inject(I18nService);

  readonly chartType: ChartType = 'bar';

  get chartData(): ChartData<'bar' | 'line'> {
    const sorted = [...this.summaries()].sort((a, b) => a.year - b.year);
    const labels = sorted.map(summary => String(summary.year));
    const averages = sorted.map(summary => Number(summary.average.toFixed(2)));
    const counts = sorted.map(summary => summary.count);

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: this.i18n.t('chart.gamesRated'),
          data: counts,
          yAxisID: 'y1',
          backgroundColor: 'rgba(15, 107, 95, 0.15)',
          borderColor: 'rgba(15, 107, 95, 0.4)',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          type: 'line',
          label: this.i18n.t('chart.averageRating'),
          data: averages,
          yAxisID: 'y',
          borderColor: '#0f6b5f',
          backgroundColor: 'rgba(15, 107, 95, 0.2)',
          pointRadius: 3,
          tension: 0.35,
        },
      ],
    };
  }

  get chartOptions(): ChartConfiguration<'bar' | 'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          position: 'left',
          min: 0.5,
          max: 5,
          ticks: { stepSize: 0.5 },
          title: { display: true, text: this.i18n.t('chart.avgRating') },
        },
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: this.i18n.t('chart.gamesRated') },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { enabled: true },
      },
    };
  }
}
