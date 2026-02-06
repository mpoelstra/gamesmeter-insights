import { ChangeDetectionStrategy, Component, OnDestroy, afterRenderEffect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteRow } from '../../models';
import { I18nService } from '../../i18n.service';

interface GameGroup {
  letter: string;
  items: VoteRow[];
}

@Component({
  selector: 'app-games-library',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './games-library.component.html',
  styleUrls: ['./games-library.component.css'],
})
export class GamesLibraryComponent implements OnDestroy {
  readonly rows = input.required<VoteRow[]>();
  readonly initialPlatform = input<string>('all');
  readonly i18n = inject(I18nService);
  readonly query = signal('');
  readonly platformFilter = signal('all');
  readonly ratingFilter = signal<string>('all');
  readonly yearFilter = signal<string>('all');
  readonly activeLetter = signal<string | null>(null);
  private observer: IntersectionObserver | null = null;
  private isAutoScrolling = false;
  private autoScrollTarget: string | null = null;
  private readonly appliedInitial = signal(false);

  get filteredRows(): VoteRow[] {
    const query = this.query().trim().toLowerCase();
    const platform = this.platformFilter();
    const ratingFilter = this.ratingFilter();
    const yearFilter = this.yearFilter();
    const minRating = ratingFilter === 'all' ? null : Number(ratingFilter);

    return this.rows().filter(row => {
      const matchesQuery = query.length === 0 || row.title.toLowerCase().includes(query);
      const matchesPlatform = platform === 'all' || row.platform === platform;
      const matchesYear = yearFilter === 'all' || String(row.year ?? '') === yearFilter;
      const rating = row.rating ?? 0;
      const matchesRating = minRating === null ? true : rating >= minRating;
      return matchesQuery && matchesPlatform && matchesRating && matchesYear;
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


  get groups(): GameGroup[] {
    const map = new Map<string, VoteRow[]>();
    const sorted = [...this.filteredRows].sort((a, b) => a.title.localeCompare(b.title));
    for (const row of sorted) {
      const letter = firstLetter(row.title);
      const list = map.get(letter) ?? [];
      list.push(row);
      map.set(letter, list);
    }
    return [...map.entries()]
      .map(([letter, items]) => ({ letter, items }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  }

  get indexLetters(): string[] {
    return this.groups.map(group => group.letter);
  }

  trackByLetter(index: number, group: GameGroup): string {
    return group.letter;
  }

  trackByTitle(index: number, row: VoteRow): string {
    return `${row.title}-${row.year ?? 'x'}-${row.platform ?? 'x'}`;
  }

  scrollTo(letter: string) {
    const target = document.getElementById(`letter-${letter}`);
    if (!target) {
      return;
    }
    this.activeLetter.set(letter);
    this.isAutoScrolling = true;
    this.autoScrollTarget = letter;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    this.setupObserver();
  }

  updatePlatform(value: string) {
    this.platformFilter.set(value);
    this.setupObserver();
  }

  updateYear(value: string) {
    this.yearFilter.set(value);
    this.setupObserver();
  }

  get ratingOptions(): Array<{ label: string; value: string }> {
    const options: Array<{ label: string; value: string }> = [
      { label: this.i18n.t('filters.allRatings'), value: 'all' },
    ];
    for (let value = 5; value >= 0.5; value -= 0.5) {
      const label =
        value === 5
          ? this.i18n.t('filters.ratingOnly', { value: value.toFixed(1) })
          : this.i18n.t('filters.ratingAndAbove', { value: value.toFixed(1) });
      options.push({ label, value: value.toFixed(1) });
    }
    return options;
  }

  updateRating(value: string) {
    this.ratingFilter.set(value || 'all');
    this.setupObserver();
  }

  constructor() {
    afterRenderEffect(() => {
      if (this.appliedInitial()) {
        return;
      }
      const platform = this.initialPlatform();
      if (platform && platform !== 'all' && platform !== this.platformFilter()) {
        this.platformFilter.set(platform);
      }
      this.appliedInitial.set(true);
    });

    afterRenderEffect(() => {
      this.rows();
      this.query();
      this.platformFilter();
      this.ratingFilter();
      this.yearFilter();
      this.setupObserver();
      this.updateActiveFromCurrentScroll();
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupObserver() {
    if (typeof window === 'undefined') {
      return;
    }
    this.observer?.disconnect();
    const sections = document.querySelectorAll<HTMLElement>('.group-header[id^=\"letter-\"]');
    if (sections.length === 0) {
      return;
    }
    this.observer = new IntersectionObserver(
      entries => {
        const focusLine = 140;
        const candidates = entries.filter(entry => entry.isIntersecting);
        const best = candidates.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best?.target) {
          const id = (best.target as HTMLElement).id;
          const letter = id.replace('letter-', '');
          if (this.isAutoScrolling) {
            if (this.autoScrollTarget && letter === this.autoScrollTarget) {
              this.activeLetter.set(letter);
              this.isAutoScrolling = false;
              this.autoScrollTarget = null;
            }
          } else {
            this.activeLetter.set(letter);
          }
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach(section => this.observer?.observe(section));
  }

  private updateActiveFromCurrentScroll() {
    const sections = document.querySelectorAll<HTMLElement>('.group-header[id^="letter-"]');
    if (sections.length === 0) {
      return;
    }
    const focusLine = 140;
    let current: HTMLElement | null = null;
    for (const section of sections) {
      const top = section.getBoundingClientRect().top;
      if (top - focusLine <= 0) {
        current = section;
      } else {
        break;
      }
    }
    const target = current ?? sections[0];
    if (target) {
      this.activeLetter.set(target.id.replace('letter-', ''));
    }
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
