import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.css'],
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
