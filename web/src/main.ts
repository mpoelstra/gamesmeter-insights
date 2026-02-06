import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { NgChartsConfiguration, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

const chartTheme: NgChartsConfiguration = {
  defaults: {
    font: {
      family: '"IBM Plex Sans", "Segoe UI", sans-serif',
    },
    color: '#5b5f65',
    plugins: {
      tooltip: {
        backgroundColor: '#1c1c1c',
        titleColor: '#ffffff',
        bodyColor: '#f5f2ec',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
      legend: {
        labels: {
          color: '#5b5f65',
          boxWidth: 12,
          usePointStyle: true,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(28, 28, 28, 0.08)',
        },
        ticks: {
          color: '#5b5f65',
        },
        title: {
          color: '#5b5f65',
        },
      },
      y: {
        grid: {
          color: 'rgba(28, 28, 28, 0.08)',
        },
        ticks: {
          color: '#5b5f65',
        },
        title: {
          color: '#5b5f65',
        },
      },
    },
  },
};

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideCharts(withDefaultRegisterables(), chartTheme),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
  ],
}).catch(error => console.error(error));
