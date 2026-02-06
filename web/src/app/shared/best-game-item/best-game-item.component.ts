import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

@Component({
  selector: 'app-best-game-item',
  standalone: true,
  imports: [CommonModule, RatingStarsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './best-game-item.component.html',
  styleUrls: ['./best-game-item.component.css'],
})
export class BestGameItemComponent {
  readonly title = input.required<string>();
  readonly platform = input.required<string>();
  readonly rating = input<number | null>(null);
  readonly rank = input<number | null>(null);
  readonly ratingLabel = input<string>('');
}
