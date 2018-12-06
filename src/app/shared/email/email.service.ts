import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';


@Injectable()
export class EmailService {

  constructor(private api: ApiService) {
  }

  sendUnsubscribe(code: string): Observable<any> {

    const body = {
      code: code,
    };

    return this.api.post('/php/unsubscribe.php', JSON.stringify(body));
  }

  sendSubscribe(code: string): Observable<any> {

    const body = {
      code: code,
      undo: 1
    };

    return this.api.post('/php/unsubscribe.php', JSON.stringify(body));
  }
}
