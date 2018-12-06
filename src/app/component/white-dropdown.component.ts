import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChild,
  ContentChildren,
  QueryList,
  AfterViewInit,
  Renderer2,
  ComponentFactoryResolver,
  Injector,
  ApplicationRef,
  TemplateRef,
  ViewContainerRef,
  ChangeDetectorRef,
  ContentChild,
  forwardRef
} from '@angular/core';
import {
  DomPortalHost,
  TemplatePortal
} from '@angular/cdk/portal';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  Subscription,
  Observable,
  Subject,
  merge
} from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  getOffset,
  getSize
} from '../util';

import { WhiteOption } from './white-option';
import {
  WhiteDropDownOptionComponent,
  WhiteOptionChangeEvent
} from './white-dropdown-option.component';
import { WhiteDropdownChipComponent } from './white-dropdown-chip.component';
import { WhiteDropdownCustomSelectionComponent } from './white-dropdown-custom-selection.component';


export type Operation = 'add' | 'remove' | 'select';


export interface DropDownChangeEvent {
  option: WhiteOption | WhiteDropDownOptionComponent<any>;
  multiple: boolean;
  op: Operation;
  payload?: any;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'white-dropdown',
  exportAs: 'white-dropdown',
  styleUrls: ['white-dropdown.component.scss'],
  templateUrl: 'white-dropdown.component.html',
  host: {
    '[class.dropdown-compact]': 'compact'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WhiteDropDownComponent),
      multi: true,
    }
  ]
})
export class WhiteDropDownComponent<T> implements OnInit, AfterViewInit, OnChanges, ControlValueAccessor {

  @Input() open: boolean = false;
  @Input() title: string;
  @Input() options: WhiteOption[];
  @Input() currentIndex: number;
  @Input() selectedValue: string | number;
  @Input() checkedValues: Set<any>;
  @Input() multiple: boolean = false;
  @Input() inputFilter: boolean = false;
  @Input() allowHTML: boolean = false;
  @Input() enableInlineTags: boolean = true;
  @Input() disabled: boolean;
  @Input() menuDisabled: boolean;
  @Input() closeOnMouseOut: boolean;

  @Input() menuClass: string;
  @Input() menuWidth: number;
  @Input() menuAlign: 'left' | 'right' | 'auto' = 'auto';
  @Input() color: 'black' | 'white' = 'black';

  @Input() increaseMenuTopOffset: number;

  @Input() compact: boolean;

  @Output() change: EventEmitter<DropDownChangeEvent> = new EventEmitter<DropDownChangeEvent>();
  @Output() filterInput: EventEmitter<string> = new EventEmitter();

  @Output() onOpen: EventEmitter<void> = new EventEmitter<void>();
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();

  @ContentChildren(WhiteDropDownOptionComponent, {descendants: true}) descendantsOptions: QueryList<WhiteDropDownOptionComponent<any>>;

  @ContentChildren(WhiteDropdownChipComponent) chips: QueryList<WhiteDropdownChipComponent>;

  @ContentChild(WhiteDropdownCustomSelectionComponent) customSelection: WhiteDropdownCustomSelectionComponent;

  protected idOptionDict: { [id: string]: WhiteOption } = {};

  actualMenuWidth: number;

  protected selected: WhiteDropDownOptionComponent<T> | { value: T, viewValue: string } = null;

  private _value: T;

  @Input()
  get value(): T {
    return this._value;
  }

  set value(val: T) {
    this._value = val;
    this.setSelected(val);
  }

  private sizeChanged = new Subject<{ event: any }>();

  private static TAGS_MAX_ROWS = 2;
  private static TAGS_DOTS_WIDTH = 40;
  checkedListDotsVisibility: boolean = false;
  protected tagItemHeight: number = 18;

  private documentClickUnregister: () => void;

  menuTop: number;
  menuLeft: number;

  private _bodyPortalHost: DomPortalHost;
  private _menuTemplatePortal: TemplatePortal<any>;

  get bodyPortalHost(): DomPortalHost {

    if (!this._bodyPortalHost) {

      this._bodyPortalHost = new DomPortalHost(
        document.body,
        this._componentFactoryResolver,
        this._appRef,
        this._injector
      );
    }

    return this._bodyPortalHost;
  }

  get menuTemplatePortal(): TemplatePortal<any> {

    if (!this._menuTemplatePortal) {
      this._menuTemplatePortal = new TemplatePortal<any>(this.menuElementTemplateRef, this._viewContainerRef);
    }

    return this._menuTemplatePortal;
  }

  inputFilterText: string;

  @ViewChild('menu') private menuElementTemplateRef: TemplateRef<any>;
  @ViewChild('tagContainer') private tagContainerElementRef: ElementRef;
  @ViewChild('inputFilter') private inputFilterElementRef: ElementRef;

  private selectionChangeSubscription: Subscription = Subscription.EMPTY;

  private propagateChange: any = () => {
  };

  private propagateTouched: any = () => {
  };

  get optionSelectionChanges(): Observable<WhiteOptionChangeEvent<any>> {
    return merge(...this.descendantsOptions.map(option => option.onSelectionChange));
  }

  constructor(
    public elementRef: ElementRef,
    private renderer: Renderer2,
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _injector: Injector,
    private _appRef: ApplicationRef,
    private _viewContainerRef: ViewContainerRef,
    private changeDetectorRef: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {

    this.initOptions();

    this.sizeChanged
      .pipe(
        debounceTime(500)
      )
      .subscribe(() => {
        this.updateMenuPosition();
      });
  }

  ngAfterViewInit(): void {

    this.descendantsOptions
      .changes
      .subscribe(() => {

        this.resetDescendantsOptions();
      });

    this.resetDescendantsOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {

    const selectedValueChange = changes['selectedValue'];
    const optionsChange = changes['options'];

    if (optionsChange && optionsChange.currentValue) {
      this.initOptions();
    }

    if (selectedValueChange) {

      this.currentIndex = this.getIndexByValue(selectedValueChange.currentValue);
    }

    if (this.multiple && this.enableInlineTags && changes.checkedValues) {
      this.updateTags();
    }
  }

  private resetDescendantsOptions(): void {

    this.selectionChangeSubscription.unsubscribe();

    this.selectionChangeSubscription = this.optionSelectionChanges
      .subscribe((ev: WhiteOptionChangeEvent<any>) => {

        if (!this.multiple) {

          this.selected = ev.source;

          this.value = this.selected.value;

          this.propagateChange(this.value);

          this.closeMenu();
        }

        const changeEvent: DropDownChangeEvent = {
          option: ev.source,
          multiple: this.multiple,
          op: 'select',
        };

        this.change.emit(changeEvent);
      });

    this.setSelected(this.value);
  }

  setSelected(val: T): void {

    if (val === null || val === undefined) {
      this.selected = null;
    } else if (this.descendantsOptions && this.descendantsOptions.length) {
      for (let option of this.descendantsOptions.toArray()) {
        if (option.value === val) {
          this.selected = option;
          break;
        }
      }
    } else if (this.options && this.options.length) {
      for (let option of this.options) {
        if (option.value as any === val) {
          this.selected = {viewValue: option.text, value: option.value as any};
          break;
        }
      }
    }

    this.changeDetectorRef.markForCheck();
  }

  initOptions(): void {

    if (this.options && this.options.length) {

      if (this.multiple) {

        this.setDictRec(this.options);

      } else if (this.selectedValue !== null && this.selectedValue !== undefined) {

        this.currentIndex = this.getIndexByValue(this.selectedValue);

      } else if (this.title === undefined || this.title === null) {

        this.currentIndex = 0;
      }
    }
  }

  setDictRec(options: WhiteOption[]): void {

    for (const option of options) {

      this.idOptionDict[option.value] = option;

      if (option.children && option.children.length) {
        this.setDictRec(option.children);
      }
    }
  }

  getChecked(): WhiteOption[] {

    if (!this.checkedValues) {
      return [];
    }

    return Array.from(this.checkedValues).sort().map(key => this.idOptionDict[key]).filter(el => el);
  }

  getIndexByValue(value: number | string): number {

    for (let i = 0, len = this.options.length; i < len; ++i) {

      const option = this.options[i];

      if (option.value === value) {
        return i;
      }
    }
  }

  setCurrentIndex(index: number): void {

    this.currentIndex = index;

    const changeEvent: DropDownChangeEvent = {
      option: this.options[this.currentIndex],
      multiple: this.multiple,
      op: 'select',
    };

    this.change.emit(changeEvent);

    this.open = false;
  }

  toggleMenu(): void {
    this.open ? this.closeMenu() : this.openMenu();
  }

  unbindDocumentClick() {

    if (this.documentClickUnregister) {
      this.documentClickUnregister();
      this.documentClickUnregister = null;
    }
  }

  updateMenuPosition(): void {

    const offset = getOffset(this.elementRef.nativeElement);
    const size = getSize(this.elementRef.nativeElement);

    this.menuTop = size.height + offset.top + (this.increaseMenuTopOffset || 0);
    this.menuLeft = offset.left + (this.menuAlign === 'right' && this.menuWidth ? size.width - this.menuWidth : 0);
    this.actualMenuWidth = size.width;
  }

  openMenu() {

    this.open = true;

    this.updateMenuPosition();

    this.bodyPortalHost.attach(this.menuTemplatePortal);

    this.onOpen.emit(null);

    requestAnimationFrame(() => {

      if (this.inputFilter) {
        this.inputFilterElementRef.nativeElement.focus()
      }

      this.documentClickUnregister = this.renderer.listen('document', 'click', (e: any) => {

        const el = this.elementRef.nativeElement;

        // todo: figure out how to get the dom element of rendered TemplatePortal
        const menuEl = document.querySelector('.white-dropdown-menu');

        if (!menuEl || (!el.contains(e.target) && !menuEl.contains(e.target))) {

          this.toggleMenu();
        }
      });
    });
  }

  closeMenu() {

    if (!this.open) {
      return;
    }

    this.bodyPortalHost.detach();

    this.open = false;

    this.unbindDocumentClick();

    this.updateTags();

    if (this.inputFilter) {
      this.inputFilterText = '';
    }

    this.changeDetectorRef.markForCheck();

    this.onClose.emit(null);
  }

  toggleChecked(option: WhiteOption, recalculateTags: boolean = false): void {

    let op: Operation;

    if (this.checkedValues.has(option.value)) {
      this.checkedValues.delete(option.value);
      op = 'remove';
    } else {
      this.checkedValues.add(option.value);
      op = 'add';
    }

    if (option.parent) {

      let allChecked = true;
      let allUnChecked = true;

      for (const opt of option.parent.children) {

        if (this.checkedValues.has(opt.value)) {
          allUnChecked = false;
        } else {
          allChecked = false;
        }
      }

      if (allChecked) {
        this.checkedValues.add(option.parent.value);
      }

      if (allUnChecked) {
        this.checkedValues.delete(option.parent.value);
      }
    }

    if (option.children && option.children.length) {
      this.toggleChildren(option.children, op === 'add');
    }

    const changeEvent: DropDownChangeEvent = {
      option: option,
      multiple: this.multiple,
      op: op,
      payload: {
        all: this.getChecked()
      }
    };

    this.change.emit(changeEvent);

    if (recalculateTags) {
      this.updateTags();
    }
  }

  toggleChildren(options: WhiteOption[], isAdding: boolean): void {

    for (const option of options) {
      if (isAdding) {
        this.checkedValues.add(option.value);
      } else {
        this.checkedValues.delete(option.value);
      }

      if (option.children) {
        this.toggleChildren(option.children, isAdding);
      }
    }
  }

  isChecked(option: WhiteOption): boolean {

    return this.checkedValues.has(option.value);
  }

  onFilterInput(value: string): void {
    this.inputFilterText = value;
    this.filterInput.emit(value);
  }

  updateTags(): void {
    Promise.resolve().then(() => this.calculateTagsVisibility());
  }

  calculateTagsVisibility(): void {

    if (this.tagContainerElementRef) {

      const tagContainer = <HTMLElement>this.tagContainerElementRef.nativeElement;

      const tagItems = tagContainer.querySelectorAll('.white-tag-item');

      const width = tagContainer.offsetWidth;
      const marginRight = 10;
      let rows = WhiteDropDownComponent.TAGS_MAX_ROWS;
      const availableHeight = this.elementRef.nativeElement.offsetHeight;

      if (availableHeight <= 40) {
        rows = 1;
      }

      let availableWidth = width;
      let rowsCount = 1;

      for (let i = 0, len = tagItems.length; i < len; ++i) {

        const tagItem = <HTMLElement>tagItems[i];

        tagItem.style.display = 'flex';

        availableWidth -= (tagItem.offsetWidth + marginRight);

        if (availableWidth <= 0) {

          if (rowsCount === rows) {

            let latestVisibleRowWidthLeft = availableWidth += (tagItem.offsetWidth + marginRight);

            // if remaining space is not enough for the "dots" then we need to hide the previous element too
            if (latestVisibleRowWidthLeft < WhiteDropDownComponent.TAGS_DOTS_WIDTH) {
              (tagItems[i - 1] as HTMLElement).style.display = 'none';
            }
          }

          availableWidth = width - (tagItem.offsetWidth + marginRight);

          rowsCount += 1;
        }

        if (rowsCount > rows) {
          tagItem.style.display = 'none';
        }
      }

      this.checkedListDotsVisibility = rowsCount > rows;

      if (rowsCount > rows) {
        rowsCount = rows;
      }

      if (rowsCount === 1) {
        this.tagItemHeight = availableHeight - 12;
      } else {
        this.tagItemHeight = availableHeight / 2 - 5;
      }
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: T): void {

    this.value = obj;
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(e) {

    this.sizeChanged.next({event: e});

    if (this.enableInlineTags && this.multiple && this.checkedValues && this.checkedValues.size) {

      this.updateTags();
    }
  }
}
