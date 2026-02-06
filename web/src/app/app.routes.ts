import { Routes } from '@angular/router';
import { OverviewPageComponent } from './pages/overview-page.component';
import { TimelinePageComponent } from './pages/timeline-page.component';
import { PlatformsPageComponent } from './pages/platforms-page.component';
import { GamesPageComponent } from './pages/games-page.component';
import { FunPageComponent } from './pages/fun-page.component';
import { GemsPageComponent } from './pages/gems-page.component';
import { SnakePageComponent } from './pages/snake-page.component';
import { LibraryPageComponent } from './pages/library-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewPageComponent },
  { path: 'timeline', component: TimelinePageComponent },
  { path: 'platforms', component: PlatformsPageComponent },
  { path: 'games', component: GamesPageComponent },
  { path: 'fun', component: FunPageComponent },
  { path: 'gems', component: GemsPageComponent },
  { path: 'snake', component: SnakePageComponent },
  { path: 'library', component: LibraryPageComponent },
  { path: '**', redirectTo: 'overview' },
];
