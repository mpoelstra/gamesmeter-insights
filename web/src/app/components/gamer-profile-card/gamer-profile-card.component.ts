import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamerProfile } from '../../models';
import { I18nService } from '../../i18n.service';

@Component({
  selector: 'app-gamer-profile-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gamer-profile-card.component.html',
  styleUrls: ['./gamer-profile-card.component.css'],
})
export class GamerProfileCardComponent {
  readonly profile = input.required<GamerProfile>();
  readonly i18n = inject(I18nService);
}
