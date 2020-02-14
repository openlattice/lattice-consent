/*
 * @flow
 */

import { connectRouter } from 'connected-react-router/immutable';
import { AuthReducer } from 'lattice-auth';
import { combineReducers } from 'redux-immutable';

import { AppReducer } from '../../containers/app';
import { ConsentReducer } from '../../containers/consent';
import { EDMReducer } from '../edm';

export default function reduxReducer(routerHistory :any) {

  return combineReducers({
    app: AppReducer,
    auth: AuthReducer,
    consent: ConsentReducer,
    edm: EDMReducer,
    router: connectRouter(routerHistory),
  });
}
