import { Injectable, Inject, EventEmitter } from '@angular/core';
import { UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

import { clearObject } from '../util';
import { ApiService } from './api.service';
import { IS_BROWSER } from './injection-token';

import { CacheService } from './cache.service';
import { CookieService } from './cookie.service';
import { SeoMetadata } from './seo-metadata';
import { JsonMapper } from './json-mapper';


const LANG_STORAGE_KEY = 'lang';
const TRANSLATIONS_KEY_PREFIX = 'translations.cache';

export type LocaleShort = 'en' | 'ru' | 'fr';

export type TranslationDict = { [key: string]: string };


@Injectable()
export class TranslationService {

  changed = new EventEmitter();

  strings: any = {};

  static LOCALES_ARRAY = ['en', 'fr', 'ru'];

  languages: { text: string, value: LocaleShort }[] = [
    {text: 'English', value: 'en'},
    {text: 'Français', value: 'fr'},
    {text: 'Русский', value: 'ru'},
  ];

  lang: LocaleShort;

  DEFAULT: LocaleShort = 'ru';

  labelByValue: { [value: string]: string } = {};

  urlToSeo: { [url: string]: SeoMetadata } = {};

  get activeLocale(): LocaleShort {
    return this.lang;
  }

  constructor(
    public _api: ApiService,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    private _cache: CacheService,
    private cookieService: CookieService,
    private jsonMapper: JsonMapper
  ) {

    for (const lang of this.languages) {
      this.labelByValue[lang.value] = lang.text;
    }

    this.setActiveLocale((this.cookieService.get(LANG_STORAGE_KEY) || this.DEFAULT) as LocaleShort);
  }

  loadAndSetStrings(lang: LocaleShort): Observable<void> {

    return this.getTranslationsSafe(lang)
      .pipe(
        map(([strings, seo]) => {

          this.lang = lang;
          this.strings = strings;

          clearObject(this.urlToSeo);

          for (let s of seo) {
            this.urlToSeo[s.url] = s;
          }

          this.changed.emit();

          if (this.isBrowser) {
            this.cookieService.set(LANG_STORAGE_KEY, this.lang, {path: '/'})
          }
        })
      );
  }

  private translationMapper(lang: LocaleShort, responseData: any): [TranslationDict, SeoMetadata[]] {

    const seoMetadata = Array.isArray(responseData.seo_metadata)
      ? responseData.seo_metadata.map(el => this.jsonMapper.deserialize(SeoMetadata, el))
      : [];

    return [
      responseData.item[lang],
      seoMetadata
    ] as [TranslationDict, SeoMetadata[]];
  }

  getTranslations(lang: LocaleShort): Observable<[TranslationDict, SeoMetadata[]]> {

    const key = [TRANSLATIONS_KEY_PREFIX, lang].join('.');

    if (this._cache.has(key)) {
      const responseData = this._cache.get(key);
      return of(this.translationMapper(lang, responseData));
    }

    return this._api.get(`/php/translation.php?lang[]=${lang}`)
      .pipe(
        tap(responseData => {
          this._cache.set(key, responseData);
        }),
        map(responseData => this.translationMapper(lang, responseData)),
      );
  }

  getTranslationsSafe(lang: LocaleShort): Observable<[TranslationDict, SeoMetadata[]]> {

    return this.getTranslations(lang)
      .pipe(
        catchError(err => {
          console.trace(err);
          return of([{}, []] as [TranslationDict, SeoMetadata[]]);
        })
      )
  }

  replaceLocale(segments: UrlSegment[], locale: LocaleShort): string[] {

    const chunks = segments.map(segment => segment.path);

    if (chunks.length && this.inLocales(chunks[0])) {
      chunks.shift();
      chunks.unshift(locale);
    }

    return chunks;
  }

  setActiveLocale(value: LocaleShort): void {

    this.lang = value;
    this.cookieService.set(LANG_STORAGE_KEY, this.lang, {path: '/'});
  }

  inLocales(value: string): boolean {
    return TranslationService.LOCALES_ARRAY.indexOf(value) !== -1;
  }

  translate(value: string, defaultValue?: string): string {
    return this.strings.hasOwnProperty(value)
      ? this.strings[value]
      : (defaultValue || '');
  }

  getSeoMetadata(url: string): SeoMetadata | null {

    return this.urlToSeo[url] || null;
  }
}
