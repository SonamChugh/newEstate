import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  SimpleChanges,
  OnChanges
} from '@angular/core';

import { WhiteOption } from './white-option';


export type Operation = 'add' | 'remove' | 'select';


export interface ButtonGroupChangeEvent {
  op: Operation,
  option: WhiteOption,
  payload?: any;
}


@Component({
  selector: 'button-group',
  template: `
    <div class="btn-group">
      <button *ngFor="let option of options; let i = index"
              class="btn-filter"
              [class.active]="isChecked(option, i)"
              [style.width.%]="100/options.length"
              [style.borderTopRightRadius.px]="i === options.length - 1 ? borderRadius : 0"
              [style.borderBottomRightRadius.px]="i === options.length - 1 ? borderRadius : 0"
              [style.borderTopLeftRadius.px]="i === 0 ? borderRadius : 0"
              [style.borderBottomLeftRadius.px]="i === 0 ? borderRadius : 0"
              [style.borderWidth.px]="buttonBorderWidth"
              [style.backgroundColor]="isChecked(option, i) ? backgroundColor : null"
              [style.color]="isChecked(option, i) ? textColor : backgroundColor"
              (click)="onButtonClick(option, i)">
        {{option.text}}
      </button>
    </div>
  `,
  styleUrls: ['button-group.component.scss'],
})
export class ButtonGroupComponent<T> implements OnInit, OnChanges {

  @Input() options: WhiteOption[];
  @Input() multiple: boolean = false;
  @Input() currentIndex: number;
  @Input() selectedValue: T;
  @Input() checkedValues: Set<T>;
  @Input() borderRadius: number = 0;
  @Input() buttonBorderWidth: number = 1;

  @Input() backgroundColor: string;
  @Input() textColor: string;

  @Output() change: EventEmitter<ButtonGroupChangeEvent> = new EventEmitter();

  protected idOptionDict: { [id: string]: WhiteOption } = {};

  get currentOption(): WhiteOption {
    return this.currentIndex != null && this.currentIndex != undefined ? this.options[this.currentIndex] : null;
  }

  constructor(private elementRef: ElementRef) {
  }

  ngOnInit(): void {

    if (this.options && this.options.length) {

      if (this.multiple) {

        this.options.forEach(el => {
          this.idOptionDict[el.value] = el;
        });

        if (!this.checkedValues) {
          this.checkedValues = new Set<T>();
        }

      } else if (this.selectedValue !== null && this.selectedValue !== undefined) {

        this.currentIndex = this.getIndexByValue(this.selectedValue);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {

    const selectedValueChange = changes['selectedValue'];

    if (selectedValueChange) {
      this.currentIndex = this.getIndexByValue(selectedValueChange.currentValue);
    }
  }

  getIndexByValue(value: T): number {

    for (let i = 0, len = this.options.length; i < len; ++i) {

      const option = this.options[i];

      if (<any>option.value === value) {
        return i;
      }
    }
  }

  isChecked(option: WhiteOption, i: number): boolean {
    return this.multiple ? this.checkedValues.has(<any>option.value) : this.currentIndex === i;
  }

  getChecked(): WhiteOption[] {
    return this.checkedValues ? Array.from(this.checkedValues).sort().map(key => this.idOptionDict[<any>key]) : [];
  }

  onButtonClick(option: WhiteOption, index: number): void {

    if (this.currentIndex === index) {
      return;
    }

    let op: Operation;

    const value = <any>option.value;

    if (this.multiple) {

      if (this.checkedValues.has(value)) {
        op = 'remove';
        this.checkedValues.delete(value);
      } else {
        op = 'add';
        this.checkedValues.add(value);
      }
    } else {

      op = 'select';
      this.selectedValue = <any>option.value;
      this.currentIndex = index;
    }

    this.triggerEvent(option, op);
  }

  triggerEvent(option: WhiteOption, operation: Operation): void {

    if (this.multiple) {

      this.change.emit({
        op: operation,
        option: option,
      });

    } else {

      this.change.emit({
        op: operation,
        option: option
      });
    }
  }

}

