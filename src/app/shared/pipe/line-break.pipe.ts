import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'lineBreak'})
export class LineBreakPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/(?:\r\n|\r|\n)/g, '<br />');
  }
}
