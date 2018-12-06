export function databaseToBoolean(value: any): boolean | null {
  return value ? value === '1' : null;
}

export function databaseToNumber(value: any): number | null {
  return value === null || value === undefined ? value : Number(value);
}

export function booleanToDatabase(value: boolean | null | undefined): any {
  return value === null || value === undefined ? null : value ? '1' : '0';
}
