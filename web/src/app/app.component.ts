import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightsService } from './services/insights.service';
import {
  BestGamesCardComponent,
  GamerProfileCardComponent,
  GamesLibraryComponent,
  GeneralStatsCardComponent,
  HiddenGemsCardComponent,
  HighestRatedYearsCardComponent,
  PlatformPeaksCardComponent,
  RatingsDistributionCardComponent,
  TrendSummaryCardComponent,
  TrendTimelineCardComponent,
  YearAveragesCardComponent,
} from './components';

const TAB_OVERVIEW = 'overview';
const TAB_YEARS = 'years';
const TAB_GAMES = 'games';
const TAB_TRENDS = 'trends';
const TAB_GEMS = 'gems';
const TAB_LIBRARY = 'library';

type TabKey =
  | typeof TAB_OVERVIEW
  | typeof TAB_YEARS
  | typeof TAB_GAMES
  | typeof TAB_TRENDS
  | typeof TAB_GEMS
  | typeof TAB_LIBRARY;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GamerProfileCardComponent,
    GeneralStatsCardComponent,
    RatingsDistributionCardComponent,
    PlatformPeaksCardComponent,
    HighestRatedYearsCardComponent,
    YearAveragesCardComponent,
    BestGamesCardComponent,
    TrendSummaryCardComponent,
    TrendTimelineCardComponent,
    HiddenGemsCardComponent,
    GamesLibraryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  private readonly insights = inject(InsightsService);

  readonly activeTab = signal<TabKey>(TAB_OVERVIEW);

  readonly fileName = this.insights.fileName;
  readonly status = this.insights.status;
  readonly stats = this.insights.stats;
  readonly trend = this.insights.trend;
  readonly profile = this.insights.profile;
  readonly yearSummaries = this.insights.yearSummaries;
  readonly highestRatedYears = this.insights.highestRatedYears;
  readonly allRows = this.insights.allRows;

  readonly statusMessage = computed(() => {
    switch (this.status()) {
      case 'ready':
        return 'Report generated locally in your browser.';
      case 'error':
        return 'Unable to read CSV. Please confirm the GamesMeter export format.';
      default:
        return 'Your CSV never leaves the browser.';
    }
  });

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  clearCache() {
    this.insights.reset();
    this.activeTab.set(TAB_OVERVIEW);
  }

  async loadSample() {
    try {
      const response = await fetch('assets/sample.csv');
      const text = await response.text();
      this.insights.loadCsvText(text, 'Sample CSV');
      this.activeTab.set(TAB_OVERVIEW);
    } catch (error) {
      console.error(error);
      this.insights.reset();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.insights.loadCsvText(reader.result, file.name);
        this.activeTab.set(TAB_OVERVIEW);
      }
    };
    reader.onerror = () => {
      this.insights.reset();
    };
    reader.readAsText(file);
  }
}
