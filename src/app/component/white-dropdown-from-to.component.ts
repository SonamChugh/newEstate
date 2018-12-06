import {
  Component,
  Input,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Renderer2,
  ElementRef,
  OnInit
} from '@angular/core';


export interface DropDownFromToChangeEvent {
  from: number;
  to: number;
  payload?: any;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'white-dropdown-from-to',
  templateUrl: 'white-dropdown-from-to.component.html',
  styleUrls: ['white-dropdown-from-to.component.scss'],
})
export class WhiteDropDownFromToComponent implements OnInit {

  @Input() open: boolean = false;
  @Input() title: string;

  @Input() labelFrom: string;
  @Input() labelTo: string;

  @Input() menuWidth: number;
  @Input() menuAlign: 'left' | 'right' | 'auto' = 'auto';

  @Output() changed = new EventEmitter<DropDownFromToChangeEvent>();

  @Input() from: number;
  @Input() to: number;

  prevFrom: number = null;
  prevTo: number = null;

  documentClickUnregister: Function;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {
  }

  ngOnInit(): void {
    this.prevFrom = this.from;
    this.prevTo = this.to;
  }

  toggleMenu() {

    this.open = !this.open;

    if (this.open) {

      requestAnimationFrame(() => {

        this.documentClickUnregister = this.renderer.listen('document', 'click', (e: any) => {

          const el = this.elementRef.nativeElement;

          if (!el.contains(e.target)) {

            this.toggleMenu();
            this.documentClickUnregister();
            this.triggerEvent();
          }
        });

      });
    } else {

      this.documentClickUnregister();
      this.triggerEvent();
    }
  }

  triggerEvent() {

    if (this.prevFrom === this.from && this.prevTo === this.to) {
      return;
    }

    this.prevFrom = this.from;
    this.prevTo = this.to;

    this.changed.emit({
      from: this.from ? Number(this.from) : null,
      to: this.to ? Number(this.to) : null,
    });
  }

}
