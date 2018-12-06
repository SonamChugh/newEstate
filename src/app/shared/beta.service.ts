import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

import { CookieService } from './cookie.service';


const ZERO_KEY_CODE = 48;


@Injectable({
  providedIn: 'root'
})
export class BetaService {

  activated: boolean;

  private keyPressed = new Subject<KeyboardEvent>();
  private logoClicked = new Subject<void>();

  private counter: number = 0;

  constructor(private cookieService: CookieService) {

    this.activated = this.cookieService.get('beta') === '1';

    this.keyPressed
      .pipe(
        tap(ev => {

          if (ev.keyCode === ZERO_KEY_CODE) {

            this.counter += 1;

            if (this.counter === 5) {
              console.log('beta service has been activated');
              this.activate();
            }

          } else {

            this.counter = 0;
          }
        }),
        debounceTime(5000)
      )
      .subscribe(() => {
        this.counter = 0;
      });

    this.logoClicked
      .pipe(
        tap(() => {

          this.counter += 1;

          if (this.counter === 5) {
            console.log('beta service has been activated');
            this.activate();
          }

        }),
        debounceTime(5000)
      )
      .subscribe(() => {
        this.counter = 0;
      });
  }

  activate(): void {

    this.cookieService.set('beta', '1', {path: '/'});
    this.activated = true;
  }

  onLogoClick(): void {

    if (this.activated) {
      return;
    }

    this.logoClicked.next(null);
  }

  onKeyPressed(ev: KeyboardEvent): void {

    if (this.activated) {
      return;
    }

    this.keyPressed.next(ev);
  }
}
