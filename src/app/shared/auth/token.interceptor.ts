import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { PrincipalService } from './principal.service';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private principalService: PrincipalService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (this.principalService.token) {

      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${this.principalService.token}`
        }
      });
    }

    return next.handle(req);
  }
}
