/*
 * @flow
 */

import { Models } from 'lattice';

const { FQN } = Models;

const ASSOCIATION_ENTITY_TYPE_FQNS = {};
const ENTITY_TYPE_FQNS = {};

const PROPERTY_TYPE_FQNS = {
  GEN_FULL_NAME_FQN: FQN.of('general.fullname'),
  LOCATION_LATITUDE_FQN: FQN.of('location.latitude'),
  LOCATION_LONGITUDE_FQN: FQN.of('location.longitude'),
  OL_ALGORITHM_NAME_FQN: FQN.of('ol.algorithmname'),
  OL_CRYPTO_KEY_FQN: FQN.of('ol.cryptokey'),
  OL_DATE_TIME_FQN: FQN.of('ol.datetime'),
  OL_DESCRIPTION_FQN: FQN.of('ol.description'),
  OL_ELLIPTIC_CURVE_NAME_FQN: FQN.of('ol.ellipticcurvename'),
  OL_HASH_FUNCTION_NAME_FQN: FQN.of('ol.hashfunctionname'),
  OL_ID_FQN: FQN.of('ol.id'),
  OL_NAME_FQN: FQN.of('ol.name'),
  OL_ROLE_FQN: FQN.of('ol.role'),
  OL_SCHEMA_FQN: FQN.of('ol.schema'),
  OL_SIGNATURE_DATA_FQN: FQN.of('ol.signaturedata'),
  OL_TEXT_FQN: FQN.of('ol.text'),
  OL_TYPE_FQN: FQN.of('ol.type'),
  OL_VERSION_FQN: FQN.of('ol.version'),
};

export {
  ASSOCIATION_ENTITY_TYPE_FQNS,
  ENTITY_TYPE_FQNS,
  PROPERTY_TYPE_FQNS,
};
