import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteRow } from '../../models';
import { I18nService } from '../../i18n.service';

interface PlatformPeak {
  name: string;
  count: number;
  average: number;
}

@Component({
  selector: 'app-platform-peaks-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './platform-peaks-card.component.html',
  styleUrls: ['./platform-peaks-card.component.css'],
})
export class PlatformPeaksCardComponent {
  readonly rows = input.required<VoteRow[]>();
  readonly platformSelected = output<string>();
  readonly i18n = inject(I18nService);

  readonly peaks = computed<PlatformPeak[]>(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const row of this.rows()) {
      const platform = row.platform ?? this.i18n.t('label.platformUnknown');
      const rating = row.rating;
      if (rating === null) {
        continue;
      }
      const entry = map.get(platform) ?? { total: 0, count: 0 };
      entry.total += rating;
      entry.count += 1;
      map.set(platform, entry);
    }
    return [...map.entries()]
      .map(([name, data]) => ({
        name,
        count: data.count,
        average: data.total / Math.max(data.count, 1),
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly totalPlatforms = computed(() => this.peaks().length);

  barWidth(value: number): number {
    return Math.max(0, Math.min(100, (value / 5) * 100));
  }

  selectPlatform(platform: string) {
    this.platformSelected.emit(platform);
  }
}
