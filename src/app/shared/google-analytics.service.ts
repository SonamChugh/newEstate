import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

declare const ga: Function;

@Injectable()
export class GoogleAnalyticsService {

  constructor() {

    try {
      this.initScript();
    } catch (e) {
      console.error('error init google analytics');
      console.trace(e);
    }
  }

  private initScript(): void {

    const el = document.createElement('script');

    el.innerHTML = `
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){ (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o), m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m) })(window,document,'script','//www.google-analytics.com/analytics.js','ga'); 
      ga('create', '${environment.googleAnalyticsKey}', 'auto'); 
      ga('require', 'displayfeatures');
    `;

    document.head.appendChild(el);
  }

  private safeGa(command: string, arg: string, ...args: any[]): void {

    if (typeof window['ga'] === 'function') {
      ga(command, arg, ...args);
    }
  }

  sendPageView(url: string): void {
    this.safeGa('set', 'page', url);
    this.safeGa('send', 'pageview');
  }

  sendEvent(eventCategory: string, eventAction: string, eventLabel: string,
            eventValue?: number, nonInteraction: boolean = false): void {

    const args = {
      eventCategory: eventCategory,
      eventAction: eventAction,
      eventLabel: eventLabel,
    };

    if (eventValue) {
      args['eventValue'] = eventValue;
    }

    if (nonInteraction) {
      args['nonInteraction'] = true;
    }

    this.safeGa('send', 'event', args);
  }
}


@Injectable()
export class GoogleAnalyticsMockService {

  sendPageView(url: string): void {

    if (environment.debugAnalyticsEvents) {
      console.log('ga is disabled on localhost - pageview:', url);
    }
  }

  sendEvent(eventCategory: string, eventAction: string, eventLabel: string,
            eventValue?: number, nonInteraction: boolean = false): void {

    if (environment.debugAnalyticsEvents) {

      const args = {
        eventCategory: eventCategory,
        eventAction: eventAction,
        eventLabel: eventLabel,
      };

      if (eventValue) {
        args['eventValue'] = eventValue;
      }

      if (nonInteraction) {
        args['nonInteraction'] = true;
      }

      console.log(`ga is disabled on localhost - event ${JSON.stringify(args)}`);
    }
  }
}
