/*
 * @flow
 */

import { Models } from 'lattice';

const { FullyQualifiedName } = Models;

const ASSOCIATION_ENTITY_TYPE_FQNS = {};
const ENTITY_TYPE_FQNS = {};

const PROPERTY_TYPE_FQNS = {
  GEN_FULL_NAME_FQN: new FullyQualifiedName('general.fullname'),
  LOCATION_LATITUDE_FQN: new FullyQualifiedName('location.latitude'),
  LOCATION_LONGITUDE_FQN: new FullyQualifiedName('location.longitude'),
  OL_ALGORITHM_NAME_FQN: new FullyQualifiedName('ol.algorithmname'),
  OL_CRYPTO_KEY_FQN: new FullyQualifiedName('ol.cryptokey'),
  OL_DATE_TIME_FQN: new FullyQualifiedName('ol.datetime'),
  OL_DESCRIPTION_FQN: new FullyQualifiedName('ol.description'),
  OL_ELLIPTIC_CURVE_NAME_FQN: new FullyQualifiedName('ol.ellipticcurvename'),
  OL_HASH_FUNCTION_NAME_FQN: new FullyQualifiedName('ol.hashfunctionname'),
  OL_ID_FQN: new FullyQualifiedName('ol.id'),
  OL_NAME_FQN: new FullyQualifiedName('ol.name'),
  OL_ROLE_FQN: new FullyQualifiedName('ol.role'),
  OL_SCHEMA_FQN: new FullyQualifiedName('ol.schema'),
  OL_SIGNATURE_DATA_FQN: new FullyQualifiedName('ol.signaturedata'),
  OL_TEXT_FQN: new FullyQualifiedName('ol.text'),
  OL_TYPE_FQN: new FullyQualifiedName('ol.type'),
  OL_VERSION_FQN: new FullyQualifiedName('ol.version'),
};

export {
  ASSOCIATION_ENTITY_TYPE_FQNS,
  ENTITY_TYPE_FQNS,
  PROPERTY_TYPE_FQNS,
};
