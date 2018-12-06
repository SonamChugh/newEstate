import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { AnimationEvent } from '@angular/animations'

import {
  SaleRent,
  SearchParams,
  SearchService,
  TranslationService
} from '../shared';
import { ButtonGroupChangeEvent } from '../component/button-group.component';
import { WhiteOption } from '../component/white-option';

import {
  isNullOrUndefined,
  thousandFormat,
  setCaretPosition
} from '../util';

import { popupState } from './mobile-filters.animation';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mobile-filters',
  templateUrl: 'mobile-filters.component.html',
  styleUrls: ['mobile-filters.component.scss'],
  animations: [popupState]
})
export class MobileFiltersComponent implements OnInit {

  @Input() searchParams: SearchParams;
  @Input() propertiesFound: number = null;
  @Input() loading: boolean = true;

  @Output() onSearch: EventEmitter<any> = new EventEmitter();
  @Output() onConfirm: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<any> = new EventEmitter();

  BuyRent = SaleRent;

  isCityFilterVisible: boolean = false;
  isCityTagsVisible: boolean = true;

  citiesAnimationPopupState: string = 'in';

  checkedCities: WhiteOption[] = [];

  protected idOptionDict: { [id: string]: WhiteOption } = {};

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public translation: TranslationService,
    public searchService: SearchService
  ) {

    for (const tab of searchService.citiesOptions) {

      tab.options.forEach(el => {
        this.idOptionDict[el.value] = el;
      });
    }
  }

  ngOnInit(): void {

    if (!this.searchParams) {
      throw new Error('searchParams property is required');
    }

    if (isNullOrUndefined(this.searchParams.sale)) {
      this.searchParams.sale = Number(this.searchService.buyRentOptions[0].value);
    }

    this.checkedCities = this.getCheckedCities();
  }

  onBuyRentChange(changeEvent: ButtonGroupChangeEvent): void {

    this.searchParams.sale = Number(changeEvent.option.value);

    this.onSearch.emit(null);
  }

  handleButtonGroupChange<T>(obj: Set<T>, changeEvent: ButtonGroupChangeEvent) {

    if (changeEvent.op === 'add') {
      obj.add(changeEvent.option.value as any);
    } else {
      obj.delete(changeEvent.option.value as any);
    }

    this.onSearch.emit(null);
  }

  handleMultiple<T>(obj: Set<T>, value: T) {

    if (obj.has(value)) {
      obj.delete(value);
    } else {
      obj.add(value);
    }

    this.onSearch.emit(null);
  }

  performSearch(property: string, value: string): void {

    const v = value ? Number(value.replace(/ /g, '')) : null;

    if (this.searchParams[property] !== v) {
      this.searchParams[property] = v;
      this.onSearch.emit(null);
    }
  }

  toggleCityFilters(value: boolean, updateChecked: boolean): void {

    if (updateChecked) {
      this.checkedCities = this.getCheckedCities();
    }

    if (value) {
      this.isCityTagsVisible = false;
    }

    this.isCityFilterVisible = value;
  }

  onCitiesPopupAnimationDone(ev: AnimationEvent): void {

    this.isCityTagsVisible = !this.isCityFilterVisible;
  }

  getCheckedCities(): WhiteOption[] {
    return Array.from(this.searchParams.cityValues || new Set()).sort().map(key => this.idOptionDict[key]);
  }

  toggleCity(option: WhiteOption, updateChecked: boolean): void {

    const cities = this.searchParams.cityValues;
    const value = <any>option.value;

    if (cities.has(value)) {
      cities.delete(value);
    } else {
      cities.add(value);
    }

    if (updateChecked) {
      this.checkedCities = this.getCheckedCities();
    }

    this.onSearch.emit(null);
  }

  isBudgetRentOptionActive(val: string | null): boolean {

    if (val === null) {
      return !(this.searchParams.budgetFrom || this.searchParams.budgetTo);
    }

    const [fromValue, toValue] = this.searchService.parseBudgetRentValue(val);

    return this.searchParams.budgetFrom === fromValue && this.searchParams.budgetTo === toValue;
  }

  handleRentalBudgetClick(val: string): void {

    const [fromValue, toValue] = this.searchService.parseBudgetRentValue(val);

    this.searchParams.budgetFrom = fromValue;
    this.searchParams.budgetTo = toValue;

    this.onSearch.emit(null);
  }

  restrictDigit(ev: KeyboardEvent): void {

    if (isNaN(Number(String.fromCharCode(ev.charCode)))) {
      ev.preventDefault();
    }
  }

  formatThousands(ev: KeyboardEvent): void {

    const input = <HTMLInputElement>ev.target;
    const val = input.value.replace(/ /g, '');
    input.value = thousandFormat(val);
    setCaretPosition(input, input.value.length);

    this.onSearch.emit(null);
  }
}
