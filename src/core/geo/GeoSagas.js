/*
 * @flow
 */

import { call, put, takeEvery } from '@redux-saga/core/effects';
import type { SequenceAction } from 'redux-reqseq';

import GeoErrors from './GeoErrors';
import { GET_GEO_LOCATION, getGeoLocation } from './GeoActions';
import { getCurrentPositionPromise } from './GeoUtils';

import Logger from '../../utils/Logger';

const LOG = new Logger('GeoSagas');

/*
 *
 * GeoActions.getGeoLocation()
 *
 */

function* getGeoLocationWorker(action :SequenceAction) :Generator<*, *, *> {

  try {
    yield put(getGeoLocation.request(action.id));
    const position :Position = yield call(getCurrentPositionPromise);
    yield put(getGeoLocation.success(action.id, position));
  }
  catch (error) {
    LOG.error(action.type, error);
    let errorMessage :string = error.message;
    if (errorMessage.toLowerCase().includes('denied')) {
      errorMessage = GeoErrors.PERMISSION_DENIED;
    }
    yield put(getGeoLocation.failure(action.id, errorMessage));
  }
  finally {
    yield put(getGeoLocation.finally(action.id));
  }
}

function* getGeoLocationWatcher() :Generator<*, *, *> {

  yield takeEvery(GET_GEO_LOCATION, getGeoLocationWorker);
}

export {
  getGeoLocationWatcher,
  getGeoLocationWorker,
};
