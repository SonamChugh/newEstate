import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta, MetaDefinition } from '@angular/platform-browser';


@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(@Inject(DOCUMENT) public readonly document: Document,
              private title: Title,
              private meta: Meta) {
  }

  setWhiteTitle(value: string): void {
    this.title.setTitle(`${value}${value ? ' • ' : ''}White Estate`);
  }

  setMetaDescription(content: string): void {

    this.meta.updateTag({name: 'description', content: content});
  }
}
