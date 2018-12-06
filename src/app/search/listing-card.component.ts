import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import {
  AccommodationTypeValue,
  ConfigService,
  Listing
} from '../shared';

import { ListingService } from '../listing';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'listing-card',
  templateUrl: 'listing-card.component.html',
  styleUrls: ['listing-card.component.scss'],
  host: {
    '(mouseover)': 'onMouseOver($event)',
    '(mouseout)': 'onMouseOut($event)',
  }
})
export class ListingCardComponent implements OnInit {

  @Input() listing: Listing;

  @Input() favoriteButtonEnabled: boolean = true;
  @Input() isFavorite: boolean;

  @Input() isMobile: boolean;

  @Input() confidential: boolean;

  @Input() sale: boolean;
  @Input() rent: boolean;

  @Output() favoriteClick: EventEmitter<any> = new EventEmitter();

  isHover: boolean;

  AccommodationTypeValue = AccommodationTypeValue;

  confidentialLabelVisible: boolean;

  previewImagesLoaded: boolean;
  previewImages: string[];
  showImageIndex: boolean;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private config: ConfigService,
    private listingService: ListingService
  ) {
  }

  ngOnInit() {

    this.previewImages = this.listing && this.listing.coverImageSmall
      ? [this.config.imgUrl + this.listing.coverImageSmall]
      : [];
  }

  onMouseOver(): void {

    this.isHover = true;

    if (!this.previewImagesLoaded) {

      this.previewImagesLoaded = true;

      this.listingService.getPreviewImageUrls(this.listing.ref)
        .subscribe(urls => {

          this.showImageIndex = true;
          this.previewImages = urls.map(imageUrl => this.config.imgUrl + imageUrl);

          this.changeDetectorRef.markForCheck();
        });
    }
  }

  onMouseOut(): void {

    this.isHover = false;
  }
}
