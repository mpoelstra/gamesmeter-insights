import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FunStatsDashboardComponent } from '../components/fun-stats-dashboard/fun-stats-dashboard.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-fun-page',
  standalone: true,
  imports: [FunStatsDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <app-fun-stats-dashboard [rows]="allRows()" />
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class FunPageComponent {
  private readonly insights = inject(InsightsService);

  readonly allRows = this.insights.allRows;
}
