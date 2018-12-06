import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';


export const popupState: AnimationTriggerMetadata = trigger('popupState', [

  state('in', style({
    transform: 'translateY(0px)',
    opacity: '1',
  })),

  transition(':enter', [
    style({
      transform: 'translateY(-40px)',
      opacity: '0',
    }),
    animate('500ms ease')
  ]),

  transition(':leave', [
    animate('500ms ease', style({
      transform: 'translateY(-40px)',
      opacity: '0',
    }))
  ]),
]);
