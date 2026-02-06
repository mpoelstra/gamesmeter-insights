import { ChangeDetectionStrategy, Component, afterRenderEffect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteRow } from '../../models';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-games-library',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './games-library.component.html',
  styleUrls: ['./games-library.component.css'],
})
export class GamesLibraryComponent {
  readonly rows = input.required<VoteRow[]>();
  readonly initialPlatform = input<string>('all');
  readonly initialPlatformConsumed = output<void>();
  readonly i18n = inject(I18nService);
  readonly query = signal('');
  readonly platformFilter = signal('all');
  readonly ratingFilter = signal<string>('all');
  readonly yearFilter = signal<string>('all');
  readonly ratedYearFilter = signal<string>('all');
  readonly sortFilter = signal<string>('title');
  readonly letterFilter = signal<string>('all');
  private readonly appliedInitial = signal(false);

  get filteredRows(): VoteRow[] {
    const query = this.query().trim().toLowerCase();
    const platform = this.platformFilter();
    const ratingFilter = this.ratingFilter();
    const yearFilter = this.yearFilter();
    const ratedYearFilter = this.ratedYearFilter();
    const letterFilter = this.letterFilter();
    const exactRating = ratingFilter === 'all' ? null : Number(ratingFilter);

    return this.rows().filter(row => {
      const matchesQuery = query.length === 0 || row.title.toLowerCase().includes(query);
      const matchesPlatform = platform === 'all' || row.platform === platform;
      const matchesYear = yearFilter === 'all' || String(row.year ?? '') === yearFilter;
      const ratedYear = row.placed ? String(row.placed.getFullYear()) : '';
      const matchesRatedYear = ratedYearFilter === 'all' || ratedYear === ratedYearFilter;
      const letter = firstLetter(row.title);
      const matchesLetter = letterFilter === 'all' || letter === letterFilter;
      const rating = row.rating ?? 0;
      const matchesRating = exactRating === null ? true : rating === exactRating;
      return matchesQuery && matchesPlatform && matchesRating && matchesYear && matchesRatedYear && matchesLetter;
    });
  }

  get platforms(): string[] {
    const platformSet = new Set<string>();
    for (const row of this.rows()) {
      if (row.platform) {
        platformSet.add(row.platform);
      }
    }
    return ['all', ...[...platformSet].sort()];
  }

  get years(): string[] {
    const yearSet = new Set<number>();
    for (const row of this.rows()) {
      if (row.year) {
        yearSet.add(row.year);
      }
    }
    const sorted = [...yearSet].sort((a, b) => b - a);
    return ['all', ...sorted.map(year => String(year))];
  }

  get ratedYears(): string[] {
    const yearSet = new Set<number>();
    for (const row of this.rows()) {
      if (row.placed) {
        yearSet.add(row.placed.getFullYear());
      }
    }
    const sorted = [...yearSet].sort((a, b) => b - a);
    return ['all', ...sorted.map(year => String(year))];
  }

  get letters(): string[] {
    const letterSet = new Set<string>();
    for (const row of this.rows()) {
      letterSet.add(firstLetter(row.title));
    }
    const sorted = [...letterSet].sort((a, b) => a.localeCompare(b));
    return ['all', ...sorted];
  }


  get sortedRows(): VoteRow[] {
    return this.sortRows(this.filteredRows);
  }

  trackByTitle(index: number, row: VoteRow): string {
    return `${row.title}-${row.year ?? 'x'}-${row.platform ?? 'x'}`;
  }

  getStarStates(rating: number | null): Array<'full' | 'half' | 'empty'> {
    const value = rating ?? 0;
    const states: Array<'full' | 'half' | 'empty'> = [];
    for (let i = 1; i <= 5; i += 1) {
      if (value >= i) {
        states.push('full');
      } else if (value >= i - 0.5) {
        states.push('half');
      } else {
        states.push('empty');
      }
    }
    return states;
  }

  get totalCount(): number {
    return this.rows().length;
  }

  get filteredCount(): number {
    return this.filteredRows.length;
  }

  highlightParts(title: string): Array<{ text: string; match: boolean }> {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return [{ text: title, match: false }];
    }

    const lowerTitle = title.toLowerCase();
    const parts: Array<{ text: string; match: boolean }> = [];
    let start = 0;

    while (true) {
      const index = lowerTitle.indexOf(query, start);
      if (index === -1) {
        parts.push({ text: title.slice(start), match: false });
        break;
      }
      if (index > start) {
        parts.push({ text: title.slice(start, index), match: false });
      }
      parts.push({ text: title.slice(index, index + query.length), match: true });
      start = index + query.length;
    }

    return parts.filter(part => part.text.length > 0);
  }

  updateQuery(value: string) {
    this.query.set(value);
  }

  updatePlatform(value: string) {
    this.platformFilter.set(value);
  }

  updateYear(value: string) {
    this.yearFilter.set(value);
  }

  updateRatedYear(value: string) {
    this.ratedYearFilter.set(value);
  }

  updateSort(value: string) {
    this.sortFilter.set(value || 'title');
  }

  updateLetter(value: string) {
    this.letterFilter.set(value || 'all');
  }

  get sortOptions(): Array<{ label: string; value: string }> {
    return [
      { label: this.i18n.t('filters.sortTitle'), value: 'title' },
      { label: this.i18n.t('filters.sortRatingHigh'), value: 'ratingDesc' },
      { label: this.i18n.t('filters.sortRatingLow'), value: 'ratingAsc' },
      { label: this.i18n.t('filters.sortReleaseNew'), value: 'yearDesc' },
      { label: this.i18n.t('filters.sortReleaseOld'), value: 'yearAsc' },
      { label: this.i18n.t('filters.sortRatedNew'), value: 'ratedDesc' },
      { label: this.i18n.t('filters.sortRatedOld'), value: 'ratedAsc' },
    ];
  }

  get ratingOptions(): Array<{ label: string; value: string }> {
    const options: Array<{ label: string; value: string }> = [
      { label: this.i18n.t('filters.allRatings'), value: 'all' },
    ];
    for (let value = 5; value >= 0.5; value -= 0.5) {
      const label = this.i18n.t('filters.ratingOnly', { value: value.toFixed(1) });
      options.push({ label, value: value.toFixed(1) });
    }
    return options;
  }

  updateRating(value: string) {
    this.ratingFilter.set(value || 'all');
  }

  clearFilters() {
    this.query.set('');
    this.platformFilter.set('all');
    this.yearFilter.set('all');
    this.ratedYearFilter.set('all');
    this.ratingFilter.set('all');
    this.sortFilter.set('title');
    this.letterFilter.set('all');
  }

  constructor() {
    afterRenderEffect(() => {
      if (this.appliedInitial()) {
        return;
      }
      const platform = this.initialPlatform();
      if (platform && platform !== 'all' && platform !== this.platformFilter()) {
        this.platformFilter.set(platform);
        this.initialPlatformConsumed.emit();
      }
      this.appliedInitial.set(true);
    });
  }

  private sortRows(rows: VoteRow[]): VoteRow[] {
    const mode = this.sortFilter();
    const sorted = [...rows];
    switch (mode) {
      case 'ratingDesc':
        sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title));
        break;
      case 'ratingAsc':
        sorted.sort((a, b) => (a.rating ?? 6) - (b.rating ?? 6) || a.title.localeCompare(b.title));
        break;
      case 'yearDesc':
        sorted.sort((a, b) => (b.year ?? -1) - (a.year ?? -1) || a.title.localeCompare(b.title));
        break;
      case 'yearAsc':
        sorted.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title));
        break;
      case 'ratedDesc':
        sorted.sort(
          (a, b) => (b.placed?.getTime() ?? -1) - (a.placed?.getTime() ?? -1) || a.title.localeCompare(b.title),
        );
        break;
      case 'ratedAsc':
        sorted.sort(
          (a, b) => (a.placed?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.placed?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
            a.title.localeCompare(b.title),
        );
        break;
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }

  letterFor(row: VoteRow): string {
    return firstLetter(row.title);
  }
}

function firstLetter(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return '#';
  }
  const first = trimmed[0]?.toUpperCase() ?? '#';
  return first >= 'A' && first <= 'Z' ? first : '#';
}
