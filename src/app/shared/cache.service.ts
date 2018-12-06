import { Injectable } from '@angular/core';
import { TransferState, makeStateKey } from '@angular/platform-browser';


@Injectable()
export class CacheService {

  private _keys = new Set<string>();

  constructor(private transfer: TransferState) {
  }

  has(key: string): boolean {
    return this.transfer.hasKey(makeStateKey(key));
  }

  set(key: string, value: any): void {
    this._keys.add(key);
    this.transfer.set<any>(makeStateKey(key), value);
  }

  get(key: string): any {
    return this.transfer.get<any>(makeStateKey(key), null);
  }

  remove(key: string): void {
    this._keys.delete(key);
    this.transfer.remove(makeStateKey(key));
  }

  getKeys(): string[] {

    try {
      const cache = JSON.parse(this.transfer.toJson());
      return Object.keys(cache);
    } catch (e) {
      console.trace(e);
      return [];
    }
  }

  clearKeysStartsWith(value: string): void {

    Object.keys(this.getTransferCache())
      .filter(key => key.indexOf(value) === 0)
      .forEach(key => this.transfer.remove(makeStateKey(key)));
  }

  clear(): void {

    Object.keys(this.getTransferCache())
      .forEach(key => this.transfer.remove(makeStateKey(key)));
  }

  private getTransferCache(): any {
    try {
      return JSON.parse(this.transfer.toJson());
    } catch (e) {
      console.trace(e);
      return {};
    }
  }
}
