import { Injectable, signal } from '@angular/core';
import { Lang, TranslationParams, translations } from './i18n';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly storageKey = 'gamesmeter:lang';
  readonly lang = signal<Lang>(this.restoreLang());

  setLang(next: Lang) {
    this.lang.set(next);
    try {
      localStorage.setItem(this.storageKey, next);
    } catch {
      // ignore storage errors
    }
  }

  t(key: string, params?: TranslationParams): string {
    const lang = this.lang();
    const dict = translations[lang];
    const fallback = translations.en;
    const template = dict[key] ?? fallback[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, token) => {
      const value = params?.[token];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) {
      return '';
    }
    const lang = this.lang();
    if (lang === 'nl') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return new Intl.DateTimeFormat('en-GB').format(date);
  }

  monthLabels(short = true): string[] {
    if (this.lang() === 'nl') {
      return short
        ? ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
        : ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    }
    return short
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  }

  weekdayLabels(short = true): string[] {
    if (this.lang() === 'nl') {
      return short
        ? ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
        : ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    }
    return short
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  private restoreLang(): Lang {
    try {
      const stored = localStorage.getItem(this.storageKey) as Lang | null;
      if (stored === 'en' || stored === 'nl') {
        return stored;
      }
    } catch {
      // ignore storage errors
    }
    return 'en';
  }
}
