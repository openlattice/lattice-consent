/*
 * @flow
 */

type GeoErrorEnum = {|
  NOT_SUPPORTED :'NOT_SUPPORTED';
  PERMISSION_DENIED :'PERMISSION_DENIED';
  POSITION_UNAVAILABLE :'POSITION_UNAVAILABLE';
  TIMEOUT :'TIMEOUT';
|};
type GeoError = $Values<GeoErrorEnum>;

// TODO: look into using Immutable.Map() or other possible "enum" libraries
const GeoErrors :GeoErrorEnum = Object.freeze({
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
});

export default GeoErrors;
export type {
  GeoError,
  GeoErrorEnum,
};
