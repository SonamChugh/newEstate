import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BaseError } from './error';


export class ApiError extends BaseError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}


@Injectable()
export class ApiService {
  constructor(public _http: HttpClient, @Inject(APP_BASE_HREF) private baseHref: string) {
  }

  protected handleResponseData(responseData: any): any {

    if (responseData.error) {
      throw new ApiError(responseData.error);
    }

    return typeof responseData === 'object' && responseData.hasOwnProperty('response')
      ? responseData.response
      : responseData;
  }

  getText(url: string): Observable<any> {
    return this._http.get(`${this.baseHref}${url}`, {responseType: 'text'});
  }

  get(url: string, options?: any): Observable<any> {
    return this._http.get(`${this.baseHref}${url}`, options)
      .pipe(
        map(response => this.handleResponseData(response)),
        catchError(err => {
          console.log('Error: ', err);
          return throwError(err);
        })
      )
  }

  post(url: string, body: any, options?: any): Observable<any> {

    return this._http.post<any>(`${this.baseHref}${url}`, body, options)
      .pipe(
        map(response => this.handleResponseData(response)),
        catchError(err => {
          console.log('Error: ', err);
          return throwError(err);
        })
      )
  }

  put(url: string, body: any, options?: any): Observable<any> {

    return this._http.put<any>(`${this.baseHref}${url}`, body, options)
      .pipe(
        map(response => this.handleResponseData(response)),
        catchError(err => {
          console.log('Error: ', err);
          return throwError(err);
        })
      )
  }

  postText(url: string, body: any): Observable<any> {
    return this._http.post(`${this.baseHref}${url}`, body, {responseType: 'text'});
  }

  head(url: string, options?: any): Observable<any> {

    return this._http.head<any>(`${this.baseHref}${url}`, options);
  }

}
