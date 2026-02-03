import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hidden-gems-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hidden-gems-card.component.html',
  styleUrls: ['./hidden-gems-card.component.css'],
})
export class HiddenGemsCardComponent {}
