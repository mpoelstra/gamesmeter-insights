import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamerProfile } from '../../models';

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
}
