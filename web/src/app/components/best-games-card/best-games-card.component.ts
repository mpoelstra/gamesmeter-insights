import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
}
