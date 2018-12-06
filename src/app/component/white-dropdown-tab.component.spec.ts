import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';

import { WhiteDropDownTabComponent, DropDownTab } from './white-dropdown-tab.component';


describe('WhiteDropDownTabComponent', () => {

  let fixture: ComponentFixture<TabbedMultipleDropdownComponent>;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [
        WhiteDropDownTabComponent,
        TabbedMultipleDropdownComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabbedMultipleDropdownComponent);

  }));

  it('should open/close dropdown', () => {

    fixture.detectChanges();

    const dropdownDebugElement = fixture.debugElement.query(By.css('white-dropdown-tab'));

    const currentTitle = dropdownDebugElement.query(By.css('.white-dropdown-current-text')).nativeElement;

    expect(currentTitle.textContent).toContain('Here is title');

    currentTitle.click();
    fixture.detectChanges();

    expect(dropdownDebugElement.query(By.css('.white-dropdown-menu'))).toBeTruthy();

    currentTitle.click();
    fixture.detectChanges();

    expect(dropdownDebugElement.query(By.css('.white-dropdown-menu'))).toBeFalsy();
  });

  it('should put checked value on dropdown', () => {

    fixture.detectChanges();

    const dropdownDebugElement = fixture.debugElement.query(By.css('white-dropdown-tab'));
    const dropDownComponent = <WhiteDropDownTabComponent<string>>dropdownDebugElement.componentInstance;
    const currentTitle = dropdownDebugElement.query(By.css('.white-dropdown-current-text')).nativeElement;

    currentTitle.click();
    fixture.detectChanges();

    const optionsDebugElements = dropdownDebugElement.queryAll(By.css('.white-dropdown-item'));

    optionsDebugElements[0].nativeElement.click();
    fixture.detectChanges();

    expect(Array.from(dropDownComponent.checkedValues)).toEqual(['1']);
    expect(dropDownComponent.getChecked().length).toEqual(1);
    expect(dropdownDebugElement.query(By.css('.white-dropdown-current-text'))).toBeFalsy();
    expect(dropdownDebugElement.query(By.css('.white-dropdown-checked-list'))).toBeTruthy();

    const tagItems = dropdownDebugElement.queryAll(By.css('.white-tag-item'));

    expect(tagItems.length).toEqual(1);

    const tagEl = tagItems[0].nativeElement;
    expect(tagEl.querySelector('span').textContent).toBe('Cannes');

    // remove tag
    tagEl.querySelector('button').click();

    fixture.detectChanges();
    expect(dropdownDebugElement.query(By.css('.white-dropdown-current-text'))).toBeTruthy();
    expect(dropdownDebugElement.query(By.css('.white-dropdown-checked-list'))).toBeFalsy();
  });
});


@Component({
  selector: 'tabbed-dropdown',
  template: `
    <white-dropdown-tab [tabs]="tabs" [title]="'Here is title'" [multiple]="true"></white-dropdown-tab>`,
  styleUrls: []
})
class TabbedMultipleDropdownComponent {

  tabs: DropDownTab[] = [
    {
      name: 'tab1',
      options: [
        {
          value: '1',
          text: 'Cannes and neighborhood',
          shortText: 'Cannes'
        },
        {
          value: '2',
          text: 'Mougins and neighborhood',
          shortText: 'Mougins'
        },
        {
          value: '3',
          text: `Cap d'Antibes and neighborhood`,
          shortText: `Cap d'Antibes`
        },
      ]
    }
  ];

}
