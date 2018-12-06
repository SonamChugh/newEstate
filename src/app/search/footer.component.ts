import { Component, ChangeDetectionStrategy, ViewEncapsulation, ElementRef } from '@angular/core';

import { TranslationService } from '../shared';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'page-footer',
  styleUrls: ['footer.component.scss'],
  templateUrl: 'footer.component.html'
})
export class FooterComponent {

  constructor(
    public translation: TranslationService,
    public elementRef: ElementRef
  ) {
  }
}


