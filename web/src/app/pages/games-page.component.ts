import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BestGamesCardComponent } from '../components/best-games-card/best-games-card.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-games-page',
  standalone: true,
  imports: [BestGamesCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <app-best-games-card [summaries]="yearSummaries()" />
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class GamesPageComponent {
  private readonly insights = inject(InsightsService);

  readonly yearSummaries = this.insights.yearSummaries;
}
