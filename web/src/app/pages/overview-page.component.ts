import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GamerProfileCardComponent } from '../components/gamer-profile-card/gamer-profile-card.component';
import { GeneralStatsCardComponent } from '../components/general-stats-card/general-stats-card.component';
import { PlatformPeaksCardComponent } from '../components/platform-peaks-card/platform-peaks-card.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [GamerProfileCardComponent, GeneralStatsCardComponent, PlatformPeaksCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="grid">
        <app-gamer-profile-card [profile]="profile()" />
        <app-general-stats-card [stats]="stats()" [trend]="trend()" />
      </div>

      <div class="full-width">
        <app-platform-peaks-card [rows]="allRows()" (platformSelected)="openLibraryForPlatform($event)" />
      </div>
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class OverviewPageComponent {
  private readonly insights = inject(InsightsService);
  private readonly router = inject(Router);

  readonly profile = this.insights.profile;
  readonly stats = this.insights.stats;
  readonly trend = this.insights.trend;
  readonly allRows = this.insights.allRows;

  openLibraryForPlatform(platform: string) {
    this.router.navigate(['/library'], { queryParams: { platform } });
  }
}
