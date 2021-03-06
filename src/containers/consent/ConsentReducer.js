/*
 * @flow
 */

import { LOCATION_CHANGE } from 'connected-react-router';
import { Map, fromJS } from 'immutable';
import { ReduxConstants } from 'lattice-utils';
import { RequestStates } from 'redux-reqseq';
import type { SequenceAction } from 'redux-reqseq';

import {
  CLEAR_CONSENT_DATA,
  CONSENT_INITIALIZER,
  GET_CONSENT_FORM_SCHEMA,
  SUBMIT_CONSENT,
  consentInitializer,
  getConsentFormSchema,
  submitConsent,
} from './ConsentActions';

const { REQUEST_STATE } = ReduxConstants;

const INITIAL_STATE :Map<*, *> = fromJS({
  [GET_CONSENT_FORM_SCHEMA]: { [REQUEST_STATE]: RequestStates.STANDBY },
  [SUBMIT_CONSENT]: { [REQUEST_STATE]: RequestStates.STANDBY },
  clientEntityKeyId: undefined,
  channelId: undefined,
  schema: undefined,
  schemaEntityKeyId: undefined,
  staffEntityKeyId: undefined,
});

export default function reducer(state :Map<*, *> = INITIAL_STATE, action :Object) {

  switch (action.type) {

    case CLEAR_CONSENT_DATA:
    case LOCATION_CHANGE: {
      return INITIAL_STATE;
    }

    case consentInitializer.case(action.type): {
      const seqAction :SequenceAction = action;
      return consentInitializer.reducer(state, action, {
        REQUEST: () => state
          .setIn([CONSENT_INITIALIZER, REQUEST_STATE], RequestStates.PENDING)
          .setIn([CONSENT_INITIALIZER, seqAction.id], seqAction),
        SUCCESS: () => {
          const storedSeqAction :SequenceAction = state.getIn([CONSENT_INITIALIZER, seqAction.id]);
          if (storedSeqAction) {
            const { channelId, entityKeyIds } = seqAction.value;
            return state
              .set('channelId', channelId)
              .set('clientEntityKeyId', entityKeyIds.clientEntityKeyId)
              .set('schemaEntityKeyId', entityKeyIds.schemaEntityKeyId)
              .set('staffEntityKeyId', entityKeyIds.staffEntityKeyId)
              .setIn([CONSENT_INITIALIZER, REQUEST_STATE], RequestStates.SUCCESS);
          }
          return state;
        },
        FAILURE: () => state
          .set('clientEntityKeyId', undefined)
          .set('schemaEntityKeyId', undefined)
          .set('staffEntityKeyId', undefined)
          .setIn([CONSENT_INITIALIZER, REQUEST_STATE], RequestStates.FAILURE),
        FINALLY: () => state.deleteIn([CONSENT_INITIALIZER, seqAction.id]),
      });
    }

    case getConsentFormSchema.case(action.type): {
      const seqAction :SequenceAction = action;
      return getConsentFormSchema.reducer(state, action, {
        REQUEST: () => state
          .setIn([GET_CONSENT_FORM_SCHEMA, REQUEST_STATE], RequestStates.PENDING)
          .setIn([GET_CONSENT_FORM_SCHEMA, seqAction.id], seqAction),
        SUCCESS: () => {
          const storedSeqAction :SequenceAction = state.getIn([GET_CONSENT_FORM_SCHEMA, seqAction.id]);
          if (storedSeqAction) {
            return state
              .set('schema', seqAction.value)
              .setIn([GET_CONSENT_FORM_SCHEMA, REQUEST_STATE], RequestStates.SUCCESS);
          }
          return state;
        },
        FAILURE: () => state
          .set('schema', undefined)
          .setIn([GET_CONSENT_FORM_SCHEMA, REQUEST_STATE], RequestStates.FAILURE),
        FINALLY: () => state.deleteIn([GET_CONSENT_FORM_SCHEMA, seqAction.id]),
      });
    }

    case submitConsent.case(action.type): {
      const seqAction :SequenceAction = action;
      return submitConsent.reducer(state, seqAction, {
        REQUEST: () => state.setIn([SUBMIT_CONSENT, REQUEST_STATE], RequestStates.PENDING),
        SUCCESS: () => state.setIn([SUBMIT_CONSENT, REQUEST_STATE], RequestStates.SUCCESS),
        FAILURE: () => state.setIn([SUBMIT_CONSENT, REQUEST_STATE], RequestStates.FAILURE),
      });
    }

    default:
      return state;
  }
}
