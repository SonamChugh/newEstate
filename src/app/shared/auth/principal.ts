import { User } from './user';


export class Principal {

  private _user: User;

  get user(): User {
    return this._user;
  }

  set user(value: User) {
    this._user = value;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

}
