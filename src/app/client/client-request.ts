import { Type } from 'class-transformer';

import {
  Cloneable,
  copyPrimitiveFields
} from '../util';
import { Injectable } from '@angular/core';
import {
  JsonMapper,
  SaleRent
} from '../shared';


export class ClientRequest implements Cloneable<ClientRequest> {
  id: number;
  sale: SaleRent;

  @Type(() => Set)
  types: Set<string>;

  @Type(() => Set)
  cities: Set<number>;

  budgetMin: number;
  budgetMax: number;
  surfaceMin: number;
  surfaceMax: number;
  bedroomsMin: number;
  bedroomsMax: number;

  clone(): ClientRequest {

    const o = copyPrimitiveFields(this, new ClientRequest());
    o.types = new Set(this.types);
    o.cities = new Set(this.cities);

    return o;
  }

  getBudgetFormatted(): string {

    if (this.budgetMin === this.budgetMax && this.budgetMin > 0) {
      return String(this.budgetMin);
    }

    const chunks: string[] = [];

    if (this.budgetMin) {
      chunks.push(String(this.budgetMin));
    }

    if (this.budgetMax) {
      chunks.push(String(this.budgetMax));
    }

    if (chunks.length) {
      return chunks.join('-');
    }

    return '';
  }

  getSurfaceFormatted(): string {

    if (this.surfaceMin === this.surfaceMax && this.surfaceMin > 0) {
      return String(this.surfaceMin);
    }

    const chunks: string[] = [];

    if (this.surfaceMin) {
      chunks.push(String(this.surfaceMin));
    }

    if (this.surfaceMax) {
      chunks.push(String(this.surfaceMax));
    }

    if (chunks.length) {
      return chunks.join('-');
    }

    return '';
  }

  getBedroomsFormatted(): string {

    if (this.bedroomsMin === this.bedroomsMax && this.bedroomsMin > 0) {
      return String(this.bedroomsMin);
    }

    const chunks: string[] = [];

    if (this.bedroomsMin) {
      chunks.push(String(this.bedroomsMin));
    }

    if (this.bedroomsMax) {
      chunks.push(String(this.bedroomsMax));
    }

    if (chunks.length) {
      return chunks.join('-');
    }

    return '';
  }

  static init(): ClientRequest {
    const o = new ClientRequest();
    o.types = new Set<string>();
    o.cities = new Set<number>();
    return o;
  }
}


@Injectable({
  providedIn: 'root'
})
export class ClientRequestMapper {

  constructor(private jsonMapper: JsonMapper) {
  }

  serialize(object: ClientRequest): any {

    const data = this.jsonMapper.serialize(object);

    data.cities = Array.from(data.cities);
    data.types = Array.from(data.types);

    return data;
  }
}


export function copyClientRequestFields(objSource: ClientRequest, objDest: ClientRequest): void {

  objDest.id = objSource.id;
  objDest.budgetMin = objSource.budgetMin;
  objDest.budgetMax = objSource.budgetMax;
  objDest.surfaceMin = objSource.surfaceMin;
  objDest.surfaceMax = objSource.surfaceMax;
  objDest.bedroomsMin = objSource.bedroomsMin;
  objDest.bedroomsMax = objSource.bedroomsMax;
  objDest.cities = new Set(objSource.cities);
  objDest.types = new Set(objSource.types);
}
