export function envToBoolean(value: string, _default: boolean): boolean {
  return value === '1' || value === 'true' || _default;
}

export const environment = {
  production: true,
  hmr: false,
  baseImageUrl: '${BASE_IMAGE_URL}' || '/img',
  baseApiUrl: '${BASE_API_URL}',
  facebookAppId: '${FACEBOOK_APP_ID}',
  facebookAuthRedirectUrl: '${FACEBOOK_AUTH_REDIRECT_URL}',
  googleClientId: '${GOOGLE_CLIENT_ID}',
  googleAuthRedirectUrl: '${GOOGLE_AUTH_REDIRECT_URL}',
  googleMapApiKey: '${GOOGLE_MAP_API_KEY}',
  googleConversionId: Number('${GOOGLE_CONVERSION_ID}'),
  googleAnalyticsKey: '${GOOGLE_ANALYTICS_KEY}',
  debugAnalyticsEvents: envToBoolean('${DEBUG_ANALYTICS_EVENTS}', false),
  vapidPublicKey: '${VAPID_PUBLIC_KEY}'
};
