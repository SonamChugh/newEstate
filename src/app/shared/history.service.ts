import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  static MAX_SIZE = 10;

  private pages: string[] = [];

  constructor() {
  }

  get size(): number {
    return this.pages.length;
  }

  get previousPage(): string | null {
    return this.pages[this.pages.length - 2] || null;
  }

  addPage(url: string): void {

    this.pages.push(url);

    if (this.pages.length > HistoryService.MAX_SIZE) {
      this.pages.shift();
    }
  }
}
