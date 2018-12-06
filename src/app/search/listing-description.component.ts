import {
  Component,
  Input
} from '@angular/core';

import {
  Listing,
  AccommodationTypeValue,
  TranslationService
} from '../shared';


@Component({
  selector: 'listing-description',
  templateUrl: 'listing-description.component.html',
  styleUrls: ['listing-description.component.scss'],
})
export class ListingDescriptionComponent {

  @Input() listing: Listing;

  @Input() sale: boolean;

  AccommodationTypeValue = AccommodationTypeValue;

  constructor(public translation: TranslationService) {
  }
}
