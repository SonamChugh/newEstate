import {
  Inject,
  Injectable
} from '@angular/core';
import { Params } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import {
  forkJoin,
  from,
  Observable,
  of
} from 'rxjs';
import {
  map,
  switchMap,
  tap
} from 'rxjs/operators';

import { CacheService } from './cache.service';
import { ApiService } from './api.service';
import { TranslationService } from './translation.service';
import {
  Listing,
  ListingMapper
} from './listing/listing';
import { SearchParams } from './listing-filter';
import {
  City,
  CityMapper
} from './city';

import {
  clearObject,
  hashCodeString,
  isNullOrUndefined,
  thousandFormat,
  upperCaseFirstLetter
} from '../util';
import { DeviceFormFactor } from './device-form-factor';

import { WhiteOption } from '../component/white-option';
import { DropDownTab } from '../component/white-dropdown-tab.component';

import { IS_BROWSER } from './injection-token';


export class ListingImagesResponse {
  remain: number;
  images: string[];
}


export enum SaleRent {
  Sale = 1,
  Rent = 0
}


export enum SortValue {
  LastModifiedFirst = 'last_modified',
  Cheapest = 'cheapest',
  MostExpensive = 'most_expensive',
  Recent = 'recent'
}


export enum RequestSource {
  IndexTop = 'index_top',
  IndexBottom = 'index_bottom',
  SearchListBottom = 'end_listing',
  Reference = 'reference',
  Detail = 'referencepg',
  Map = 'map',
  Vip = 'vip',
}


@Injectable()
export class SearchService {

  citiesOptions: DropDownTab[];
  buyRentOptions: WhiteOption[];
  typeOptions: WhiteOption[];
  budgetRentOptions: WhiteOption[];
  sortOptions: WhiteOption[];

  labelBuyRent: { [value: number]: string } = {};

  urlBackBuyRent: Params;
  urlForthBuyRent: Params;

  urlBackCity: Params;
  urlForthCity: Params;

  urlBackType: Params;
  urlForthType: Params;

  urlBackRental: Params;
  urlForthRental: Params;

  bedroomWord: string;
  budgetWord: string;
  surfaceWord: string;
  rentalWord: string;
  newBuildWord: string;
  fromWord: string;
  toWord: string;

  private gettingCitiesInProgress: boolean;
  private gettingCitiesQueue: ((res: City[], err: Error) => void)[] = [];

  private _cities: City[];

  private cityIdToOption: { [id: number]: WhiteOption } = {};

  private _latestSearchBody: any;

  get latestSearchBody(): any {
    return this._latestSearchBody || null;
  }

  constructor(
    public _api: ApiService,
    public _cache: CacheService,
    public translation: TranslationService,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    protected readonly listingMapper: ListingMapper,
    protected readonly cityMapper: CityMapper
  ) {

    this.updateOptions().subscribe();

    this.translation.changed
      .pipe(
        switchMap(() => this.updateOptions())
      )
      .subscribe();
  }

  _getCitiesQueued(): Promise<City[]> {

    if (this._cities) {
      return Promise.resolve(this._cities);
    }

    return new Promise((resolve, reject) => {

      if (this.gettingCitiesInProgress) {
        this.gettingCitiesQueue.push((res, err) => err ? reject(err) : resolve(res));
        return;
      }

      this.gettingCitiesInProgress = true;

      this.getCities()
        .subscribe(cities => {

          this.gettingCitiesInProgress = false;
          this._cities = cities;

          if (this.gettingCitiesQueue.length) {
            this.gettingCitiesQueue.forEach(func => func(this._cities, null));
          }

          resolve(this._cities);
        }, (err) => {

          this.gettingCitiesInProgress = false;

          if (this.gettingCitiesQueue.length) {
            this.gettingCitiesQueue.forEach(func => func(null, err));
          }

          reject(err);
        })
    });
  }

  getCitiesQueued(): Observable<City[]> {

    return from(this._getCitiesQueued());
  }

  getCities(): Observable<City[]> {

    const key = this.translation.activeLocale + '.cities';
    const region = 'ca';

    if (this._cache.has(key)) {
      return of(this._cache.get(key));
    }

    return this._api.get('/php/city.php', {params: {region: region}})
      .pipe(
        map(result => result.items.map(data =>
          this.cityMapper.map(new City(), data))),
        tap(json => {
          this._cache.set(key, json);
        })
      );
  }

  sendFormRequest(name: string, email: string, comment: string, requestData: any,
                  pgplace: string, ref: string, payload: any = {}): Observable<any> {

    const body = Object.assign({
      name: name,
      email: email,
      comment: comment,
      request: requestData,
      pgplace: pgplace,
      ref: ref,
    }, payload);

    return this._api.post('/php/requestform.php', JSON.stringify(body));
  }

  getListingArray(ref: number, saleRent?: SaleRent, secret?: string): Observable<Listing[]> {

    const params = {
      lang: this.translation.lang,
      ref: ref,
    };

    if (secret) {
      Object.assign(params, {
        check: secret
      });
    }

    if (!isNullOrUndefined(saleRent)) {
      Object.assign(params, {
        sale: saleRent
      });
    }

    const paramsString = JSON.stringify(params);
    const key = hashCodeString(paramsString);

    if (this._cache.has(key)) {
      const responseData = this._cache.get(key);
      return of([this.listingMapper.map(new Listing(), responseData.item)]);
    }

    return this._api.get('/php/listing/listing.php', {
      params: SearchService.makeHttpParams(params)
    })
      .pipe(
        tap(res => this._cache.set(key, res)), // because it may go through json serialization
        map(responseData => [this.listingMapper.map(new Listing(), responseData.item)])
      );
  }

  getListing(ref: number, saleRent?: SaleRent, secret?: string): Observable<Listing> {

    return this.getListingArray(ref, saleRent, secret)
      .pipe(
        switchMap(results => of(results.length ? results[0] : null))
      );
  }

  getListingPhotos(ref: number, key?: string,
                   device?: DeviceFormFactor): Observable<ListingImagesResponse> {

    const params = {
      ref: ref,
      key: key,
      device: device || 'desktop',
    };

    const cacheKey = hashCodeString(`ref.images.${JSON.stringify(params)}`);

    if (this._cache.has(cacheKey)) {
      return of(this._cache.get(cacheKey));
    }

    return this._api.get('/php/listing/photos.php', {params: SearchService.makeHttpParams(params)})
      .pipe(
        tap(res => this._cache.set(cacheKey, res)),
      );
  }

  makeSearchObject(values: (string | number)[]): { [id: string]: string } {

    const obj = {};

    for (let value of values) {
      obj[value] = '1';
    }

    return obj;
  }

  static serializeSearchParams(params: SearchParams): { [id: string]: string | number } {

    const searchBody = {
      sale: isNullOrUndefined(params.sale) ? null : params.sale,
      new_build: params.newBuild ? 1 : 0,
    };

    if (params.sort) {
      searchBody['sort'] = params.sort;
    }

    if (params.cityValues) {
      searchBody['city_id'] = Array.from(params.cityValues);
    }

    if (params.typeValues) {
      searchBody['type'] = Array.from(params.typeValues);
    }

    if (params.bedroomsFrom) {
      searchBody['bedrooms_min'] = params.bedroomsFrom;
    }

    if (params.bedroomsTo) {
      searchBody['bedrooms_max'] = params.bedroomsTo;
    }

    if (params.budgetFrom) {
      searchBody['budget_min'] = params.budgetFrom;
    }

    if (params.budgetTo) {
      searchBody['budget_max'] = params.budgetTo;
    }

    searchBody['rental_range'] = Array.from(params.rentalRangeValues);

    if (params.surfaceFrom) {
      searchBody['surface_min'] = params.surfaceFrom;
    }

    if (params.surfaceTo) {
      searchBody['surface_max'] = params.surfaceTo;
    }

    if (params.refs && params.refs.size) {
      searchBody['ref'] = Array.from(params.refs);
    }

    return searchBody;
  }

  static makeHttpParams(params: any): HttpParams {

    let httpParams = new HttpParams();

    for (let key in params) {
      if (Array.isArray(params[key])) {
        for (let val of params[key]) {
          httpParams = httpParams.append(key + '[]', val);
        }
      } else {
        httpParams = httpParams.append(key, params[key]);
      }
    }

    return httpParams;
  }

  search(searchParams: SearchParams): Observable<Listing[]> {

    const params = SearchService.serializeSearchParams(searchParams);

    this._latestSearchBody = params;

    const bodyJson = JSON.stringify(params);
    const key = hashCodeString(bodyJson);

    if (this._cache.has(key)) {
      const responseData = this._cache.get(key);
      return of(responseData.items.map(data => this.listingMapper.map(new Listing(), data)));
    }

    return this._api.get('/php/listing/search.php', {params: SearchService.makeHttpParams(params)})
      .pipe(
        tap(responseData => this._cache.set(key, responseData)),
        map(responseData => responseData.items.map(data => this.listingMapper.map(new Listing(), data))),
      );
  }

  searchRefs(refs: number[]): Observable<Listing[]> {

    const filter = new SearchParams();
    filter.refs = new Set<number>(refs);

    return this.search(filter);
  }

  getSimilarListings(ref: number, saleRent: SaleRent, limit: number = 2): Observable<Listing[]> {

    let params = {
      ref: ref,
      lang: this.translation.lang,
      limit: limit,
    };

    if (!isNullOrUndefined(saleRent)) {
      params = Object.assign(params, {sale: saleRent});
    }

    const key = hashCodeString(`similar.listings.${JSON.stringify(params)}`);

    if (this._cache.has(key)) {
      const responseData = this._cache.get(key);
      return of(responseData.items.map(data => this.listingMapper.map(new Listing(), data)));
    }

    return this._api.get('/php/listing/similar.php', {params: params})
      .pipe(
        tap((responseData) => this._cache.set(key, responseData)),
        map(responseData => responseData.items.map(data => this.listingMapper.map(new Listing(), data)))
      )
  }

  clearCache(): void {
    this._cache.clear();
  }

  serializeUrl(params: SearchParams): string {

    const chunks = [];

    chunks.push(this.urlForthBuyRent[params.sale]);

    const cities = Array.from(params.cityValues)
      .map(key => this.urlForthCity[key])
      .filter(val => val).sort();

    if (cities.length) {
      chunks.push(cities.join('-'));
    }

    const types = Array.from(params.typeValues)
      .map(key => this.urlForthType[key]);

    if (types.length) {
      chunks.push(types.join('-'));
    }

    // from-2-to-4-bedrooms

    if (params.bedroomsFrom || params.bedroomsTo) {

      const bedroomsChunks = [];

      if (params.bedroomsFrom) {
        bedroomsChunks.push(`${this.fromWord}-${params.bedroomsFrom}`);
      }

      if (params.bedroomsTo) {
        bedroomsChunks.push(`${this.toWord}-${params.bedroomsTo}`);
      }

      bedroomsChunks.push(this.bedroomWord);

      chunks.push(bedroomsChunks.join('-'));
    }

    // from-1M-to-3M-budget

    if (params.budgetFrom || params.budgetTo) {

      const budgetChunks = [];

      if (params.budgetFrom) {
        budgetChunks.push(`${this.fromWord}-${this.formatBudget(params.budgetFrom)}`);
      }

      if (params.budgetTo) {
        budgetChunks.push(`${this.toWord}-${this.formatBudget(params.budgetTo)}`);
      }

      budgetChunks.push(this.budgetWord);

      chunks.push(budgetChunks.join('-'));
    }

    // rental-5k-.._20k-30k

    if (params.rentalRangeValues.size) {

      const rentalChunks = Array.from(params.rentalRangeValues).map(value => this.urlForthRental[value]);

      chunks.push(`${this.rentalWord}-${rentalChunks.join('-')}`);
    }

    // 80-120-surface

    if (params.surfaceFrom || params.surfaceTo) {

      const surfaceChunks = [];

      if (params.surfaceFrom) {
        surfaceChunks.push(`${this.fromWord}-${params.surfaceFrom}`);
      }

      if (params.surfaceTo) {
        surfaceChunks.push(`${this.toWord}-${params.surfaceTo}`);
      }

      surfaceChunks.push(this.surfaceWord);

      chunks.push(surfaceChunks.join('-'));
    }

    if (params.newBuild) {
      chunks.push(this.newBuildWord);
    }

    return chunks.join('_');
  };

  deserializeUrl(s: string, searchParams: SearchParams): void {

    const params = s.split('_');
    const buyOrRent = params.shift();

    const prevChunks = [];

    let bedroomsFrom;
    let bedroomsTo;
    let surfaceFrom;
    let surfaceTo;
    let budgetFrom;
    let budgetTo;
    const types = [];
    const cities = [];

    for (const param of params) {

      const values = param.trim().toLowerCase().split('-');

      for (const val of values) {

        const cityValue = this.urlBackCity[val];

        if (cityValue) {
          cities.push(cityValue);
          continue
        }

        const type = this.urlBackType[val];

        if (type) {
          types.push(type);
          continue;
        }

        if (val === this.bedroomWord) {

          while (prevChunks.length) {

            const v = prevChunks.shift();

            if (v === this.fromWord) {
              bedroomsFrom = Number(prevChunks.shift());
            } else if (v === this.toWord) {
              bedroomsTo = Number(prevChunks.shift());
            }
          }
        }

        if (val === this.budgetWord) {

          while (prevChunks.length) {

            const v = prevChunks.shift();

            if (v === this.fromWord) {
              budgetFrom = Number(prevChunks.shift().replace('m', '')) * 1000000;
            } else if (v === this.toWord) {
              budgetTo = Number(prevChunks.shift().replace('m', '')) * 1000000;
            }
          }

          continue;
        }

        if (val === this.rentalWord) {

          for (let s of values.slice(1)) {

            if (this.urlBackRental[s]) {
              searchParams.rentalRangeValues.add(this.urlBackRental[s]);
            }
          }

          break;
        }

        if (val === this.surfaceWord) {

          while (prevChunks.length) {

            const v = prevChunks.shift();

            if (v === this.fromWord) {
              surfaceFrom = Number(prevChunks.shift());
            } else if (v === this.toWord) {
              surfaceTo = Number(prevChunks.shift());
            }
          }

          continue;
        }

        if (val === this.newBuildWord) {
          searchParams.newBuild = true;
        }

        prevChunks.push(val);
      }

    }

    const saleWord = this.translation.strings.vente || '';

    searchParams.sale = buyOrRent === saleWord.toLowerCase() ? SaleRent.Sale : SaleRent.Rent;

    for (const el of cities) {
      searchParams.cityValues.add(el);
    }

    for (const el of types) {
      searchParams.typeValues.add(el);
    }

    searchParams.bedroomsFrom = isNaN(bedroomsFrom) ? null : bedroomsFrom;
    searchParams.bedroomsTo = isNaN(bedroomsTo) ? null : bedroomsTo;
    searchParams.budgetFrom = isNaN(budgetFrom) ? null : budgetFrom;
    searchParams.budgetTo = isNaN(budgetTo) ? null : budgetTo;
    searchParams.surfaceFrom = isNaN(surfaceFrom) ? null : surfaceFrom;
    searchParams.surfaceTo = isNaN(surfaceTo) ? null : surfaceTo;
  }

  formatBudget(val: number): string {

    if (!val) {
      return '';
    }

    return `${val / 1000000}M`;
  }

  formatRentBudget(val: number): string {

    if (!val) {
      return '';
    }

    return `${thousandFormat(String(val))}`;
  }

  formatSurface(val: number): string {
    return val ? `${val}m²` : '';
  }

  getCityName(optionText: string): string {
    const cityChunks = optionText.trim().split(' ');
    return cityChunks.slice(0, -2).join(' ');
  }

  updateOptions(): Observable<void> {

    this.buyRentOptions = this.makeBuyRentOptions();
    this.typeOptions = this.makeTypeOptions();
    this.sortOptions = this.makeSortOptions();

    for (let opt of this.buyRentOptions) {
      this.labelBuyRent[opt.value] = opt.text;
    }

    // prepare some data for further url serialization/deserialization

    this.urlBackRental = {};
    this.urlForthRental = {};

    this.urlBackBuyRent = {};
    this.urlForthBuyRent = {};

    for (let option of this.buyRentOptions) {

      const text = (option.text || '').trim().toLowerCase();

      this.urlBackBuyRent[text] = option.value;
      this.urlForthBuyRent[option.value] = text;
    }

    this.urlBackType = {};
    this.urlForthType = {};

    for (let option of this.typeOptions) {

      const text = (option.text || '').trim().toLowerCase();

      this.urlBackType[text] = option.value;
      this.urlForthType[option.value] = text;
    }

    this.bedroomWord = (this.translation.strings.chambres || 'bedroom').toLowerCase();
    this.budgetWord = (this.translation.strings.budget || 'budget').toLowerCase();
    this.surfaceWord = (this.translation.strings.surface || 'surface').toLowerCase();
    this.rentalWord = (this.translation.strings.location || 'rental').toLowerCase();
    this.newBuildWord = (this.translation.strings.vefa || 'new_building').toLowerCase();
    this.fromWord = (this.translation.strings.srchfrom || 'from').toLowerCase();
    this.toWord = (this.translation.strings.srchto || 'to').toLowerCase();

    return forkJoin(
      this.getBudgetRentOptions(),
      this.getCitiesQueued()
    ).pipe(
      map(results => {

        this.budgetRentOptions = results[0];

        for (let option of this.budgetRentOptions) {
          const optionText = String(option.value || '')
            .replace('-', '—')
            .toLowerCase();
          this.urlBackRental[optionText] = option.value;
          this.urlForthRental[option.value] = optionText;
        }

        const cities = results[1];

        const topLevelCities = cities.filter(city => !city.parentId || city.parentId === city.id);

        this.citiesOptions = this.makeCitiesOptions(topLevelCities);

        clearObject(this.cityIdToOption);

        for (let tab of this.citiesOptions) {
          for (let option of tab.options) {
            this.cityIdToOption[option.value] = option;
          }
        }

        this.urlBackCity = {};
        this.urlForthCity = {};

        for (let city of topLevelCities) {

          let cityName = this.getCityName(this.translation.strings[city.translationKey] || '');
          cityName = SearchService.prepareCityNameForUrl(cityName || city.name || '');

          this.urlBackCity[cityName] = city.id;
          this.urlForthCity[city.id] = cityName;
        }
      })
    );
  }

  static prepareCityNameForUrl(value: string): string {
    return value ? value.replace(/ /g, '').toLowerCase() : '';
  }

  makeBuyRentOptions(): WhiteOption[] {
    return [
      {
        value: SaleRent.Sale,
        text: this.translation.strings.vente || 'Sale'
      },
      {
        value: SaleRent.Rent,
        text: this.translation.strings.location || 'Rent'
      },
    ]
  }

  makeTypeOptions(): WhiteOption[] {
    return [
      {
        value: 'apartment',
        text: this.translation.strings.appart || 'Apartment'
      },
      {
        value: 'villa',
        text: this.translation.strings.villa || 'Villa'
      },
      {
        value: 'land',
        text: this.translation.strings.land || 'Land'
      },
    ]
  }

  makeCitiesOptions(cities: City[]): DropDownTab[] {

    const options: WhiteOption[] = cities.map(city => {

      const cityName = this.translation.strings[city.translationKey] || city.name;

      return {
        value: city.id,
        text: cityName,
        shortText: this.getCityName(cityName) || city.name
      };
    });

    return [
      {
        name: this.translation.strings.ca,
        options: options
      }
    ];
  }

  getCityOptionById(id: number): WhiteOption {
    return this.cityIdToOption[id] || null;
  }

  getBudgetRentOptions(): Observable<WhiteOption[]> {

    const f = upperCaseFirstLetter(this.translation.strings.srchfrom || 'from');
    const t = this.translation.strings.srchto || 'To';
    const p = this.translation.strings.per_week || 'per week';

    return of([
      {
        value: '-5000',
        text: `${upperCaseFirstLetter(t)} 5 000 € ${p}`,
        shortText: `${upperCaseFirstLetter(t)} 5 000 €`
      },
      {
        value: '5000-10000',
        text: `${f} 5 000 ${t} 10 000 € ${p}`,
        shortText: '5000—10000 €'
      },
      {
        value: '10000-20000',
        text: `${f} 10 000 ${t} 20 000 € ${p}`,
        shortText: '10000—20000 €'
      },
      {
        value: '20000-30000',
        text: `${f} 20 000 ${t} 30 000 € ${p}`,
        shortText: '20000—30000 €'
      },
      {
        value: '30000-',
        text: `${f} 30 000 € ${p}`,
        shortText: `${f} 30 000 € ${p}`
      }
    ])
  }

  parseBudgetRentValue(val: string): [number | null, number | null] {
    return val.split('-').map(el => el ? Number(el) : null) as [number | null, number | null];
  }

  makeSortOptions(): WhiteOption[] {

    const s = this.translation.strings;

    return [
      {
        value: SortValue.LastModifiedFirst,
        text: s.sort_last_modified || 'Last modified properties first',
        shortText: s.sort_last_modified || 'Last modified'
      },
      {
        value: SortValue.Cheapest,
        text: s.sort_cheapest || 'Cheapest properties first',
        shortText: s.sort_cheapest_mob || 'Cheapest'
      },
      {
        value: SortValue.MostExpensive,
        text: s.sort_most_expensive || 'Most expensive properties first',
        shortText: s.sort_most_expensive_mob || 'Expensive'
      },
      {
        value: SortValue.Recent,
        text: s.sort_new || 'Recent first',
        shortText: s.sort_new_mob || 'Recent'
      },
    ]
  }
}
