/**
 * Server-side routes. Only the listed routes support html5pushstate.
 * Has to match client side routes.
 *
 * Index (/) route does not have to be listed here.
 *
 * @example
 * export const routes: string[] = [
 * 'home', 'about'
 * ];
 **/
export const routes: string[] = [
  '',
  'search',
  'filters',
  'reference',
  'auth/login',
  'auth/login/facebook',
  'auth/logout',
  'auth/register',
  'validated',
  'notvalidated',
  'resetpassword',
  'unsubscribe',
  'legal',
  'owners',
  'careers',
  'thanks',
  'about',
  '404',
];
