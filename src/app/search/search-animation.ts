import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';


export const searchBarStateAnimation: AnimationTriggerMetadata = trigger('searchBarState', [
  state('inactive', style({
    marginTop: '-90px',
    display: 'none',
  })),
  state('active', style({
    marginTop: '0',
    display: 'block',
  })),
  transition('inactive => active', animate('500ms ease')),
  transition('active => inactive', animate('500ms ease'))
]);

export const leftBlockStateAnimation: AnimationTriggerMetadata = trigger('leftBlockState', [
  state('search', style({
    width: '66%',
  })),
  state('details', style({
    width: '66%',
  })),
  transition('search => details', animate('500ms ease')),
  transition('details => search', animate('500ms ease'))
]);

export const rightBlockStateAnimation: AnimationTriggerMetadata = trigger('rightBlockState', [
  state('search', style({
    width: '34%',
  })),
  state('details', style({
    width: '34%',
  })),
  transition('search => details', animate('500ms ease')),
  transition('details => search', animate('500ms ease'))
]);
