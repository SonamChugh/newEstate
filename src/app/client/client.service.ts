import { Injectable } from '@angular/core';
import {
  Observable,
  of
} from 'rxjs';
import {
  map,
  tap
} from 'rxjs/operators';

import { hashCodeString } from '../util';

import {
  ApiService,
  CacheService,
  CollectionResponse,
  CookieService,
  JsonMapper,
  Listing,
  ListingMapper,
  LocaleShort,
  SaleRent,
  SearchService,
  SortValue,
  TranslationService,
  VipStatusInfo,
} from '../shared';
import {
  ClientRequest,
  ClientRequestMapper
} from './client-request';
import {
  ListingFeedback,
  FeedbackValue
} from './listing-feedback';


export interface RequestListings extends CollectionResponse<Listing> {
  feedback: ListingFeedback[];
  feedbackGroupByValue: [number, number][];
}


@Injectable({
  providedIn: 'root'
})
export class ClientService {

  static VIP_INFO_CACHE_PREFIX = 'vip-info.';

  static VIP_TOP_MESSAGE_CLOSED_FLAG = 'vip-top-message-closed';

  constructor(
    public _api: ApiService,
    private translation: TranslationService,
    private cache: CacheService,
    private jsonMapper: JsonMapper,
    private listingMapper: ListingMapper,
    private clientRequestMapper: ClientRequestMapper,
    private cookieService: CookieService,
    public searchService: SearchService,
  ) {
  }

  validateClientRequest(request: ClientRequest): string[] {

    const errors = [];

    if (request.sale !== SaleRent.Rent && request.sale !== SaleRent.Sale) {
      errors.push('sale');
    }

    if (!request.types.size) {
      errors.push('types');
    }

    if (!request.cities.size) {
      errors.push('cities');
    }

    if (!request.budgetMin && !request.budgetMax) {
      errors.push('budget');
    }

    return errors;
  }

  getVipInfo(requestId?: number): Observable<VipStatusInfo> {

    const params = {};

    if (requestId) {
      params['request_id'] = requestId;
    }

    const key = `${ClientService.VIP_INFO_CACHE_PREFIX}${hashCodeString(JSON.stringify(params))}`;

    if (this.cache.has(key)) {

      return of(this.cache.get(key));
    }

    return this._api.get('/php/vip.php', {
      params: params
    })
      .pipe(
        tap(result => {
          this.cache.set(key, result);
        })
      );
  }

  changeVipStatus(): Observable<void> {

    this.cache.clearKeysStartsWith(ClientService.VIP_INFO_CACHE_PREFIX);

    return this._api.post('/php/vip.php', JSON.stringify({}));
  }

  static getRequestsCacheKey(lang: LocaleShort): string {
    return hashCodeString(`${lang}#requests`);
  }

  getClientRequests(): Observable<CollectionResponse<ClientRequest>> {

    const key = ClientService.getRequestsCacheKey(this.translation.activeLocale);

    if (this.cache.has(key)) {

      const result = this.cache.get(key);
      return of({
        items: result.items.map(el =>
          this.jsonMapper.deserialize(ClientRequest, el))
      })
    }

    return this._api.get('/php/request.php')
      .pipe(
        tap(result => {
          this.cache.set(key, result);
        }),
        map(result => {

          const items = result.items.map(el =>
            this.jsonMapper.deserialize(ClientRequest, el));

          return {
            items: items
          }
        })
      );
  }

  getClientRequestListings(requestId: number, sort: SortValue): Observable<RequestListings> {

    const params = {
      request_id: requestId,
      sort: sort
    };
    const key = hashCodeString('request-listings.' + JSON.stringify(Object.assign({
      locale: this.translation.activeLocale
    }, params)));

    if (this.cache.has(key)) {

      const result = this.cache.get(key);

      return of({
        items: result.items.map(el => this.listingMapper.map(new Listing(), el)),
        feedbackGroupByValue: result.feedback_group_by_value,
        feedback: result.feedback.map(el => this.jsonMapper.deserialize(ListingFeedback, el))
      });
    }

    return this._api.get('/php/request/listings.php', {
        params: params
      }
    )
      .pipe(
        tap(result => {
          this.cache.set(key, result);
        }),
        map(result => {

          return {
            items: result.items.map(el => this.listingMapper.map(new Listing(), el)),
            feedbackGroupByValue: result.feedback_group_by_value,
            feedback: result.feedback.map(el => this.jsonMapper.deserialize(ListingFeedback, el))
          };
        })
      );
  }

  saveInitialClientRequest(name: string, phone: string, request: ClientRequest): Observable<ClientRequest> {

    const body = {
      name: name,
      phone: phone,
      item: this.clientRequestMapper.serialize(request)
    };

    this.cache.clear();

    return this._api.post(`/php/request.php`, JSON.stringify(body))
      .pipe(
        map(response => {
          request.id = response.item.id;
          return request;
        })
      );
  }

  saveClientRequest(request: ClientRequest): Observable<ClientRequest> {

    const body = {
      item: this.clientRequestMapper.serialize(request)
    };

    this.cache.clear();

    return this._api.post(`/php/request.php`, JSON.stringify(body))
      .pipe(
        map(response => {
          request.id = response.item.id;
          return request;
        })
      );
  }

  setListingFeedback(requestId: number, listingId: number, value: FeedbackValue | null): Observable<void> {

    const body = {
      request_id: requestId,
      listing_id: listingId,
      value: value,
    };

    this.cache.clear();

    return this._api.post('/php/request/listing-feedback.php', JSON.stringify(body));
  }

  getVipLastClosedTopMessage(): string | null {
    return this.cookieService.get(ClientService.VIP_TOP_MESSAGE_CLOSED_FLAG);
  }

  setVipLastClosedTopMessage(message: string): void {
    this.cookieService.set(ClientService.VIP_TOP_MESSAGE_CLOSED_FLAG, message, {path: '/', expires: 30 * 24 * 3600});
  }

  clearVipLastClosedMessage(): void {
    this.cookieService.set(ClientService.VIP_TOP_MESSAGE_CLOSED_FLAG, '', {path: '/', expires: 30 * 24 * 3600});
  }
}
