/*
 * @flow
 */

import React, { Component } from 'react';

import styled from 'styled-components';
import { Map } from 'immutable';
import { AuthActions, AuthUtils } from 'lattice-auth';
import {
  AppContainerWrapper,
  AppContentWrapper,
  AppHeaderWrapper,
  AppNavigationWrapper,
  Sizes,
  Spinner,
} from 'lattice-ui-kit';
import { connect } from 'react-redux';
import {
  Redirect,
  Route,
  Switch,
  withRouter,
} from 'react-router';
import { NavLink } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { RequestStates } from 'redux-reqseq';
import type { RequestSequence, RequestState } from 'redux-reqseq';

import * as AppActions from './AppActions';

import OpenLatticeIcon from '../../assets/images/ol_icon.png';
import { Routes } from '../../core/router';
import { isNonEmptyString } from '../../utils/LangUtils';
import { ConsentContainer } from '../consent';

const { APP_CONTENT_WIDTH } = Sizes;
const { INITIALIZE_APPLICATION } = AppActions;

const Error = styled.div`
  text-align: center;
`;

type Props = {
  actions :{
    initializeApplication :RequestSequence;
    logout :() => void;
  };
  requestStates :{
    INITIALIZE_APPLICATION :RequestState;
  };
};

class AppContainer extends Component<Props> {

  componentDidMount() {

    const { actions } = this.props;
    actions.initializeApplication();
  }

  logout = () => {

    const { actions } = this.props;
    actions.logout();

    // TODO: tracking
    // if (isFunction(gtag)) {
    //   gtag('config', GOOGLE_TRACKING_ID, { user_id: undefined, send_page_view: false });
    // }
  }

  renderAppContent = () => {

    const { requestStates } = this.props;

    if (requestStates[INITIALIZE_APPLICATION] === RequestStates.SUCCESS) {
      return (
        <Switch>
          <Route exact strict path={Routes.ROOT} component={ConsentContainer} />
          <Redirect to={Routes.ROOT} />
        </Switch>
      );
    }

    if (requestStates[INITIALIZE_APPLICATION] === RequestStates.FAILURE) {
      return (
        <Error>
          Sorry, something went wrong. Please try refreshing the page, or contact support.
        </Error>
      );
    }

    return (
      <Spinner size="2x" />
    );
  }

  render() {

    const userInfo = AuthUtils.getUserInfo();
    let user = null;
    if (isNonEmptyString(userInfo.name)) {
      user = userInfo.name;
    }
    else if (isNonEmptyString(userInfo.email)) {
      user = userInfo.email;
    }

    return (
      <AppContainerWrapper>
        <AppHeaderWrapper appIcon={OpenLatticeIcon} appTitle="Consent" logout={this.logout} user={user}>
          <AppNavigationWrapper>
            <NavLink to={Routes.ROOT} />
          </AppNavigationWrapper>
        </AppHeaderWrapper>
        <AppContentWrapper contentWidth={APP_CONTENT_WIDTH}>
          { this.renderAppContent() }
        </AppContentWrapper>
      </AppContainerWrapper>
    );
  }
}

const mapStateToProps = (state :Map<*, *>) => ({
  requestStates: {
    [INITIALIZE_APPLICATION]: state.getIn(['app', INITIALIZE_APPLICATION, 'requestState']),
  }
});

const mapActionsToProps = (dispatch :Function) => ({
  actions: bindActionCreators({
    initializeApplication: AppActions.initializeApplication,
    logout: AuthActions.logout,
  }, dispatch)
});

// $FlowFixMe
export default withRouter(
  connect(mapStateToProps, mapActionsToProps)(AppContainer)
);
