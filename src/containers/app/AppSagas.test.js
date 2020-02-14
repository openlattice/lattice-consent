import randomUUID from 'uuid/v4';
import { all, call, put } from '@redux-saga/core/effects';

import {
  INITIALIZE_APPLICATION,
  initializeApplication,
} from './AppActions';
import {
  initializeApplicationWatcher,
  initializeApplicationWorker,
} from './AppSagas';
import { CONSENT_INITIALIZER } from '../consent/ConsentActions';
import { consentInitializerWorker } from '../consent/ConsentSagas';

import { EDMActions, EDMSagas } from '../../core/edm';
import {
  GENERATOR_TAG,
  testShouldBeGeneratorFunction,
  testWatcherSagaShouldTakeEvery,
} from '../../utils/testing/TestUtils';

const { GET_EDM_TYPES } = EDMActions;
const { getEntityDataModelTypesWorker } = EDMSagas;

const EMPTY_RESPONSE = { data: true };

describe('AppSagas', () => {

  /*
   *
   * AppActions.initializeApplication
   *
   */

  describe('initializeApplicationWatcher', () => {
    testShouldBeGeneratorFunction(initializeApplicationWatcher);
    testWatcherSagaShouldTakeEvery(
      initializeApplicationWatcher,
      initializeApplicationWorker,
      INITIALIZE_APPLICATION
    );
  });

  describe('initializeApplicationWorker', () => {

    testShouldBeGeneratorFunction(initializeApplicationWorker);

    test('success case', () => {

      const mockActionValue = randomUUID();
      const workerSagaAction = initializeApplication(mockActionValue);
      const iterator = initializeApplicationWorker(workerSagaAction);
      expect(Object.prototype.toString.call(iterator)).toEqual(GENERATOR_TAG);

      let step = iterator.next();
      expect(step.value).toEqual(
        put({
          id: workerSagaAction.id,
          type: initializeApplication.REQUEST,
          value: {},
        })
      );

      step = iterator.next();
      expect(step.value).toEqual(
        all([
          call(getEntityDataModelTypesWorker, { id: expect.any(String), type: GET_EDM_TYPES, value: {} }),
          call(consentInitializerWorker, { id: expect.any(String), type: CONSENT_INITIALIZER, value: {} }),
        ])
      );

      step = iterator.next([EMPTY_RESPONSE, EMPTY_RESPONSE]);
      expect(step.value).toEqual(
        put({
          id: workerSagaAction.id,
          type: initializeApplication.SUCCESS,
          value: {},
        })
      );

      step = iterator.next();
      expect(step.value).toEqual(
        put({
          id: workerSagaAction.id,
          type: initializeApplication.FINALLY,
          value: {},
        })
      );

      step = iterator.next();
      expect(step.done).toEqual(true);
    });

    test('failure case', () => {

      const mockActionValue = randomUUID();
      const mockError = new Error(500);
      const workerSagaAction = initializeApplication(mockActionValue);
      const iterator = initializeApplicationWorker(workerSagaAction);
      expect(Object.prototype.toString.call(iterator)).toEqual(GENERATOR_TAG);

      let step = iterator.next();
      expect(step.value).toEqual(
        put({
          id: workerSagaAction.id,
          type: initializeApplication.REQUEST,
          value: {},
        })
      );

      step = iterator.throw(mockError);
      expect(step.value).toEqual(
        put({
          id: workerSagaAction.id,
          type: initializeApplication.FAILURE,
          value: mockError,
        })
      );

      step = iterator.next();
      expect(step.value).toEqual(
        put({
          id: workerSagaAction.id,
          type: initializeApplication.FINALLY,
          value: {},
        })
      );

      step = iterator.next();
      expect(step.done).toEqual(true);
    });

  });

});
