import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlatformsDashboardComponent } from '../components/platforms-dashboard/platforms-dashboard.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-platforms-page',
  standalone: true,
  imports: [PlatformsDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <app-platforms-dashboard [rows]="allRows()" />
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class PlatformsPageComponent {
  private readonly insights = inject(InsightsService);

  readonly allRows = this.insights.allRows;
}
