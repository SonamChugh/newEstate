import {
  flatten,
  validatePhoneNumber
} from './util';


describe('util', () => {

  it('should flatten arrays', () => {

    const testArr: string[][] = [
      ['1', '2'],
      ['3', '4'],
      ['5'],
    ];

    expect(flatten(testArr)).toEqual(['1', '2', '3', '4', '5']);
  });


  it('should validate phone number', () => {

    expect(validatePhoneNumber('+7 912 34 56')).toBe(true);
    expect(validatePhoneNumber('+19123456')).toBe(true);
    expect(validatePhoneNumber('+1-912-3456')).toBe(true);
    expect(validatePhoneNumber('+1_912_3456')).toBe(false);
    expect(validatePhoneNumber('+1a9123456')).toBe(false);
    expect(validatePhoneNumber('34 912 3456 91')).toBe(true);
    expect(validatePhoneNumber('34  912  3456 - 91')).toBe(true);
  });

});
