import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrendInsight } from '../../models';

@Component({
  selector: 'app-trend-summary-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-summary-card.component.html',
  styleUrls: ['./trend-summary-card.component.css'],
})
export class TrendSummaryCardComponent {
  readonly trend = input.required<TrendInsight>();
}
