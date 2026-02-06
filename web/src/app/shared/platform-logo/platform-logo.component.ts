import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-logo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platform-logo.component.html',
  styleUrls: ['./platform-logo.component.css'],
})
export class PlatformLogoComponent {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly size = input<number>(28);
}
