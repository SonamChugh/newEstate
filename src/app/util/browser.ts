export default class Browser {

  static cache = {};

  private static get userAgent(): string {

    if (!Browser.cache['userAgent']) {
      Browser.cache['userAgent'] = navigator.userAgent.toLowerCase();
    }

    return Browser.cache['userAgent'];
  }

  static isFirefox(): boolean {
    return typeof window['InstallTrigger'] !== 'undefined';
  }

  static isChrome(): boolean {
    return !!window['chrome'] && !window['isOpera'];
  }

  static isAndroid(): boolean {
    return Browser.userAgent.match(/android/i) !== null;
  }

  static isIos(): boolean {
    return Browser.isMac() || Browser.isIosTouch();
  }

  static isMac(): boolean {
    return Browser.userAgent.search('mac') > -1;
  }

  static isIosTouch(): boolean {
    return Browser.isIphone() || Browser.isIpad();
  }

  static isWindowsPhone(): boolean {
    return Browser.userAgent.match(/windows phone/i) !== null;
  }

  static isWindowsTablet(): boolean {
    return navigator.platform.toLowerCase().indexOf('win') !== -1 && Browser.userAgent.indexOf('touch') !== -1;
  }

  static isWindowsTouch(): boolean {
    return Browser.isWindowsPhone() || Browser.isWindowsTablet();
  }

  static isTouch(): boolean {
    return Browser.isAndroid() || Browser.isIosTouch() || Browser.isWindowsPhone();
  }

  static isIpad(): boolean {
    const userAgent = Browser.userAgent;
    return userAgent.search('ipad') > -1;
  }

  static isIphone(): boolean {
    const userAgent = Browser.userAgent;
    return userAgent.search('iphone') > -1;
  }

  static isAndroidMobile(): boolean {
    const userAgent = Browser.userAgent;
    return userAgent.search('android') > -1 && userAgent.search('mobile') > -1;
  }

  static isAndroidTablet(): boolean {
    const userAgent = Browser.userAgent;
    return userAgent.search('android') > -1 && userAgent.search('mobile') === -1;
  }

  static isTablet(): boolean {
    return Browser.isAndroidTablet() || Browser.isIpad() || Browser.isWindowsTablet();
  }

  static isMobile(): boolean {
    return Browser.isAndroidMobile() || Browser.isIphone() || Browser.isWindowsPhone();
  }

  static getFormFactorDeprecated(): 'phone' | 'tablet' | 'computer' {

    if (Browser.isMobile()) {
      return 'phone';
    } else if (Browser.isTablet()) {
      return 'tablet';
    } else {
      return 'computer';
    }
  }

  static getFormFactor(): 'mobile' | 'tablet' | 'desktop' {

    if (Browser.isMobile()) {
      return 'mobile';
    } else if (Browser.isTablet()) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}
