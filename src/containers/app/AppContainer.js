/*
 * @flow
 */

import React, { useEffect } from 'react';

import { Spinner } from 'lattice-ui-kit';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import { RequestStates } from 'redux-reqseq';
import type { RequestState } from 'redux-reqseq';

import { INITIALIZE_APPLICATION, initializeApplication } from './AppActions';

import { Frame, Text } from '../../components';
import { Routes } from '../../core/router';
import { ConsentContainer } from '../consent';

const AppContainer = () => {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeApplication());
  }, [dispatch]);

  const initializeApplicationRS :RequestState = useSelector(
    (store) => store.getIn(['app', INITIALIZE_APPLICATION, 'requestState'])
  );

  if (initializeApplicationRS === RequestStates.SUCCESS) {
    return (
      <Switch>
        <Route exact strict path={Routes.ROOT} component={ConsentContainer} />
        <Redirect to={Routes.ROOT} />
      </Switch>
    );
  }

  if (initializeApplicationRS === RequestStates.FAILURE) {
    return (
      <Frame>
        <Text align="center">
          Sorry, something went wrong. Please try refreshing the page, or contact support.
        </Text>
      </Frame>
    );
  }

  return (
    <Frame>
      <Spinner size="2x" />
    </Frame>
  );
};

export default AppContainer;
