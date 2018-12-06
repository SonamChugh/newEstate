import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

export type PageType = 'home' | 'searchresults' | 'offerdetail' | 'conversionintent' | 'conversion' | 'other';


@Injectable()
export class AdWordsService {

  private pendings: Function[] = [];

  private scriptLoaded: boolean = false;

  constructor() {

    this.initScript();
  }

  private initScript(): void {

    const el = document.createElement('script');
    el.type = 'text/javascript';
    el.async = true;
    el.src = 'https://www.googleadservices.com/pagead/conversion_async.js';

    el.addEventListener('load', () => {

      this.scriptLoaded = true;

      if (this.pendings.length) {
        while (this.pendings.length) {
          this.pendings.shift()();
        }
      }

    }, false);

    document.head.appendChild(el);
  }

  trackConversionRealEstate(listingId: string, listingPageType: PageType, listingTotalValue?: number) {

    const trackConversion: (params: any, errCallback?: (error: any) => void) => void = window['google_trackConversion'];

    if (trackConversion) {

      const params = {
        google_conversion_id: environment.googleConversionId,
        google_custom_params: {
          listing_id: listingId,
          listing_pagetype: listingPageType,
        },
        google_remarketing_only: true
      };

      if (listingTotalValue) {
        params.google_custom_params['listing_totalvalue'] = listingTotalValue;
      }

      trackConversion(params, (err) => {
        console.error(err);
      });

    } else {

      this.pendings.push(() => {
        this.trackConversionRealEstate(listingId, listingPageType, listingTotalValue)
      });
    }
  }
}


// using at localhost
@Injectable()
export class AdWordsMockService {

  constructor() {
  }

  trackConversionRealEstate(listingId: string, listingPageType: string, listingTotalValue: number) {

    if (environment.debugAnalyticsEvents) {

      console.log(`adwords tracking disabled on localhost ${JSON.stringify({
        listing_id: listingId,
        listing_pagetype: listingPageType,
        listing_totalvalue: listingTotalValue,
      })}`);
    }
  }
}
