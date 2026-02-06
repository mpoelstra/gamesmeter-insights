import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating-stars.component.html',
  styleUrls: ['./rating-stars.component.css'],
})
export class RatingStarsComponent {
  readonly rating = input<number | null>(null);
  readonly size = input<number>(28);

  get starStates(): Array<'full' | 'half' | 'empty'> {
    const value = this.rating() ?? 0;
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
}
