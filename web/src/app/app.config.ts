import { InjectionToken } from '@angular/core';

export const COVER_PROXY_BASE = new InjectionToken<string>('COVER_PROXY_BASE');
export const IGDB_PROXY_BASE = new InjectionToken<string>('IGDB_PROXY_BASE');

export const coverProxyBase = 'https://gamesmeter-cover-proxy.m-poelstra.workers.dev/cover';
export const igdbProxyBase = 'https://gamesmeter-igdb-proxy.m-poelstra.workers.dev/igdb';
