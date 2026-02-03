import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { GeneralStats } from '../../models';

@Component({
  selector: 'app-ratings-distribution-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ratings-distribution-card.component.html',
  styleUrls: ['./ratings-distribution-card.component.css'],
})
export class RatingsDistributionCardComponent {
  readonly stats = input.required<GeneralStats>();

  readonly chartType: ChartType = 'bar';

  get chartData(): ChartData<'bar'> {
    return {
      labels: this.stats().ratingBuckets.map(bucket => bucket.label),
      datasets: [
        {
          data: this.stats().ratingBuckets.map(bucket => bucket.count),
          label: 'Count',
          backgroundColor: 'rgba(15, 107, 95, 0.35)',
          borderColor: '#0f6b5f',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: 'Rating' },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: 'Count' },
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
