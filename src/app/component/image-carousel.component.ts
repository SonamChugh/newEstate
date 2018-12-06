import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';

import { SlideChangeEvent } from './photos-slider.component';


const animationMetadata = animate('180ms cubic-bezier(0.250, 0.250, 0.540, 1.040)');


export const animations = [
  trigger('sliderState', [
    state('shiftLeft', style({
      transform: 'translateX(-100%)'
    })),
    state('shiftLeftFirstSlide', style({
      transform: 'translateX(0%)'
    })),
    state('shiftLeftLastSlide', style({
      transform: 'translateX(-200%)'
    })),
    state('shiftRight', style({
      transform: 'translateX(0)'
    })),
    state('shiftRightFirstSlide', style({
      transform: 'translateX(100%)'
    })),
    state('shiftRightLastSlide', style({
      transform: 'translateX(-100%)'
    })),
    state('', style({
      transform: 'translateX(0)'
    })),
    transition('* => shiftLeft', animationMetadata),
    transition('* => shiftLeftFirstSlide', [
      style({transform: 'translateX(100%)'}),
      animationMetadata
    ]),
    transition('* => shiftLeftLastSlide', [
      style({transform: 'translateX(-100%)'}),
      animationMetadata
    ]),
    transition('shiftLeft => *', animate('0ms cubic-bezier(0.250, 0.250, 0.540, 1.040)')),

    transition('* => shiftRight', [
      style({transform: 'translateX(-100%)'}),
      animationMetadata
    ]),
    transition('* => shiftRightFirstSlide', animationMetadata),
    transition('* => shiftRightLastSlide', [
      style({transform: 'translateX(-200%)'}),
      animationMetadata
    ]),
    transition('shiftRight => *', animate('0ms cubic-bezier(0.250, 0.250, 0.540, 1.040)')),
  ])
];


export interface ItemClickEvent {
  ev: MouseEvent;
  index: number;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'image-carousel',
  template: `
    <div class="carousel-container">

      <photos-slider #slider="photosSlider" (slideChanged)="onSlideChanged($event)">

        <div *ngFor="let image of images; let i = index"
             sliderItem
             #sliderItem="sliderItem"
             [@sliderState]="sliderItem.state"
             (@sliderState.done)="slider.onAnimationDone()"
             [class.active]="sliderItem.active"
             [class.deep]="sliderItem.deep"
             (click)="itemClicked.emit({ev: $event, index: i})"
             class="slide">
          <img *ngIf="slider.needLoadImage(i)"
               [src]="image"
               [alt]="image"
               class="slide__img">
        </div>

        <button sliderPrev class="slider-prev lnr lnr-chevron-left">
        </button>

        <button sliderNext class="slider-next lnr lnr-chevron-right">
        </button>

        <div *ngIf="showIndex && images" class="image-index">
          {{slider.currentIndex + 1}} / {{images.length}}
        </div>

      </photos-slider>
    </div>
  `,
  styleUrls: ['image-carousel.component.scss'],
  animations: animations
})
export class ImageCarouselComponent {

  @Input() images: string[];
  @Input() showIndex: boolean;

  @Output() itemClicked = new EventEmitter<ItemClickEvent>();

  onSlideChanged(ev: SlideChangeEvent): void {
  }
}
