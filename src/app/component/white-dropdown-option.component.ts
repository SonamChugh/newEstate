import {
  Component, Input, Output, EventEmitter, ChangeDetectorRef, ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';


export interface WhiteOptionChangeEvent<T> {
  source: WhiteDropDownOptionComponent<T>,
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'white-dropdown-option',
  template: `
    <ng-content></ng-content>`,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  host: {
    '(click)': 'handleClick()'
  }
})
export class WhiteDropDownOptionComponent<T> {

  @Input() value: T;
  @Input() checkbox: boolean;
  @Input() checked: boolean;
  @Input() inlineText: string;

  @Output() onSelectionChange = new EventEmitter<WhiteOptionChangeEvent<T>>();

  constructor(private elementRef: ElementRef, private _changeDetectorRef: ChangeDetectorRef) {
  }

  handleClick(): void {
    this.emitSelectionChange();
  }

  private emitSelectionChange(): void {
    this.onSelectionChange.emit({
      source: this as WhiteDropDownOptionComponent<T>
    })
  }

  get viewValue(): string {
    return (this._getHostElement().textContent || '').trim();
  }

  private _getHostElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
