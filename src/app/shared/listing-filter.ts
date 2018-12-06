import {
  copyPrimitiveFields,
  thousandFormat
} from '../util';
import {
  SaleRent,
  SortValue
} from '../shared';


export class SearchParams {

  sale: SaleRent;
  cityValues: Set<number> = new Set<number>();
  typeValues: Set<string> = new Set<string>();
  refs: Set<number> = new Set<number>();
  rentalRangeValues: Set<string> = new Set<string>();
  surfaceFrom: number;
  surfaceTo: number;
  bedroomsFrom: number;
  bedroomsTo: number;

  newBuild: boolean;
  sort: SortValue;

  private _budgetFrom: number;
  private _budgetTo: number;

  private _budgetFromFormatted: string;
  private _budgetToFormatted: string;

  get budgetFrom(): number {
    return this._budgetFrom;
  }

  set budgetFrom(val: number) {
    this._budgetFrom = val;
    this._budgetFromFormatted = null;
  }

  get budgetTo(): number {
    return this._budgetTo;
  }

  set budgetTo(val: number) {
    this._budgetTo = val;
    this._budgetToFormatted = null;
  }

  get budgetFromFormatted(): string {

    if (!this._budgetFrom) {
      return null;
    }

    if (!this._budgetFromFormatted) {
      this._budgetFromFormatted = thousandFormat(String(this._budgetFrom));
    }

    return this._budgetFromFormatted;
  }

  get budgetToFormatted(): string {

    if (!this._budgetTo) {
      return null;
    }

    if (!this._budgetToFormatted) {
      this._budgetToFormatted = thousandFormat(String(this._budgetTo));
    }

    return this._budgetToFormatted;
  }

  toDict(): { [id: string]: any } {

    return {
      sale: this.sale,
      city_values: this.cityValues.size ? Array.from(this.cityValues) : null,
      type_values: this.typeValues ? Array.from(this.typeValues) : null,
      refs: this.refs.size ? Array.from(this.refs) : null,
      surface_from: this.surfaceFrom,
      surface_to: this.surfaceTo,
      budget_from: this.budgetFrom,
      budget_to: this.budgetTo,
      bedrooms_from: this.bedroomsFrom,
      bedrooms_to: this.bedroomsTo,
      new_build: this.newBuild ? 1 : 0,
      sort: this.sort,
    }
  }

  clone(): SearchParams {
    const o = copyPrimitiveFields(this, new SearchParams());
    o.cityValues = new Set(this.cityValues);
    o.typeValues = new Set(this.typeValues);
    o.refs = new Set(this.refs);
    o.rentalRangeValues = new Set(this.rentalRangeValues);
    return o;
  }
}
