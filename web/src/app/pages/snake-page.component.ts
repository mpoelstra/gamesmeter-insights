import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SnakeGameComponent } from '../components/snake-game/snake-game.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-snake-page',
  standalone: true,
  imports: [SnakeGameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <app-snake-game [rows]="allRows()" />
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class SnakePageComponent {
  private readonly insights = inject(InsightsService);

  readonly allRows = this.insights.allRows;
}
