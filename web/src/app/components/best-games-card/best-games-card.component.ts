import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YearSummary } from '../../models';

@Component({
  selector: 'app-best-games-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './best-games-card.component.html',
  styleUrls: ['./best-games-card.component.css'],
})
export class BestGamesCardComponent {
  readonly summaries = input.required<YearSummary[]>();
  readonly yearFilter = signal<string>('all');

  get yearOptions(): string[] {
    return ['all', ...this.summaries().map(summary => String(summary.year))];
  }

  readonly filteredSummaries = computed<YearSummary[]>(() => {
    const filter = this.yearFilter();
    if (filter === 'all') {
      return this.summaries();
    }
    return this.summaries().filter(summary => String(summary.year) === filter);
  });

  updateYear(value: string) {
    this.yearFilter.set(value);
  }
}
