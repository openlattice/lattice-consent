/*
 * @flow
 */

import { newRequestSequence } from 'redux-reqseq';

const GET_GEO_LOCATION :'GET_GEO_LOCATION' = 'GET_GEO_LOCATION';
const getGeoLocation = newRequestSequence(GET_GEO_LOCATION);

const RESET_GEO_STATE :'RESET_GEO_STATE' = 'RESET_GEO_STATE';
const resetGeoState = () => ({ type: RESET_GEO_STATE });

export {
  GET_GEO_LOCATION,
  RESET_GEO_STATE,
  getGeoLocation,
  resetGeoState,
};
