import {
  Component,
  Input,
  OnInit,
  Inject,
  HostListener
} from '@angular/core';
import { Router } from '@angular/router';

import { getBodySize } from '../util';

import {
  TranslationService,
  LocaleShort,
  IS_BROWSER,
  ConfigService,
  GoogleAnalyticsService,
  gaEvents,
  getGaPageByRoute
} from '../shared';


@Component({
  selector: 'language-selector',
  templateUrl: 'language-selector.component.html',
  styleUrls: ['language-selector.component.scss']
})
export class LanguageSelectorComponent implements OnInit {

  @Input() view: 'a' | 'b' | 'c' = 'a';
  @Input() color: 'black' | 'white' = 'black';

  mobileView: boolean;

  constructor(
    private router: Router,
    public translation: TranslationService,
    @Inject(IS_BROWSER) public isBrowser: boolean,
    public config: ConfigService,
    private googleAnalyticsService: GoogleAnalyticsService
  ) {
  }

  ngOnInit() {

    if (this.isBrowser) {

      const size = getBodySize();

      this.mobileView = this.config.isMobileView(size.width);
    }
  }

  onChange(value: LocaleShort) {

    // check for safety as we have listeners on both events - change and blur (for ios mobile change may not work)
    if (this.translation.lang !== value) {

      const event = gaEvents.changeLang;
      const page = getGaPageByRoute(this.router.url);

      this.googleAnalyticsService.sendEvent(event.category, event.action, `${page} - ${value}`, event.value);

      this.translation.loadAndSetStrings(value).subscribe();
    }
  }

  getMenuWidth(): number | null {

    switch (this.view) {
      case 'a':
      case 'b':
        return 150;
      default:
        return null;
    }
  }

  getMenuClass(): string | null {

    switch (this.view) {
      case 'a':
        return `language-selector-menu-flags ${this.color}`;
      case 'b':
        return `language-selector-menu-flags ${this.color} menu-black`;
      case 'c':
        return 'language-selector-menu-flags-only';
      default:
        return null;
    }
  }

  getMenuTopOffset(): number {

    switch (this.view) {
      case 'a':
        return this.mobileView ? 23 : 22;
      case 'b':
        return 15;
      default:
        return 0;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {

    this.mobileView = this.config.isMobileView(event.target.innerWidth);
  }

}


