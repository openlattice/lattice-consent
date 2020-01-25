/*
 * @flow
 */

import { DateTime } from 'luxon';

function formatAsDate(value :string = '') :string {

  const date = DateTime.fromISO(value);
  if (date.isValid) {
    return date.toLocaleString(DateTime.DATE_SHORT);
  }

  return '';
}

export {
  formatAsDate,
};
