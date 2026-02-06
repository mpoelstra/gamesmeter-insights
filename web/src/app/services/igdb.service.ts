import { inject, Injectable } from '@angular/core';
import { IGDB_PROXY_BASE } from '../app.config';

export interface IgdbGame {
  id: number;
  name: string;
  aggregated_rating?: number;
  first_release_date?: number;
  platforms?: Array<{ id: number; name: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class IgdbService {
  private readonly baseUrl = inject(IGDB_PROXY_BASE);

  async searchGames(query: string): Promise<IgdbGame[]> {
    const body = `search "${escapeQuotes(query)}"; fields name,aggregated_rating,first_release_date,platforms.name; limit 5;`;
    const resp = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body,
    });
    if (!resp.ok) {
      throw new Error(`IGDB request failed (${resp.status})`);
    }
    return (await resp.json()) as IgdbGame[];
  }
}

function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"');
}
