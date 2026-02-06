import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platform-stat-card.component.html',
  styleUrls: ['./platform-stat-card.component.css'],
})
export class PlatformStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly meta = input<string | null>(null);
  readonly variant = input<'default' | 'low'>('default');
}
