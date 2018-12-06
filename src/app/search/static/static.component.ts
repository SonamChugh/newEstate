import {
  Component,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { clearObject } from '../../util';
import {
  TranslationService,
  StaticPageService,
  StaticPageContent,
  StaticPageName,
} from '../../shared';


export abstract class SimpleDynamicTextPage implements OnInit {
  page: StaticPageName;
  content: StaticPageContent;
  contentClass: { [className: string]: boolean } = {};

  protected activatedRoute: ActivatedRoute;
  protected staticPageService: StaticPageService;
  protected translation: TranslationService;
  protected router: Router;

  ngOnInit(): void {

    this.activatedRoute
      .url
      .subscribe(segments => {

        this.page = segments[segments.length - 1].path as StaticPageName;

        clearObject(this.contentClass);
        this.contentClass[`page-${this.page}`] = true;

        this.updateContent()
          .subscribe();
      });

    this.translation
      .changed
      .subscribe(() => {
        this.router.navigate(
          this.translation.replaceLocale(
            this.activatedRoute.snapshot.url,
            this.translation.activeLocale
          )
        )
      });
  }

  updateContent(): Observable<void> {
    return this.staticPageService
      .getPageContent(this.page, this.translation.activeLocale)
      .pipe(
        map(content => {
          this.content = content;
        })
      );
  }
}


@Component({
  selector: 'simple-dynamic-content-page',
  templateUrl: 'simple-dynamic-content-page.html',
  styleUrls: ['simple-dynamic-content-page.scss']
})
export class DynamicContentPageComponent extends SimpleDynamicTextPage {

  constructor(
    public translation: TranslationService,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected staticPageService: StaticPageService
  ) {
    super();
  }
}
