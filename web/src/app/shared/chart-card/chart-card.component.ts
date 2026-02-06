import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent } from '../section-header/section-header.component';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart-card.component.html',
  styleUrls: ['./chart-card.component.css'],
})
export class ChartCardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
