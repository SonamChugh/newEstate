import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { TranslationService } from './translation.service';


@Injectable()
export class AcceptLanguageInterceptor implements HttpInterceptor {

  constructor(private translationService: TranslationService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    req = req.clone({
      setHeaders: {
        'Accept-Language': `${this.translationService.activeLocale}`
      }
    });

    return next.handle(req);
  }
}
