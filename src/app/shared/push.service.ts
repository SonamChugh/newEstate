import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { DomService } from './dom.service';


@Injectable({
  providedIn: 'root'
})
export class PushService {

  constructor(
    private api: ApiService,
    private domService: DomService
  ) {
  }

  saveSubscription(sub: PushSubscription): Observable<void> {

    const body = {
      subscription: sub.toJSON(),
      origin: this.domService.document.location.origin,
      path: this.domService.getLocationPath(),
      user_agent: this.domService.getUserAgent()
    };

    return this.api.post('/php/push-auth.php', body);
  }

  updateSubscription(pushAuthId: number): Observable<void> {

    const body = {
      push_auth_id: pushAuthId
    };

    return this.api.put('/php/push-auth.php', body);
  }
}
