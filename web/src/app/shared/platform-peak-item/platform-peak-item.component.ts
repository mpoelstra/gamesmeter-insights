import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-peak-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platform-peak-item.component.html',
  styleUrls: ['./platform-peak-item.component.css'],
})
export class PlatformPeakItemComponent {
  readonly name = input.required<string>();
  readonly count = input.required<number>();
  readonly average = input.required<number>();
  readonly labelGames = input.required<string>();
  readonly labelAvg = input.required<string>();
  readonly select = output<string>();

  get barWidth(): number {
    return Math.max(0, Math.min(100, (this.average() / 5) * 100));
  }

  onSelect() {
    this.select.emit(this.name());
  }
}
