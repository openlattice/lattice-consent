/*
 * @flow
 */

import isArray from 'lodash/isArray';
import {
  List,
  Map,
  fromJS,
  get,
  hasIn,
  isCollection,
  remove,
  setIn,
} from 'immutable';
import { Logger } from 'lattice-utils';
import { DateTime } from 'luxon';

import {
  CLIENT_PSK,
  CLIENT_SIGNATURE_DATE_EAK,
  CONSENT_FORM_PSK,
  CONSENT_FORM_SCHEMA_EAK,
  LOCATION_LATITUDE_EAK,
  LOCATION_LONGITUDE_EAK,
  LOCATION_PSK,
  STAFF_PSK,
  STAFF_SIGNATURE_DATE_EAK,
  WITNESS_PSK,
} from './ConsentSchema';

const LOG = new Logger('ConsentUtils');

const signatureValueMapper = (value :any) => ({
  data: value,
  // NOTE: a temporary fix for binary submissions. we should figure out a way to avoid hardcoding the Content-Type
  'content-type': 'image/png',
});

function isStaffSignatureRequired(schema :Object) :boolean {

  // TODO: we need better schema validation
  if (hasIn(schema, ['dataSchema', 0, 'properties'], false)) {
    return hasIn(schema, ['dataSchema', 0, 'properties', STAFF_PSK], false);
  }

  const errorMessage = 'invalid parameter: "schema" has an unexpected structure';
  LOG.error(errorMessage, schema);
  throw new Error(errorMessage);
}

function isWitnessSignatureRequired(schema :Object) :boolean {

  // TODO: we need better schema validation
  if (hasIn(schema, ['dataSchema', 0, 'properties'], false)) {
    return hasIn(schema, ['dataSchema', 0, 'properties', WITNESS_PSK], false);
  }

  const errorMessage = 'invalid parameter: "schema" has an unexpected structure';
  LOG.error(errorMessage, schema);
  throw new Error(errorMessage);
}

function countAdditionalWitnesses(data :Object | Map) :number {

  let additionalWitnessesCount :number = 0;
  const additionalWitnessesData :List | Object[] = get(data, WITNESS_PSK, List());

  if (isArray(additionalWitnessesData)) {
    additionalWitnessesCount = additionalWitnessesData.length;
  }
  else if (isCollection(additionalWitnessesData)) {
    additionalWitnessesCount = additionalWitnessesData.count();
  }
  else {
    const errorMessage = 'unable to count additional witnesses';
    LOG.error(errorMessage, data);
    throw new Error(errorMessage);
  }

  return additionalWitnessesCount;
}

function initializeDataWithGeo(data :Object | Map, geolocation :Position) :Map {

  let newData = fromJS(data);
  newData = setIn(newData, [LOCATION_PSK, LOCATION_LATITUDE_EAK], geolocation.coords.latitude);
  newData = setIn(newData, [LOCATION_PSK, LOCATION_LONGITUDE_EAK], geolocation.coords.longitude);
  return newData;
}

function initializeDataWithSchema(data :Object | Map, schema :Object) :Map {

  // toISO() caused an infinite render loop due to the millisecond granularity of toISO(). the fix was to refactor
  // the useSelector() and useEffect() logic, but using toISODate() is an extra defensive step. furthermore, it's ok
  // to use toISODate() here all dates will be overwritten at the time of submission in the saga.
  const nowAsISODate = DateTime.local().toISODate();

  let newData = fromJS(data);
  newData = setIn(newData, [CONSENT_FORM_PSK, CONSENT_FORM_SCHEMA_EAK], JSON.stringify(schema));
  newData = setIn(newData, [CLIENT_PSK, CLIENT_SIGNATURE_DATE_EAK], nowAsISODate);

  if (isStaffSignatureRequired(schema)) {
    newData = setIn(newData, [STAFF_PSK, STAFF_SIGNATURE_DATE_EAK], nowAsISODate);
  }
  else {
    newData = remove(newData, STAFF_PSK);
  }

  if (isWitnessSignatureRequired(schema)) {
    newData = setIn(newData, [WITNESS_PSK], List());
  }
  else {
    newData = remove(newData, WITNESS_PSK);
  }

  return newData;
}

export {
  countAdditionalWitnesses,
  initializeDataWithGeo,
  initializeDataWithSchema,
  isStaffSignatureRequired,
  isWitnessSignatureRequired,
  signatureValueMapper,
};
