import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { TranslationService } from './translation.service';


@Injectable({
  providedIn: 'root'
})
export class LocaleGuardService implements CanActivate {

  constructor(private router: Router, private translationService: TranslationService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    const segments = route.url;
    const path = segments[0] ? segments[0].path : null;

    if (segments.length === 0 ||
      (segments.length && TranslationService.LOCALES_ARRAY.indexOf(path) === -1)) {

      this.router.navigateByUrl('/' + this.translationService.activeLocale + (state.url === '/' ? '' : state.url), {
        queryParams: route.queryParams
      });

      return false;
    }

    return true;
  }
}
