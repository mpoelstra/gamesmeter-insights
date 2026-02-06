import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YearSummary } from '../../models';
import { I18nService } from '../../i18n.service';
import { BestGameItemComponent } from '../../shared/best-game-item/best-game-item.component';
import { BestGamesYearComponent } from '../../shared/best-games-year/best-games-year.component';
import { COVER_PROXY_BASE } from '../../app.config';

@Component({
  selector: 'app-best-games-card',
  standalone: true,
  imports: [CommonModule, BestGameItemComponent, BestGamesYearComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './best-games-card.component.html',
  styleUrls: ['./best-games-card.component.css'],
})
export class BestGamesCardComponent {
  readonly summaries = input.required<YearSummary[]>();
  readonly yearFilter = signal<string>('all');
  readonly i18n = inject(I18nService);
  private readonly coverProxyBase = inject(COVER_PROXY_BASE);

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

  rankLabel(index: number): string {
    if (index >= 0 && index <= 2) {
      return String(index + 1);
    }
    return '';
  }

  coverUrlFor(id: number | null): string | null {
    if (!id) {
      return null;
    }
    return `${this.coverProxyBase}/${id}`;
  }
}
