import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-best-games-year',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './best-games-year.component.html',
  styleUrls: ['./best-games-year.component.css'],
})
export class BestGamesYearComponent {
  readonly year = input.required<number>();
  readonly meta = input.required<string>();
}
