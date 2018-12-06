import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef, EventEmitter,
  OnInit, Output,
  QueryList,
  Renderer2
} from '@angular/core';


@Directive({
  selector: '[sliderItem]',
  exportAs: 'sliderItem'
})
export class SliderItem {

  state: string;
  active: boolean;
  deep: boolean;

  constructor(public elementRef: ElementRef) {
  }
}


@Directive({
  selector: '[sliderNext]'
})
export class SliderNextDirective {
}


@Directive({
  selector: '[sliderPrev]'
})
export class SliderPrevDirective {
}


export interface SlideChangeEvent {
  index: number;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'photos-slider',
  template: `
    <ng-content></ng-content>
  `,
  exportAs: 'photosSlider',
  styleUrls: ['photos-slider.component.scss']
})
export class PhotosSliderComponent implements OnInit, AfterViewInit {

  @Output() slideChanged = new EventEmitter<SlideChangeEvent>();

  currentIndex: number = 0;

  @ContentChildren(SliderItem, {descendants: true})
  slides: QueryList<SliderItem>;

  @ContentChild(SliderNextDirective, {read: ElementRef})
  private next: ElementRef;

  @ContentChild(SliderPrevDirective, {read: ElementRef})
  private prev: ElementRef;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private _renderer: Renderer2
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {

    this.updateActiveStatus();

    if (this.next) {

      this._renderer.listen(
        this.next.nativeElement,
        'click',
        (ev) => {

          ev.stopPropagation();

          if (this.slides.length <= 1) {
            return;
          }

          const slides = this.slides.toArray();
          const currentSlide = slides[this.currentIndex];

          currentSlide.active = true;

          let state: string;

          if (this.currentIndex < this.slides.length - 1) {
            this.currentIndex += 1;
            currentSlide.state = 'shiftLeft';
            state = 'shiftLeft';
          } else {
            this.currentIndex = 0;
            currentSlide.state = 'shiftLeftLastSlide';
            state = 'shiftLeftFirstSlide';
          }

          const nextSlide = slides[this.currentIndex];
          nextSlide.state = state;
          nextSlide.active = true;

          this.slideChanged.emit({index: this.currentIndex});

          this.changeDetectorRef.markForCheck();
        }
      )
    }

    if (this.prev) {

      this._renderer.listen(
        this.prev.nativeElement,
        'click',
        (ev) => {

          ev.stopPropagation();

          if (this.slides.length <= 1) {
            return;
          }

          const slides = this.slides.toArray();
          const currentSlide = slides[this.currentIndex];

          currentSlide.active = true;

          let state: string;

          if (this.currentIndex === 0) {
            this.currentIndex = this.slides.length - 1;
            currentSlide.state = 'shiftRightFirstSlide';
            state = 'shiftRightLastSlide';
          } else {
            this.currentIndex -= 1;
            currentSlide.state = 'shiftRight';
            state = 'shiftRight';
          }

          const prevSlide = slides[this.currentIndex];
          prevSlide.state = state;
          prevSlide.active = true;

          this.slideChanged.emit({index: this.currentIndex});

          this.changeDetectorRef.markForCheck();
        }
      )
    }
  }

  onAnimationDone(): void {

    this.updateActiveStatus();
  }

  updateActiveStatus(): void {

    this.slides.forEach((slide, i) => {

      slide.active = (i === this.currentIndex);
      slide.state = '';
    });
  }

  needLoadImage(index: number): boolean {

    if (!this.slides) {
      return false;
    }

    const total = this.slides.length;

    if (this.currentIndex === index || index === this.currentIndex - 1 || index === this.currentIndex + 1 ||
      (this.currentIndex === 0 && index === total - 1) || (this.currentIndex === total - 1 && index === 0)) {
      return true;
    }
  }
}
