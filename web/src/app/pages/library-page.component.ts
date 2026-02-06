import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GamesLibraryComponent } from '../components/games-library/games-library.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [GamesLibraryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <app-games-library
        [rows]="allRows()"
        [initialPlatform]="initialPlatform()"
        (initialPlatformConsumed)="clearPlatformParam()"
      />
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class LibraryPageComponent {
  private readonly insights = inject(InsightsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly allRows = this.insights.allRows;
  readonly initialPlatform = signal('all');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.initialPlatform.set(params.get('platform') ?? 'all');
    });
  }

  clearPlatformParam() {
    this.router.navigate([], {
      queryParams: { platform: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
