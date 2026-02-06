import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { GeneralStats } from '../../models';
import { I18nService } from '../../i18n.service';
import { ChartCardComponent } from '../../shared/chart-card/chart-card.component';

@Component({
  selector: 'app-ratings-distribution-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, ChartCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ratings-distribution-card.component.html',
  styleUrls: ['./ratings-distribution-card.component.css'],
})
export class RatingsDistributionCardComponent {
  readonly stats = input.required<GeneralStats>();
  readonly i18n = inject(I18nService);

  readonly chartType: ChartType = 'bar';

  get chartData(): ChartData<'bar'> {
    return {
      labels: this.stats().ratingBuckets.map(bucket => bucket.label),
      datasets: [
        {
          data: this.stats().ratingBuckets.map(bucket => bucket.count),
          label: this.i18n.t('chart.count'),
          backgroundColor: 'rgba(15, 107, 95, 0.35)',
          borderColor: '#0f6b5f',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }

  get chartOptions(): ChartConfiguration<'bar'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: this.i18n.t('chart.rating') },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: this.i18n.t('chart.count') },
          beginAtZero: true,
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
