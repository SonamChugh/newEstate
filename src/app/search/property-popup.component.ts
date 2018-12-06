import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  Optional
} from '@angular/core';
import { Observable } from 'rxjs';

import {
  Listing,
  ConfigService,
  WeAbsolutePopupRef,
  TranslationService
} from '../shared';


@Component({
  selector: 'property-popup',
  templateUrl: 'property-popup.component.html',
  styleUrls: ['property-popup.component.scss']
})
export class PropertyPopupComponent {

  @Output()
  get onFavoriteClick(): Observable<any> {
    return this._onFavoriteClick.asObservable();
  }

  @Output()
  get onListingActivate(): Observable<any> {
    return this._onListingActivate.asObservable();
  }

  @Input() isFavorite: boolean;
  @Input() isMobile: boolean = false;
  @Input() listing: Listing;

  private _onFavoriteClick: EventEmitter<any> = new EventEmitter();
  private _onListingActivate: EventEmitter<any> = new EventEmitter();

  constructor(public translation: TranslationService, public config: ConfigService,
              @Optional() public popupRef: WeAbsolutePopupRef<PropertyPopupComponent>,
              public elementRef: ElementRef) {
  }

  handleFavoriteClick(): void {
    this._onFavoriteClick.emit(null);
  }

  handleListingActivate(): void {
    this._onListingActivate.emit(null);
  }

  close() {

    if (this.popupRef) {
      this.popupRef.close();
    }
  }
}

