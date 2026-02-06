import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-hidden-gems-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hidden-gems-card.component.html',
  styleUrls: ['./hidden-gems-card.component.css'],
})
export class HiddenGemsCardComponent {
  readonly i18n = inject(I18nService);
}
