import { Injectable } from '@angular/core';
import { Params } from '@angular/router';

@Injectable()
export class UtmService {

  source: string;
  medium: string;
  campaign: string;
  content: string;

  constructor() {
  }

  deserialize(params: Params): void {

    this.source = params.utm_source;
    this.medium = params.utm_medium;
    this.campaign = params.utm_campaign;
    this.content = params.utm_content;
  }

  serialize(): { [key: string]: string } {
    return {
      utm_source: this.source,
      utm_medium: this.medium,
      utm_campaign: this.campaign,
      utm_content: this.content,
    }
  }
}
