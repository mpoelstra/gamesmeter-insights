import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HiddenGemsCardComponent } from '../components/hidden-gems-card/hidden-gems-card.component';

@Component({
  selector: 'app-gems-page',
  standalone: true,
  imports: [HiddenGemsCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <app-hidden-gems-card />
    </section>
  `,
  styles: [':host { display: block; }'],
})
export class GemsPageComponent {}
