import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-cover-image',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cover-image.component.html',
  styleUrls: ['./cover-image.component.css'],
})
export class CoverImageComponent {
  readonly src = input<string | null>(null);
  readonly alt = input<string>('');
  readonly width = input<number>(44);
  readonly height = input<number>(62);
  readonly clickable = input<boolean>(true);
  readonly title = input<string | null>(null);
  readonly platform = input<string | null>(null);
  readonly rating = input<number | null>(null);
  readonly ratedOn = input<string | null>(null);

  readonly fallback = 'assets/cover-placeholder.svg';
  readonly open = signal(false);

  onError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (img && img.src !== this.fallback) {
      img.src = this.fallback;
    }
  }

  showPreview() {
    if (!this.clickable()) {
      return;
    }
    this.open.set(true);
  }

  closePreview() {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open()) {
      this.closePreview();
    }
  }
}
