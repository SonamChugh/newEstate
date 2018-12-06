import { Injectable } from '@angular/core';
import {
  Observable,
  of
} from 'rxjs';
import {
  map,
  tap
} from 'rxjs/operators';

import {
  FacebookTrackService,
  FavoriteService,
  Listing,
  PrincipalService,
  TranslationService
} from '../shared';
import { clearObject } from '../util';


@Injectable()
export class FavoritePartial {
  favoritesDict: { [id: number]: boolean } = {};
  favorites: Listing[];
  favoritesInvalidateCache: boolean;

  constructor(
    private translation: TranslationService,
    private principalService: PrincipalService,
    private favoriteService: FavoriteService,
    private facebookTrackService: FacebookTrackService,
  ) {
  }

  init(): Observable<void> {

    return this.getFavorites()
      .pipe(
        map(favorites => this.setFavorites(favorites))
      );
  }

  getFavorites(): Observable<Listing[]> {

    if (!this.principalService.isAuthenticated) {
      return of([]);
    }

    return this.favoriteService.getUserFavorites();
  }

  getFavoritesCached(): Observable<Listing[]> {

    if (this.favoritesInvalidateCache) {
      return this.getFavorites()
        .pipe(
          tap(favorites => this.setFavorites(favorites))
        )
    }

    return of(this.favorites);
  }

  setFavorites(favorites: Listing[]): void {

    this.favorites = favorites;
    this.favoritesInvalidateCache = false;

    clearObject(this.favoritesDict);
    favorites.forEach(el => this.favoritesDict[el.ref] = true);
  }

  toggleFavorite(listing: Listing): void {

    this.favoritesInvalidateCache = true;

    if (this.favoritesDict[listing.ref]) {

      delete this.favoritesDict[listing.ref];

      this.favoriteService
        .remove(listing.ref)
        .subscribe();

    } else {

      this.favoritesDict[listing.ref] = true;

      this.favoriteService.add(listing.ref)
        .subscribe(() => {

          this.facebookTrackService.track('AddToCart', {
            content_ids: [String(listing.ref)],
            content_type: 'product',
            currency: 'EUR',
            value: listing.totpr
          });

        });
    }
  }

  isFavorite(listing: Listing): boolean {
    return this.favoritesDict.hasOwnProperty(listing.ref);
  }
}
