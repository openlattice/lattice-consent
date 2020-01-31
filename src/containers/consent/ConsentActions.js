/*
 * @flow
 */

import { newRequestSequence } from 'redux-reqseq';
import type { RequestSequence } from 'redux-reqseq';

const CLEAR_CONSENT_DATA :'CLEAR_CONSENT_DATA' = 'CLEAR_CONSENT_DATA';
const clearConsentData = () => ({ type: CLEAR_CONSENT_DATA });

const GET_CONSENT_FORM_SCHEMA :'GET_CONSENT_FORM_SCHEMA' = 'GET_CONSENT_FORM_SCHEMA';
const getConsentFormSchema :RequestSequence = newRequestSequence(GET_CONSENT_FORM_SCHEMA);

const SUBMIT_CONSENT :'SUBMIT_CONSENT' = 'SUBMIT_CONSENT';
const submitConsent :RequestSequence = newRequestSequence(SUBMIT_CONSENT);

export {
  CLEAR_CONSENT_DATA,
  GET_CONSENT_FORM_SCHEMA,
  SUBMIT_CONSENT,
  clearConsentData,
  getConsentFormSchema,
  submitConsent,
};
