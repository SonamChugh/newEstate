import { Component } from '@angular/core';

import { TranslationService } from '../shared/translation.service';


@Component({
  selector: 'page-not-found',
  templateUrl: './page-not-found.component.html'
})
export class PageNotFoundComponent {

  constructor(public translation: TranslationService) {
  }
}
