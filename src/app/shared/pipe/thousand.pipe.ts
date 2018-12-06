import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'currencyThousand'})
export class CurrencyThousandPipe implements PipeTransform {
  transform(value: number): string {

    const values = [];
    const int = Math.floor(value);
    const decimal = value - int;

    let c = Math.ceil(String(int).length / 3);
    let i = 1;
    let rest = 0;

    while (c--) {

      rest = value % (i * 1000);

      const x = Math.floor(rest / i);

      if (x > 99 || c === 0) {
        values.unshift(x);
      } else if (x > 9) {
        values.unshift('0' + x);
      } else {
        values.unshift('00' + x);
      }

      i *= 1000;
    }

    let result = values.join(' ');

    if (decimal > 0) {
      result += (',' + (decimal * 100));
    }

    return result;
  }
}
