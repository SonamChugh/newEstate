import { Listing } from './listing/listing';


export interface EventDesc {
  category: string;
  action: string;
  value: number;
}


export const gaEvents: { [key: string]: EventDesc } = {
  mobileTopMenuRequest: {
    category: 'Top Menu Request',
    action: 'click',
    value: 1
  },
  mobileTopMenuShowMap: {
    category: 'Top Menu Map',
    action: 'click',
    value: 1
  },
  mobileTopMenuDetails: {
    category: 'Top Menu Details',
    action: 'click',
    value: 1
  },
  similarListings: {
    category: 'Similar Listings',
    action: 'click',
    value: 3
  },
  showPhotos: {
    category: 'Similar Photos',
    action: 'click',
    value: 1
  },
  tapPhoto: {
    category: 'Tap Photo',
    action: 'click',
    value: 1
  },
  showMap: {
    category: 'Show Map',
    action: 'click',
    value: 2
  },
  showDescription: {
    category: 'Show Description',
    action: 'click',
    value: 1
  },
  addFavorites: {
    category: 'Add Favorites',
    action: 'click',
    value: 10
  },
  logo: {
    category: 'Logo WE',
    action: 'click',
    value: 0,
  },
  changeLang: {
    category: 'Change Lang',
    action: 'select',
    value: 1,
  },
  account: {
    category: 'Account',
    action: 'click',
    value: 5
  },
  login: {
    category: 'Login',
    action: 'click',
    value: 5,
  },
  register: {
    category: 'Register',
    action: 'click',
    value: 10,
  },
  email: {
    category: 'Email',
    action: 'entry',
    value: 20,
  },
  password: {
    category: 'Password',
    action: 'entry',
    value: 10,
  },
  loginFb: {
    category: 'Login FB',
    action: 'click',
    value: 20,
  },
  loginGoogle: {
    category: 'Login Google',
    action: 'click',
    value: 20,
  },
  mainSearch: {
    category: 'Main Search',
    action: 'select',
    value: 5,
  },
  iconRequest: {
    category: 'Icon Request',
    action: 'click',
    value: 5,
  },
  requestName: {
    category: 'Request Name',
    action: 'entry',
    value: 5,
  },
  requestPhone: {
    category: 'Request Phone',
    action: 'entry',
    value: 20,
  },
  chooseReference: {
    category: 'Choose Reference',
    action: 'click',
    value: 5,
  },
};


export function getGaListingLabel(listing: Listing): string {
  return `${listing.cityNameEn} - ${listing.totpr} - ${listing.surface} - ${listing.ref}`;
}


export function getGaPageByRoute(url: string): string {
  return decodeURIComponent(url);
}
