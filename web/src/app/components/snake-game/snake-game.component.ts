import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteRow } from '../../models';
import { I18nService } from '../../i18n.service';

interface Cell {
  x: number;
  y: number;
}

interface Obstacle {
  name: string;
  cell: Cell;
  size: number;
  color: string;
}

interface Food {
  cell: Cell;
  rating: number;
  points: number;
  color: string;
}
@Component({
  selector: 'app-snake-game',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './snake-game.component.html',
  styleUrls: ['./snake-game.component.css'],
})
export class SnakeGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('board', { static: true }) boardRef!: ElementRef<HTMLDivElement>;

  readonly rows = input.required<VoteRow[]>();
  readonly i18n = inject(I18nService);

  readonly score = signal(0);
  readonly highScore = signal(0);
  readonly running = signal(false);
  readonly gameOver = signal(false);

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private lastTick = 0;
  private direction: Cell = { x: 1, y: 0 };
  private nextDirection: Cell = { x: 1, y: 0 };
  private snake: Cell[] = [];
  private foods: Food[] = [];
  private pendingGrowth = 0;
  private resizeObserver: ResizeObserver | null = null;
  private readonly gridVersion = signal(0);

  gridWidth = 28;
  gridHeight = 32;
  cellSize = 18;

  readonly obstacles = computed<Obstacle[]>(() => {
    this.gridVersion();
    const platforms = new Set<string>();
    for (const row of this.rows()) {
      if (row.platform) {
        platforms.add(row.platform);
      }
    }
    const names = [...platforms].sort();
    const counts = new Map<string, number>();
    for (const row of this.rows()) {
      if (row.platform) {
        counts.set(row.platform, (counts.get(row.platform) ?? 0) + 1);
      }
    }
    const sortedByCount = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const mostPlayed = sortedByCount[0]?.[0];
    const minCount = sortedByCount[sortedByCount.length - 1]?.[1] ?? 0;
    const maxCount = sortedByCount[0]?.[1] ?? 1;
    const palette = ['#0f6b5f', '#d8a42a', '#c95a4f', '#315c7a', '#8a4d8f', '#5a7d4f', '#c77d2f', '#2e7a8a'];
    const sizeRange = names.length <= 6 ? { min: 9, max: 15 } : { min: 3, max: 9 };
    const used = new Set<string>();
    return names
      .map(name => ({
        name,
        count: counts.get(name) ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .map((entry, index) => {
        let size = scaleObstacleSize(entry.count, minCount, maxCount, sizeRange.min, sizeRange.max);
        if (entry.name === mostPlayed) {
          size = Math.min(sizeRange.max, size + 1);
        }
        let cell = this.pickCellFromName(entry.name, used, size, 1);
        if (!cell && size > 2) {
          size -= 1;
          cell = this.pickCellFromName(entry.name, used, size, 1);
        }
        if (!cell) {
          cell = this.pickCellFromName(entry.name, used, Math.max(2, size), 0) ?? { x: 1, y: 1 };
        }
        reserveCells(cell, size, 1, used, this.gridWidth, this.gridHeight);
        return {
          name: entry.name,
          cell,
          size,
          color: palette[index % palette.length] ?? '#0f6b5f',
        };
      });
  });

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this.restoreHighScore();
    this.setupCanvasSize();
    this.resizeObserver = new ResizeObserver(() => this.setupCanvasSize());
    this.resizeObserver.observe(this.boardRef.nativeElement);
    this.resetGame();
    window.addEventListener('keydown', this.handleKey, { passive: false });
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKey);
    this.resizeObserver?.disconnect();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  startGame() {
    if (this.running()) {
      return;
    }
    if (this.gameOver()) {
      this.resetGame();
    }
    this.running.set(true);
    this.lastTick = performance.now();
    this.loop(this.lastTick);
  }

  resetGame() {
    this.running.set(false);
    this.gameOver.set(false);
    this.score.set(0);
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.pendingGrowth = 0;
    const startX = Math.max(4, Math.floor(this.gridWidth / 3));
    const startY = Math.max(4, Math.floor(this.gridHeight / 2));
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.ensureSnakeClearOfObstacles();
    this.foods = this.randomFoods();
    this.draw();
  }

  private loop = (timestamp: number) => {
    const speed = 120;
    const delta = timestamp - this.lastTick;
    if (delta >= speed) {
      this.lastTick = timestamp;
      this.tick();
    }
    if (this.running()) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private tick() {
    if (this.gameOver()) {
      return;
    }
    this.ensureFoodsInBounds();
    this.direction = this.nextDirection;
    const head = this.snake[0] ?? { x: 0, y: 0 };
    const next = { x: head.x + this.direction.x, y: head.y + this.direction.y };

    if (next.x < 0 || next.y < 0 || next.x >= this.gridWidth || next.y >= this.gridHeight) {
      this.endGame();
      return;
    }

    if (this.snake.some(segment => segment.x === next.x && segment.y === next.y)) {
      this.endGame();
      return;
    }

    if (this.isObstacle(next)) {
      this.endGame();
      return;
    }

    this.snake.unshift(next);

    const foodIndex = this.foods.findIndex(food => food.cell.x === next.x && food.cell.y === next.y);
    if (foodIndex >= 0) {
      const food = this.foods[foodIndex];
      this.score.update(value => value + (food?.points ?? 1));
      this.pendingGrowth += food?.points ?? 1;
      this.maybeUpdateHighScore();
      this.foods.splice(foodIndex, 1);
      if (this.foods.length < 10) {
        this.addFoods(10 - this.foods.length);
      }
    } else {
      if (this.pendingGrowth > 0) {
        this.pendingGrowth -= 1;
      } else {
        this.snake.pop();
      }
    }

    this.draw();
  }

  private endGame() {
    this.running.set(false);
    this.gameOver.set(true);
    this.maybeUpdateHighScore();
  }

  private handleKey = (event: KeyboardEvent) => {
    const key = event.key;
    const map: Record<string, Cell> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
    };
    const next = map[key];
    if (!next) {
      return;
    }
    event.preventDefault();
    const current = this.direction;
    if (current.x + next.x === 0 && current.y + next.y === 0) {
      return;
    }
    this.nextDirection = next;
    if (!this.running()) {
      this.startGame();
    }
  };

  private isObstacle(cell: Cell): boolean {
    return this.obstacles().some(obstacle => {
      return (
        cell.x >= obstacle.cell.x &&
        cell.x < obstacle.cell.x + obstacle.size &&
        cell.y >= obstacle.cell.y &&
        cell.y < obstacle.cell.y + obstacle.size
      );
    });
  }

  private randomFood(taken: Set<string>, forcedRating?: number): Food {
    const buckets = buildRatingBuckets(this.rows());
    const rating = forcedRating ?? pickWeightedRating(buckets);
    const points = ratingPoints(rating);
    const color = ratingColor(rating);
    for (let tries = 0; tries < 200; tries += 1) {
      const cell = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight),
      };
      if (!taken.has(`${cell.x},${cell.y}`)) {
        return { cell, rating, points, color };
      }
    }
    return { cell: { x: 2, y: 2 }, rating, points, color };
  }

  private randomFoods(): Food[] {
    const taken = new Set(this.snake.map(cell => `${cell.x},${cell.y}`));
    for (const obstacle of this.obstacles()) {
      for (let dx = 0; dx < obstacle.size; dx += 1) {
        for (let dy = 0; dy < obstacle.size; dy += 1) {
          taken.add(`${obstacle.cell.x + dx},${obstacle.cell.y + dy}`);
        }
      }
    }
    return this.generateFoods(10, taken);
  }

  private ensureSnakeClearOfObstacles() {
    if (!this.snake.length) {
      return;
    }
    let tries = 0;
    while (tries < 40) {
      const overlaps = this.snake.some(segment => this.isObstacle(segment));
      if (!overlaps) {
        return;
      }
      const startX = Math.max(2, Math.floor(Math.random() * (this.gridWidth - 6)));
      const startY = Math.max(2, Math.floor(Math.random() * (this.gridHeight - 2)));
      this.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];
      tries += 1;
    }
  }

  private pickCellFromName(name: string, used: Set<string>, size: number, padding: number): Cell | null {
    const hash = hashString(name);
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const offset = hash + attempt * 13;
      const cell = {
        x: offset % Math.max(1, this.gridWidth - size),
        y: Math.floor(offset / this.gridWidth) % Math.max(1, this.gridHeight - size),
      };
      let blocked = false;
      for (let dx = -padding; dx < size + padding; dx += 1) {
        for (let dy = -padding; dy < size + padding; dy += 1) {
          const key = `${cell.x + dx},${cell.y + dy}`;
          if (used.has(key)) {
            blocked = true;
            break;
          }
        }
        if (blocked) {
          break;
        }
      }
      if (!blocked) {
        return cell;
      }
    }
    return null;
  }

  private draw() {
    if (!this.ctx) {
      return;
    }
    const width = this.gridWidth * this.cellSize;
    const height = this.gridHeight * this.cellSize;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = '#f4fbf9';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = 'rgba(15, 107, 95, 0.08)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.gridWidth; i += 1) {
      const pos = i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.gridHeight; i += 1) {
      const pos = i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(width, pos);
      this.ctx.stroke();
    }

    for (const obstacle of this.obstacles()) {
      this.drawObstacle(obstacle);
    }

    for (const food of this.foods) {
      this.drawFood(food);
    }

    this.snake.forEach((segment, index) => {
      const color = index === 0 ? '#0b4f47' : '#0f6b5f';
      this.drawCell(segment, color, 0.95);
    });
  }

  private drawCell(cell: Cell, color: string, alpha: number) {
    if (!this.ctx) {
      return;
    }
    const padding = 2;
    const x = cell.x * this.cellSize + padding;
    const y = cell.y * this.cellSize + padding;
    const size = this.cellSize - padding * 2;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillRect(x, y, size, size);
    this.ctx.globalAlpha = 1;
  }

  private drawFood(food: Food) {
    if (!this.ctx) {
      return;
    }
    const padding = 3;
    const x = food.cell.x * this.cellSize + padding;
    const y = food.cell.y * this.cellSize + padding;
    const size = this.cellSize - padding * 2;
    this.ctx.fillStyle = food.color;
    this.ctx.strokeStyle = '#5b3e00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, 4);
    this.ctx.fill();
    this.ctx.stroke();
    const ratingLabel = String(Math.round(food.rating));
    this.ctx.font = `700 ${Math.max(10, Math.floor(this.cellSize * 0.6))}px \"Space Grotesk\", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(ratingLabel, x + size / 2, y + size / 2 + 0.5);
    this.ctx.fillText(ratingLabel, x + size / 2, y + size / 2 + 0.5);

  }

  private drawObstacle(obstacle: Obstacle) {
    if (!this.ctx) {
      return;
    }
    const size = obstacle.size * this.cellSize - 4;
    const x = obstacle.cell.x * this.cellSize + 2;
    const y = obstacle.cell.y * this.cellSize + 2;
    this.ctx.fillStyle = obstacle.color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, 6);
    this.ctx.fill();

    const label = obstacle.name.trim();
    if (label) {
      const padding = 6;
      const maxWidth = size - padding * 2;
      const maxHeight = size - padding * 2;
      let fontSize = Math.max(7, Math.floor(this.cellSize * 0.6));
      const minFont = 6;
      let lines: string[] = [];

      while (fontSize >= minFont) {
        this.ctx.font = `600 ${fontSize}px \"Space Grotesk\", sans-serif`;
        lines = wrapText(this.ctx, label, maxWidth);
        const lineHeight = Math.ceil(fontSize * 1.1);
        const totalHeight = lines.length * lineHeight;
        const widest = Math.max(...lines.map(line => this.ctx!.measureText(line).width));
        if (totalHeight <= maxHeight && widest <= maxWidth) {
          break;
        }
        fontSize -= 1;
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      const lineHeight = Math.ceil(fontSize * 1.1);
      const blockHeight = lines.length * lineHeight;
      let startY = y + (size - blockHeight) / 2;
      for (const line of lines) {
        this.ctx.fillText(line, x + size / 2, startY);
        startY += lineHeight;
      }
    }
  }

  private setupCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    const board = this.boardRef.nativeElement;
    const width = board.clientWidth;
    const height = board.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const cell = Math.max(10, Math.floor(height / this.gridHeight));
    this.cellSize = cell;
    this.gridWidth = Math.max(18, Math.floor(width / cell));
    const pixelWidth = this.gridWidth * cell;
    const pixelHeight = this.gridHeight * cell;
    board.style.height = `${pixelHeight}px`;
    canvas.style.width = `${pixelWidth}px`;
    canvas.style.height = `${pixelHeight}px`;
    canvas.width = Math.floor(pixelWidth * dpr);
    canvas.height = Math.floor(pixelHeight * dpr);
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.gridVersion.update(value => value + 1);
    this.ensureSnakeClearOfObstacles();
    this.ensureFoodsInBounds();
    this.draw();
  }

  private ensureFoodsInBounds() {
    if (!this.foods.length) {
      this.foods = this.randomFoods();
      return;
    }
    const outOfBounds = this.foods.some(food => food.cell.x >= this.gridWidth || food.cell.y >= this.gridHeight);
    if (outOfBounds) {
      this.foods = this.randomFoods();
    }
  }

  private addFoods(count: number) {
    const taken = new Set(this.snake.map(cell => `${cell.x},${cell.y}`));
    for (const obstacle of this.obstacles()) {
      for (let dx = 0; dx < obstacle.size; dx += 1) {
        for (let dy = 0; dy < obstacle.size; dy += 1) {
          taken.add(`${obstacle.cell.x + dx},${obstacle.cell.y + dy}`);
        }
      }
    }
    for (const food of this.foods) {
      taken.add(`${food.cell.x},${food.cell.y}`);
    }
    const extras = this.generateFoods(count, taken);
    this.foods.push(...extras);
  }

  private generateFoods(count: number, taken: Set<string>): Food[] {
    const buckets = buildRatingBuckets(this.rows());
    const foods: Food[] = [];

    const availableRatings = new Set(buckets.map(bucket => bucket.rating));
    for (const rating of [1, 2, 3, 4, 5]) {
      if (foods.length >= count) {
        break;
      }
      if (availableRatings.has(rating)) {
        const food = this.randomFood(taken, rating);
        foods.push(food);
        taken.add(`${food.cell.x},${food.cell.y}`);
      }
    }

    for (let i = foods.length; i < count; i += 1) {
      const cell = this.randomFood(taken);
      foods.push(cell);
      taken.add(`${cell.cell.x},${cell.cell.y}`);
    }
    return foods;
  }

  private restoreHighScore() {
    try {
      const raw = localStorage.getItem('gamesmeter:snakeHighScore');
      const value = raw ? Number(raw) : 0;
      if (!Number.isNaN(value)) {
        this.highScore.set(value);
      }
    } catch {
      // ignore storage errors
    }
  }

  private maybeUpdateHighScore() {
    if (this.score() <= this.highScore()) {
      return;
    }
    const next = this.score();
    this.highScore.set(next);
    try {
      localStorage.setItem('gamesmeter:snakeHighScore', String(next));
    } catch {
      // ignore storage errors
    }
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(...breakLongWord(ctx, word, maxWidth));
      current = '';
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function breakLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const chars = word.split('');
  const lines: string[] = [];
  let current = '';
  for (const ch of chars) {
    const test = current + ch;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
      }
      current = ch;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function buildRatingBuckets(rows: VoteRow[]): Array<{ rating: number; count: number }> {
  const buckets = new Map<number, number>();
  for (const row of rows) {
    if (row.rating === null) {
      continue;
    }
    const rating = Math.round(row.rating);
    buckets.set(rating, (buckets.get(rating) ?? 0) + 1);
  }
  if (buckets.size === 0) {
    return [{ rating: 3, count: 1 }];
  }
  return [...buckets.entries()].map(([rating, count]) => ({ rating, count }));
}

function pickWeightedRating(buckets: Array<{ rating: number; count: number }>): number {
  const weighted = buckets.map(bucket => ({
    rating: bucket.rating,
    count: bucket.count,
  }));
  const total = weighted.reduce((sum, bucket) => sum + bucket.count, 0);
  let roll = Math.random() * total;
  for (const bucket of weighted) {
    roll -= bucket.count;
    if (roll <= 0) {
      return bucket.rating;
    }
  }
  return buckets[0]?.rating ?? 3;
}

function pickWeightedRatingFrom(buckets: Array<{ rating: number; count: number }>): number {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  let roll = Math.random() * total;
  for (const bucket of buckets) {
    roll -= bucket.count;
    if (roll <= 0) {
      return bucket.rating;
    }
  }
  return buckets[0]?.rating ?? 3;
}

function ratingPoints(rating: number): number {
  return Math.max(1, Math.min(5, Math.round(rating)));
}

function ratingColor(rating: number): string {
  if (rating >= 5) return '#6b3df5';
  if (rating >= 4) return '#2ea7ff';
  if (rating >= 3) return '#f4c542';
  if (rating >= 2) return '#f28c28';
  return '#d9554c';
}

function scaleObstacleSize(count: number, min: number, max: number, minSize: number, maxSize: number): number {
  if (max <= min) {
    return Math.round((minSize + maxSize) / 2);
  }
  const normalized = (count - min) / (max - min);
  const size = minSize + Math.round(normalized * (maxSize - minSize));
  return Math.max(minSize, Math.min(maxSize, size));
}

function reserveCells(
  cell: Cell,
  size: number,
  padding: number,
  used: Set<string>,
  gridWidth: number,
  gridHeight: number,
) {
  for (let dx = -padding; dx < size + padding; dx += 1) {
    for (let dy = -padding; dy < size + padding; dy += 1) {
      const x = cell.x + dx;
      const y = cell.y + dy;
      if (x >= 0 && y >= 0 && x < gridWidth && y < gridHeight) {
        used.add(`${x},${y}`);
      }
    }
  }
}
