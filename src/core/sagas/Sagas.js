/*
 * @flow
 */

import { all, fork } from '@redux-saga/core/effects';
import { AuthSagas } from 'lattice-auth';
import { DataApiSagas } from 'lattice-sagas';

import { AppSagas } from '../../containers/app';
import { ConsentSagas } from '../../containers/consent';
import { EDMSagas } from '../edm';
import { GeoSagas } from '../geo';
import { RoutingSagas } from '../router';

export default function* sagas() :Generator<*, *, *> {

  yield all([
    // "lattice-auth" sagas
    fork(AuthSagas.watchAuthAttempt),
    fork(AuthSagas.watchAuthSuccess),
    fork(AuthSagas.watchAuthFailure),
    fork(AuthSagas.watchAuthExpired),
    fork(AuthSagas.watchLogout),

    // "lattice-sagas" sagas
    fork(DataApiSagas.getEntityDataWatcher),

    // AppSagas
    fork(AppSagas.initializeApplicationWatcher),

    // EDMSagas
    fork(EDMSagas.getEntityDataModelTypesWatcher),

    // RoutingSagas
    fork(RoutingSagas.goToRootWatcher),
    fork(RoutingSagas.goToRouteWatcher),

    // GeoSagas
    fork(GeoSagas.getGeoLocationWatcher),

    // ConsentSagas
    fork(ConsentSagas.consentInitializerWatcher),
    fork(ConsentSagas.getConsentFormSchemaWatcher),
    fork(ConsentSagas.submitConsentWatcher),
  ]);
}
