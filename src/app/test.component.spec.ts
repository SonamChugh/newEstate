import { TestBed, async } from '@angular/core/testing';
import { of } from 'rxjs';

import { TestComponent } from './test.component';


describe('test component tests', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestComponent
      ],
    }).compileComponents();
  }));

  it('should create TestComponent instance', () => {
    let fixture = TestBed.createComponent(TestComponent);
    expect(fixture.componentInstance instanceof TestComponent).toBe(true, 'should create TestComponent');
  });

  it(`should have title 'Hello'`, () => {

    let fixture = TestBed.createComponent(TestComponent);
    expect(fixture.debugElement.componentInstance.title).toBe('Hello');
  });

  it(`should render title 'Hello' in a h1 tag`, () => {

    let fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    const el = fixture.debugElement.nativeElement;

    expect(el.querySelector('h1').textContent).toContain('Hello');
  });

  it(`should be equal`, () => {

    of(1).subscribe((val) => {
      expect(val).toBe(1);
    })
  });
});
