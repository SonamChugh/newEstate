import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api.service';
import { LocaleShort } from './translation.service';
import { CacheService } from './cache.service';


export interface StaticPageContent {
  text: string;
}

export type StaticPageName = 'about' | 'legal' | 'partners' | 'owners' | 'career';


@Injectable({
  providedIn: 'root'
})
export class StaticPageService {

  constructor(
    private api: ApiService,
    private cache: CacheService,
  ) {
  }

  getPageContent(page: StaticPageName, lang: LocaleShort): Observable<StaticPageContent> {

    const key = `page_${page}_${lang}`;

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return this.api.get('/php/static-page.php', {
      params: {
        page: page,
        lang: lang
      }
    })
      .pipe(
        tap(result => {
          this.cache.set(key, result);
        })
      );
  }

  getAboutContent(lang: LocaleShort): Observable<StaticPageContent> {

    return this.getPageContent('about', lang);
  }

  getLegalContent(lang: LocaleShort): Observable<StaticPageContent> {

    return this.getPageContent('legal', lang);
  }
}
