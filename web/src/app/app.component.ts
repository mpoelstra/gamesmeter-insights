import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightsService } from './services/insights.service';
import {
  BestGamesCardComponent,
  FunStatsDashboardComponent,
  GamerProfileCardComponent,
  GamesLibraryComponent,
  GeneralStatsCardComponent,
  HiddenGemsCardComponent,
  HighestRatedYearsCardComponent,
  PlatformPeaksCardComponent,
  PlatformsDashboardComponent,
  RatingsDistributionCardComponent,
  TrendSummaryCardComponent,
  TrendTimelineCardComponent,
  YearAveragesCardComponent,
} from './components';

const TAB_OVERVIEW = 'overview';
const TAB_TIMELINE = 'timeline';
const TAB_GAMES = 'games';
const TAB_GEMS = 'gems';
const TAB_LIBRARY = 'library';
const TAB_PLATFORMS = 'platforms';
const TAB_FUN = 'fun';

type TabKey =
  | typeof TAB_OVERVIEW
  | typeof TAB_TIMELINE
  | typeof TAB_GAMES
  | typeof TAB_GEMS
  | typeof TAB_LIBRARY
  | typeof TAB_PLATFORMS
  | typeof TAB_FUN;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GamerProfileCardComponent,
    GeneralStatsCardComponent,
    RatingsDistributionCardComponent,
    PlatformPeaksCardComponent,
    PlatformsDashboardComponent,
    HighestRatedYearsCardComponent,
    YearAveragesCardComponent,
  BestGamesCardComponent,
    FunStatsDashboardComponent,
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
  readonly libraryPlatform = signal<string>('all');

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
    if (tab === TAB_LIBRARY) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  clearCache() {
    this.insights.reset();
    this.activeTab.set(TAB_OVERVIEW);
  }

  openLibraryForPlatform(platform: string) {
    this.libraryPlatform.set(platform);
    this.activeTab.set(TAB_LIBRARY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
