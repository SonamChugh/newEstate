import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {
  Observable,
  of,
} from 'rxjs';

import {
  PrincipalService,
  TranslationService,
} from '../shared';

import { ClientService } from '../client';


@Injectable({
  providedIn: 'root'
})
export class VipLandingGuardService implements CanActivate {

  constructor(
    private router: Router,
    private translation: TranslationService,
    private clientService: ClientService,
    private principal: PrincipalService,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (this.principal.isAuthenticated) {

      this.router.navigate(['/', this.translation.activeLocale, 'vip'], {
        queryParams: route.queryParams
      });

      return of(false);
    }

    return of(true);
  }
}
