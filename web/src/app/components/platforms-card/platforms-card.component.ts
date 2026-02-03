import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralStats } from '../../models';

@Component({
  selector: 'app-platforms-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platforms-card.component.html',
  styleUrls: ['./platforms-card.component.css'],
})
export class PlatformsCardComponent {
  readonly stats = input.required<GeneralStats>();
}
