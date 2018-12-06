import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'notEmpty'})
export class NotEmptyPipe implements PipeTransform {
  transform(value: any[]): any[] {
    return value ? value.filter(el => el) : value;
  }
}
