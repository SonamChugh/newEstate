import { writeFileSync, existsSync } from 'fs';
import * as decamelize from 'decamelize';

const envModule = require('./src/environments/environment.prod-sample.ts');

function envToBoolean(value: string): boolean {
  return value === '1' || value === 'true';
}

function envToNumber(value: string): number {
  return Number(value);
}

process.stdout.write('writing environment file.. ');

const res: any = {};

for (let key in envModule.environment) {

  const defaultValue = envModule.environment[key];
  const type = typeof defaultValue;
  const envKey = decamelize(key, '_').toUpperCase();
  const envValue = (process.env[envKey] || '').trim();

  if (envValue !== '') {

    switch (type) {
      case 'boolean':
        res[key] = envToBoolean(envValue);
        break;
      case 'number':
        res[key] = envToNumber(envValue);
        break;
      default:
        res[key] = envValue;
    }
  } else {

    res[key] = defaultValue;
  }
}

const content = `export const environment = ${JSON.stringify(res, null, 4)};`;

const dest = './src/environments/environment.prod.ts';

if (!existsSync(dest)) {
  writeFileSync(dest, content, {encoding: 'utf-8'});
  process.stdout.write('success\n');
} else {
  process.stdout.write('destination file already exists\n');
}
