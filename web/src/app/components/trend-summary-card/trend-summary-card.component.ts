import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrendInsight } from '../../models';
import { I18nService } from '../../i18n.service';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';

@Component({
  selector: 'app-trend-summary-card',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-summary-card.component.html',
  styleUrls: ['./trend-summary-card.component.css'],
})
export class TrendSummaryCardComponent {
  readonly trend = input.required<TrendInsight>();
  readonly i18n = inject(I18nService);
}
