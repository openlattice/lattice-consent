/*
 * @flow
 */

import { Map, fromJS } from 'immutable';
import { RequestStates } from 'redux-reqseq';
import type { SequenceAction } from 'redux-reqseq';

import {
  GET_GEO_LOCATION,
  RESET_GEO_STATE,
  getGeoLocation,
} from './GeoActions';

const INITIAL_STATE :Map<*, *> = fromJS({
  [GET_GEO_LOCATION]: { error: false, requestState: RequestStates.STANDBY },
  geolocation: undefined,
});

export default function reducer(state :Map<*, *> = INITIAL_STATE, action :Object) {

  switch (action.type) {

    case RESET_GEO_STATE: {
      return INITIAL_STATE;
    }

    case getGeoLocation.case(action.type): {
      return getGeoLocation.reducer(state, action, {
        REQUEST: () => {
          const seqAction :SequenceAction = action;
          return state
            .setIn([GET_GEO_LOCATION, 'requestState'], RequestStates.PENDING)
            .setIn([GET_GEO_LOCATION, seqAction.id], seqAction);
        },
        SUCCESS: () => {

          const seqAction :SequenceAction = action;
          const storedSeqAction :SequenceAction = state.getIn([GET_GEO_LOCATION, seqAction.id]);
          if (!storedSeqAction) {
            return state;
          }

          return state
            .set('geolocation', seqAction.value)
            .setIn([GET_GEO_LOCATION, 'error'], false)
            .setIn([GET_GEO_LOCATION, 'requestState'], RequestStates.SUCCESS);
        },
        FAILURE: () => {

          const seqAction :SequenceAction = action;
          const storedSeqAction :SequenceAction = state.getIn([GET_GEO_LOCATION, seqAction.id]);
          if (!storedSeqAction) {
            return state;
          }

          const error = {
            message: seqAction.value,
          };

          return state
            .set('geolocation', undefined)
            .setIn([GET_GEO_LOCATION, 'error'], fromJS(error))
            .setIn([GET_GEO_LOCATION, 'requestState'], RequestStates.FAILURE);
        },
        FINALLY: () => {
          const seqAction :SequenceAction = action;
          return state.deleteIn([GET_GEO_LOCATION, seqAction.id]);
        },
      });
    }

    default:
      return state;
  }
}
