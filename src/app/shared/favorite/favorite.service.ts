import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators'

import { ApiService } from '../api.service';
import { CacheService } from '../cache.service';
import { SearchService } from '../search.service';
import { SearchParams } from '../listing-filter';

import { hashCodeString } from '../../util';
import {
  Listing,
  ListingMapper
} from '../listing/listing';


@Injectable()
export class FavoriteService {

  prefix = 'favorites';

  private lastGetKey: string;

  constructor(public api: ApiService, private readonly cache: CacheService,
              protected readonly listingMapper: ListingMapper,
              private readonly searchService: SearchService) {
  }

  getUserFavorites(): Observable<Listing[]> {

    const key = hashCodeString(this.prefix + '_get');

    this.lastGetKey = key;

    if (this.cache.has(key)) {
      const responseData = this.cache.get(key);
      return of((responseData || []).map(data => this.listingMapper.map(new Listing(), data)));
    }

    return this.api.get('/php/listing/favorites.php')
      .pipe(
        switchMap(responseData => {

          const refs = responseData.items;

          if (!(refs && refs.length)) {
            return of([]);
          }

          const searchParams = new SearchParams();
          searchParams.refs = new Set<number>(refs);

          return this.searchService.search(searchParams);
        }),
        tap(responseData => {
          this.cache.set(key, responseData);
        }),
        map(responseData => (responseData || []).map(data => this.listingMapper.map(new Listing(), data)))
      );
  }

  add(listingId: number): Observable<any> {

    const body = {
      mode: 'post',
      listing_id: listingId
    };

    this.clearCache();

    return this.api.post('/php/listing/favorites.php', JSON.stringify(body));
  }

  remove(listingId: number): Observable<any> {

    const body = {
      mode: 'remove',
      listing_id: listingId
    };

    this.clearCache();

    return this.api.post('/php/listing/favorites.php', JSON.stringify(body));
  }

  clearCache() {

    if (this.lastGetKey) {
      this.cache.remove(this.lastGetKey);
      this.lastGetKey = null;
    }
  }
}


@Injectable()
export class FavoriteMemoryService {

  favorites: { [id: number]: Listing } = {};

  constructor() {
  }

  getUserListings(): Observable<Listing[]> {
    return of(Object.keys(this.favorites).map(id => this.favorites[id]));
  }

  add(listingId: number): Observable<any> {

    this.favorites[listingId] = <Listing>{
      'ref': listingId,
      'region': 'ca',
      'type': 'villa',
      'cityName': 'Mougins',
      'surface': '380',
      'sale': 1,
      'rent': 1,
      'vid': 31,
      'vlat': 43.6023319,
      'vlon': 7.006491,
      'refcheck': '',
      'title': null
    };

    return of({});
  }

  remove(listingId: number): Observable<any> {

    delete this.favorites[listingId];

    return of({});
  }
}
