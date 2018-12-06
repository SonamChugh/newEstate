import Browser from './browser';

export interface Size {
  width: number;
  height: number;
}

export interface Offset {
  top: number;
  left: number;
}

export function getBodySize(): Size {

  let height;
  let width;

  if (typeof (window.innerWidth) === 'number') {
    height = window.innerHeight;
    width = window.innerWidth;
  } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
    height = document.documentElement.clientHeight;
    width = document.documentElement.clientWidth;
  } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
    height = document.body.clientHeight;
    width = document.body.clientWidth;
  }

  return {
    width: width,
    height: height
  };
}

export function getSize(domNode: HTMLElement): Size {
  return {
    width: domNode.offsetWidth,
    height: domNode.offsetHeight,
  }
}

export function getOffset(domNode: HTMLElement, isBoxModel: boolean = null): Offset {

  const body = document.body,
    win = document.defaultView,
    docElem = document.documentElement,
    boxModel = isBoxModel === null ? getIsBoxModel() : isBoxModel;

  let boundingClientRect = domNode.getBoundingClientRect();

  const clientTop = docElem.clientTop || body.clientTop || 0;
  const clientLeft = docElem.clientLeft || body.clientLeft || 0;
  const scrollTop = win.pageYOffset || boxModel && docElem.scrollTop || body.scrollTop;
  const scrollLeft = win.pageXOffset || boxModel && docElem.scrollLeft || body.scrollLeft;

  return {
    top: boundingClientRect.top + scrollTop - clientTop,
    left: boundingClientRect.left + scrollLeft - clientLeft
  };
}

export function getIsBoxModel(): boolean {

  const body = document.body;
  const box = document.createElement('div');

  box.style.paddingLeft = box.style.width = '1px';
  body.appendChild(box);
  const isBoxModel = box.offsetWidth == 2;
  body.removeChild(box);

  return isBoxModel;
}

export function classListAdd(el: HTMLElement, classNames: string[]): void {
  for (const className of classNames) {
    el.classList.add(className);
  }
}

export function classListRemove(el: HTMLElement, classNames: string[]): void {
  for (const className of classNames) {
    el.classList.remove(className);
  }
}


export function getScrollingElement(): HTMLElement {

  return document.scrollingElement as HTMLElement;
}


export function getBodyScrollTop(): number {
  return document.scrollingElement.scrollTop;
}

export function setBodyScrollTop(value: number): void {
  window.scrollTo(0, value);
}


export function requestFullscreen(el: HTMLElement) {

  const element: any = <any>el;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    (document as any).mozCancelFullScreen();
  } else if ((document as any).msExitFullscreen) {
    (document as any).msExitFullscreen();
  }
}

export function onFullscreenChange(callback: (ev: any) => any): () => any {

  document.addEventListener('fullscreenchange', callback, false);
  document.addEventListener('webkitfullscreenchange', callback, false);
  document.addEventListener('mozfullscreenchange', callback, false);
  document.addEventListener('MSFullscreenChange', callback, false);

  return () => {

    document.removeEventListener('fullscreenchange', callback, false);
    document.removeEventListener('webkitfullscreenchange', callback, false);
    document.removeEventListener('mozfullscreenchange', callback, false);
    document.removeEventListener('MSFullscreenChange', callback, false);
  }
}

export function getCaretPosition(input: HTMLInputElement | HTMLTextAreaElement): number {

  let pos;

  if (document['selection'] && document['selection'].createRange) {
    const range = document['selection'].createRange();
    const bookmark = range.getBookmark();
    pos = bookmark.charCodeAt(2) - 2;
  } else if (input.setSelectionRange) {
    pos = input.selectionStart;
  }

  return pos;
}

export function setCaretPosition(el: HTMLInputElement | HTMLTextAreaElement, pos: number): void {

  if (el['createTextRange']) { // webpack warnings
    const range = el['createTextRange']();
    range.move('character', pos);
    range.select();
  } else {
    if (el.selectionStart) {
      el.focus();
      el.setSelectionRange(pos, pos);
    }
    else {
      el.focus();
    }
  }
}

export function attachBodyClick(elsIgnore: HTMLElement[], callback: () => any) {

  requestAnimationFrame(() => {

    document.body.addEventListener('click', function onClick(e: MouseEvent) {

      let target = <HTMLElement>e.target;
      let remove = true;

      while (target && target !== document.body) {

        for (let el of elsIgnore) {
          if (target === el) {
            remove = false;
            break;
          }
        }

        target = <HTMLElement>target.parentNode;

        if (!target) {
          remove = true;
          //remove = false;
        }
      }

      if (remove) {
        document.body.removeEventListener('click', onClick, false);
        callback();
      }
    });
  });
}


export function isPortrait(): boolean {
  return window.matchMedia('(orientation: portrait)').matches;
}


export function isLandscape(): boolean {
  return window.matchMedia('(orientation: landscape)').matches;
}


export let loadScript = function () {

  let loaded = {};

  return function (src: string): Promise<any> {

    return new Promise((resolve, reject) => {

      if (loaded.hasOwnProperty(src)) {
        resolve();
        return;
      }

      const el = document.createElement('script');
      el.async = true;
      el.src = src;

      el.addEventListener('load', () => {
        loaded[src] = 1;
        resolve();
      }, false);

      document.head.appendChild(el);
    });
  }
}();

let debugEl;

export function debug1(text: string, slot: number = 0) {

  if (!debugEl) {

    debugEl = document.createElement('div');

    debugEl.style.position = 'fixed';
    debugEl.style.bottom = '0';
    debugEl.style.height = '80px';
    debugEl.style.backgroundColor = 'black';
    debugEl.style.width = '100%';
    debugEl.style.color = 'white';
    debugEl.style.padding = '10px';
    debugEl.style.zIndex = '999';

    debugEl.innerHTML = `
      <ul style="list-style-type:none;margin:0;padding:0;">
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
      </ul>
      <button style="position: absolute; top: 0; right: 20px; background: none; color: white;">×</button>
`;

    debugEl.children[1].addEventListener('click', () => {
      document.body.removeChild(debugEl);
      debugEl = null;
    });

    document.body.appendChild(debugEl);
  }

  debugEl.firstElementChild.children[slot].innerHTML = text;
}
