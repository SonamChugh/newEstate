import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';


@Injectable()
export class FacebookTrackService {

  track(event: string, data: any): void {

    const fbq: (method: string, event: string, data: any) => void = window['fbq'];

    if (fbq) {
      fbq('track', event, data);
    }
  }
}


@Injectable()
export class FacebookTrackMockService {

  track(event: string, data: any): void {

    if (environment.debugAnalyticsEvents) {

      console.log(`facebook track is disabled: event=${event} data=${JSON.stringify(data)}`);
    }
  }
}
