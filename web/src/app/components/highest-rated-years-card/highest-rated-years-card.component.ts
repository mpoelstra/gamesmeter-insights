import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { YearSummary } from '../../models';

@Component({
  selector: 'app-highest-rated-years-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './highest-rated-years-card.component.html',
  styleUrls: ['./highest-rated-years-card.component.css'],
})
export class HighestRatedYearsCardComponent {
  readonly years = input.required<YearSummary[]>();

  readonly chartType: ChartType = 'bar';

  get chartData(): ChartData<'bar'> {
    const sorted = [...this.years()].sort((a, b) => b.average - a.average).slice(0, 5);
    return {
      labels: sorted.map(item => String(item.year)),
      datasets: [
        {
          data: sorted.map(item => Number(item.average.toFixed(2))),
          label: 'Average Rating',
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

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        min: 0.5,
        max: 5,
        ticks: { stepSize: 0.5 },
        title: { display: true, text: 'Avg Rating' },
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
            return `Avg ${context.parsed.x} • ${count} games`;
          },
        },
      },
    },
  };
}
