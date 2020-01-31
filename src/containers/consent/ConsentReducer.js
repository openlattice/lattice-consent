/*
 * @flow
 */

import { LOCATION_CHANGE } from 'connected-react-router';
import { Map, fromJS } from 'immutable';
import { RequestStates } from 'redux-reqseq';
import type { SequenceAction } from 'redux-reqseq';

import { CLEAR_CONSENT_DATA, GET_CONSENT_FORM_SCHEMA, getConsentFormSchema } from './ConsentActions';

const INITIAL_STATE :Map<*, *> = fromJS({
  [GET_CONSENT_FORM_SCHEMA]: { requestState: RequestStates.STANDBY },
  // data: Map(),
  schema: Map(),
});

export default function reducer(state :Map<*, *> = INITIAL_STATE, action :Object) {

  switch (action.type) {

    case CLEAR_CONSENT_DATA:
    case LOCATION_CHANGE: {
      return INITIAL_STATE;
    }

    case getConsentFormSchema.case(action.type): {
      const seqAction :SequenceAction = action;
      return getConsentFormSchema.reducer(state, action, {
        REQUEST: () => state
          .setIn([GET_CONSENT_FORM_SCHEMA, 'requestState'], RequestStates.PENDING)
          .setIn([GET_CONSENT_FORM_SCHEMA, seqAction.id], seqAction),
        SUCCESS: () => {
          const storedSeqAction :SequenceAction = state.getIn([GET_CONSENT_FORM_SCHEMA, seqAction.id]);
          if (storedSeqAction) {
            return state
              .set('schema', seqAction.value)
              .setIn([GET_CONSENT_FORM_SCHEMA, 'requestState'], RequestStates.SUCCESS);
          }
          return state;
        },
        FAILURE: () => state
          .set('schema', Map())
          .setIn([GET_CONSENT_FORM_SCHEMA, 'requestState'], RequestStates.FAILURE),
        FINALLY: () => state.deleteIn([GET_CONSENT_FORM_SCHEMA, seqAction.id]),
      });
    }

    default:
      return state;
  }
}
