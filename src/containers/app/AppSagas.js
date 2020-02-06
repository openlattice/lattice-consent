/*
 * @flow
 */

import {
  all,
  call,
  put,
  takeEvery,
} from '@redux-saga/core/effects';
import type { SequenceAction } from 'redux-reqseq';

import { INITIALIZE_APPLICATION, initializeApplication } from './AppActions';

import Logger from '../../utils/Logger';
import { EDMActions, EDMSagas } from '../../core/edm';
import { ConsentActions, ConsentSagas } from '../consent';

const LOG = new Logger('AppSagas');

const { getEntityDataModelTypes } = EDMActions;
const { getEntityDataModelTypesWorker } = EDMSagas;
const { consentInitializer } = ConsentActions;
const { consentInitializerWorker } = ConsentSagas;

/*
 *
 * AppActions.initializeApplication()
 *
 */

function* initializeApplicationWorker(action :SequenceAction) :Generator<*, *, *> {

  try {
    yield put(initializeApplication.request(action.id));
    const responses :Object[] = yield all([
      call(getEntityDataModelTypesWorker, getEntityDataModelTypes()),
      call(consentInitializerWorker, consentInitializer()),
      // ...any other required requests
    ]);
    if (responses[0].error) throw responses[0].error;
    if (responses[1].error) throw responses[1].error;
    yield put(initializeApplication.success(action.id));
  }
  catch (error) {
    LOG.error(action.type, error);
    yield put(initializeApplication.failure(action.id, error));
  }
  finally {
    yield put(initializeApplication.finally(action.id));
  }
}

function* initializeApplicationWatcher() :Generator<*, *, *> {

  yield takeEvery(INITIALIZE_APPLICATION, initializeApplicationWorker);
}

export {
  initializeApplicationWatcher,
  initializeApplicationWorker,
};
