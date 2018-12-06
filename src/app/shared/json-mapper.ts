import { Injectable } from '@angular/core';
import { plainToClass as _plainToClass } from 'class-transformer';
import * as decamelize from 'decamelize';
import * as camelcaseKeys from 'camelcase-keys';


export declare type ClassType<T> = {
  new(...args: any[]): T;
}

export function mapObject<T>(cls: ClassType<T>, data: any): T {
  return _plainToClass(cls, <{}>camelcaseKeys(data));
}


export function objectToSnakeCase<T>(obj: T): any {

  const res = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      res[decamelize(key)] = obj[key];
    }
  }

  return res;
}


@Injectable({
  providedIn: 'root'
})
export class JsonMapper {

  deserialize<T>(classType: ClassType<T>, data: any): T {

    if (data.id) {
      data.id = +data.id;
    }

    // for (const key in data) {
    //   if (data.hasOwnProperty(key) && data[key] && !Array.isArray(data[key])) {
    //     const value = Number(data[key]);
    //     if (isFinite(value)) {
    //       data[key] = value;
    //     }
    //   }
    // }

    return mapObject(classType, data);
  }

  serialize<T>(obj: T): any {
    return objectToSnakeCase(obj);
  }
}
