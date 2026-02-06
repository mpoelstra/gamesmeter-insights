import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { InsightsService } from './services/insights.service';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  private readonly insights = inject(InsightsService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly fileName = this.insights.fileName;
  readonly status = this.insights.status;
  readonly stats = this.insights.stats;
  readonly trend = this.insights.trend;
  readonly profile = this.insights.profile;
  readonly yearSummaries = this.insights.yearSummaries;
  readonly highestRatedYears = this.insights.highestRatedYears;
  readonly allRows = this.insights.allRows;
  constructor() {}

  readonly statusMessage = computed(() => {
    switch (this.status()) {
      case 'ready':
        return this.i18n.t('status.ready');
      case 'error':
        return this.i18n.t('status.error');
      default:
        return this.i18n.t('status.empty');
    }
  });

  clearCache() {
    this.insights.reset();
    this.router.navigateByUrl('/overview');
  }

  async loadSample() {
    try {
      const response = await fetch('assets/sample.csv');
      const text = await response.text();
      this.insights.loadCsvText(text, this.i18n.t('file.sample'));
      this.router.navigateByUrl('/overview');
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
        this.router.navigateByUrl('/overview');
      }
    };
    reader.onerror = () => {
      this.insights.reset();
    };
    reader.readAsText(file);
  }

}
