import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { getBodySize, getOffset, Offset, Size } from '../util';


@Injectable({
  providedIn: 'root'
})
export class DomService {

  constructor(@Inject(DOCUMENT) public readonly document: Document,
              private title: Title) {
  }

  getBodySize(): Size {
    return getBodySize();
  }

  getOffset(el: any): Offset {
    return getOffset(el);
  }

  get viewportHeight(): number {
    return window.innerHeight;
  }

  getUserAgent(): string {
    return window.navigator.userAgent;
  }

  getLocationPath(): string {
    return this.document.location.pathname + this.document.location.search;
  }
}
