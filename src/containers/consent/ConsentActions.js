/*
 * @flow
 */

import { newRequestSequence } from 'redux-reqseq';
import type { RequestSequence } from 'redux-reqseq';

const CLEAR_CONSENT_DATA :'CLEAR_CONSENT_DATA' = 'CLEAR_CONSENT_DATA';
const clearConsentData = () => ({ type: CLEAR_CONSENT_DATA });

const CONSENT_INITIALIZER :'CONSENT_INITIALIZER' = 'CONSENT_INITIALIZER';
const consentInitializer :RequestSequence = newRequestSequence(CONSENT_INITIALIZER);

const GET_CONSENT_FORM_SCHEMA :'GET_CONSENT_FORM_SCHEMA' = 'GET_CONSENT_FORM_SCHEMA';
const getConsentFormSchema :RequestSequence = newRequestSequence(GET_CONSENT_FORM_SCHEMA);

const SUBMIT_CONSENT :'SUBMIT_CONSENT' = 'SUBMIT_CONSENT';
const submitConsent :RequestSequence = newRequestSequence(SUBMIT_CONSENT);

export {
  CLEAR_CONSENT_DATA,
  CONSENT_INITIALIZER,
  GET_CONSENT_FORM_SCHEMA,
  SUBMIT_CONSENT,
  clearConsentData,
  consentInitializer,
  getConsentFormSchema,
  submitConsent,
};
