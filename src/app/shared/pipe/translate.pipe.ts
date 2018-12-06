import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform
} from '@angular/core';
import { Subscription } from 'rxjs';

import { TranslationService } from '../translation.service';


@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {

  value: string = '';
  lastKey: string;

  sub: Subscription;

  constructor(
    private translation: TranslationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {

    this.sub = this.translation.changed
      .subscribe(() => {
        this.lastKey = null;
        this.changeDetectorRef.markForCheck();
      });
  }

  transform(value: string, defaultValue?: string): string {

    if (!value || value.length === 0) {
      return value;
    }

    if (this.lastKey === value) {
      return this.value;
    }

    this.lastKey = value;

    this.value = this.translation.strings.hasOwnProperty(value)
      ? this.translation.strings[value]
      : (defaultValue || '');

    return this.value;
  }

  private dispose(): void {
    this.sub.unsubscribe();
  }

  ngOnDestroy(): void {
    this.dispose();
  }
}
