import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';


export interface PhotoSwitchEvent {
  index: number;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'photos-viewer',
  templateUrl: 'photos-viewer.component.html',
  styleUrls: ['photos-viewer.component.scss'],
})
export class PhotosViewerComponent implements OnInit {

  private _images: string[];

  @Output() close = new EventEmitter<void>();
  @Output() prev = new EventEmitter<PhotoSwitchEvent>();
  @Output() next = new EventEmitter<PhotoSwitchEvent>();

  @Input()
  currentIndex: number = 0;

  @Input()
  get images(): string[] {
    return this._images;
  }

  set images(val: string[]) {

    this._images = val;
    this._activeImages = new Array(val.length);
  }

  @Input()
  totalImages: number;

  _activeImages: string[];

  constructor() {
  }

  ngOnInit(): void {
    this.refreshCurrent();
  }

  refreshCurrent(): void {

    if (this._images && this._images.length > this.currentIndex) {

      this._activeImages[this.currentIndex] = this._images[this.currentIndex];
      this.setNextImage();
      this.setPrevImage();
    }
  }

  nextSlide() {

    if (this.currentIndex < this.images.length - 1) {

      this.currentIndex++;

    } else {

      this.currentIndex = 0;
    }

    this.setNextImage();
  }

  prevSlide() {

    if (this.currentIndex > 0) {

      this.currentIndex--;

    } else {

      this.currentIndex = this.images.length - 1;
    }

    this.setPrevImage();
  }

  getPreviousImageUrl(): string | null {

    if (!this.images) {
      return null;
    }

    const index = (this.currentIndex === 0) ? this.images.length - 1 : this.currentIndex - 1;

    return this.images[index];
  }

  getNextImageUrl(): string | null {

    if (!this.images) {
      return null;
    }

    let index;

    if (this.currentIndex === this.images.length - 1) {
      index = 0;
    } else {
      index = this.currentIndex + 1;
    }

    return this.images[index];
  }

  setPrevImage(): void {
    const previousIndex = this.currentIndex === 0 ? this.images.length - 1 : this.currentIndex - 1;
    this._activeImages[previousIndex] = this.getPreviousImageUrl();
  }

  setNextImage(): void {
    const nextIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
    this._activeImages[nextIndex] = this.getNextImageUrl();
  }
}
