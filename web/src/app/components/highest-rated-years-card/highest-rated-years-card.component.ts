import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { YearSummary } from '../../models';
import { I18nService } from '../../i18n.service';
import { ChartCardComponent } from '../../shared/chart-card/chart-card.component';

@Component({
  selector: 'app-highest-rated-years-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, ChartCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './highest-rated-years-card.component.html',
  styleUrls: ['./highest-rated-years-card.component.css'],
})
export class HighestRatedYearsCardComponent {
  readonly years = input.required<YearSummary[]>();
  readonly i18n = inject(I18nService);

  readonly chartType: ChartType = 'bar';

  get chartData(): ChartData<'bar'> {
    const sorted = [...this.years()].sort((a, b) => b.average - a.average).slice(0, 5);
    return {
      labels: sorted.map(item => String(item.year)),
      datasets: [
        {
          data: sorted.map(item => Number(item.average.toFixed(2))),
          label: this.i18n.t('chart.averageRating'),
          backgroundColor: 'rgba(15, 107, 95, 0.35)',
          borderColor: '#0f6b5f',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }

  get counts() {
    return [...this.years()].sort((a, b) => b.average - a.average).slice(0, 5).map(item => item.count);
  }

  get chartOptions(): ChartConfiguration<'bar'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          min: 0.5,
          max: 5,
          ticks: { stepSize: 0.5 },
          title: { display: true, text: this.i18n.t('chart.avgRating') },
        },
        y: {
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => {
              const count = this.counts[context.dataIndex] ?? 0;
              return `${this.i18n.t('label.avg')} ${context.parsed.x} • ${count} ${this.i18n.t('label.games')}`;
            },
          },
        },
      },
    };
  }
}
