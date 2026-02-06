import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HighestRatedYearsCardComponent } from '../components/highest-rated-years-card/highest-rated-years-card.component';
import { YearAveragesCardComponent } from '../components/year-averages-card/year-averages-card.component';
import { TrendSummaryCardComponent } from '../components/trend-summary-card/trend-summary-card.component';
import { TrendTimelineCardComponent } from '../components/trend-timeline-card/trend-timeline-card.component';
import { RatingsDistributionCardComponent } from '../components/ratings-distribution-card/ratings-distribution-card.component';
import { InsightsService } from '../services/insights.service';

@Component({
  selector: 'app-timeline-page',
  standalone: true,
  imports: [
    HighestRatedYearsCardComponent,
    YearAveragesCardComponent,
    TrendSummaryCardComponent,
    TrendTimelineCardComponent,
    RatingsDistributionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="grid">
        <app-highest-rated-years-card [years]="highestRatedYears()" />
        <app-year-averages-card [summaries]="yearSummaries()" />
      </div>
      <div class="grid">
        <app-trend-summary-card [trend]="trend()" />
        <app-trend-timeline-card [summaries]="yearSummaries()" />
      </div>
      <div class="full-width">
        <app-ratings-distribution-card [stats]="stats()" />
      </div>
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class TimelinePageComponent {
  private readonly insights = inject(InsightsService);

  readonly highestRatedYears = this.insights.highestRatedYears;
  readonly yearSummaries = this.insights.yearSummaries;
  readonly trend = this.insights.trend;
  readonly stats = this.insights.stats;
}
