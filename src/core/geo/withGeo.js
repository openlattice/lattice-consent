/*
 * @flow
 */

import React, { Component } from 'react';
import type { ComponentType } from 'react';

import { Map } from 'immutable';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { RequestStates } from 'redux-reqseq';
import type { RequestSequence, RequestState } from 'redux-reqseq';

import * as GeoActions from './GeoActions';

const { GET_GEO_LOCATION } = GeoActions;

type GeoLocationHOCProps = {
  actions :{
    getGeoLocation :RequestSequence;
    resetGeoState :() => void;
  };
  geo :{
    error :Map;
    geolocation :?Position;
    requestStates :{
      GET_GEO_LOCATION :RequestState;
    };
  };
};

// TODO: figure out correct Flow typing for HOCs - https://flow.org/en/docs/react/hoc
function withGeoHOC(WrappedComponent :ComponentType<Object>) :ComponentType<Object> {

  class GeoLocationHOC extends Component<GeoLocationHOCProps> {

    componentDidMount() {

      this.checkGeoLocation();
    }

    componentDidUpdate() {

      this.checkGeoLocation();
    }

    componentWillUnmount() {

      const { actions } = this.props;
      actions.resetGeoState();
    }

    checkGeoLocation = () => {

      const { actions, geo } = this.props;
      const { error, geolocation, requestStates } = geo;

      const isGettingLocation = requestStates[GET_GEO_LOCATION] === RequestStates.PENDING;
      // to avoid an infinite loop, we can only call getGeoLocation() when there's no error
      if ((!error || error.isEmpty()) && !geolocation && !isGettingLocation) {
        actions.getGeoLocation();
      }
    }

    render() {

      /* eslint-disable react/jsx-props-no-spreading */
      return (
        <WrappedComponent {...this.props} />
      );
      /* eslint-enable */
    }
  }

  const mapStateToProps = (state) => ({
    error: state.getIn(['geo', GeoActions.GET_GEO_LOCATION, 'error']),
    geolocation: state.getIn(['geo', 'geolocation']),
    requestStates: {
      [GET_GEO_LOCATION]: state.getIn(['geo', GeoActions.GET_GEO_LOCATION, 'requestState']),
    },
  });

  const mapActionsToProps = (dispatch) => ({
    actions: bindActionCreators({
      getGeoLocation: GeoActions.getGeoLocation,
      resetGeoState: GeoActions.resetGeoState,
    }, dispatch)
  });

  const mergeProps = (stateProps, actionProps, wrappedProps) => {

    const { actions: wrappedActions, requestStates: wrappedRequestStates, ...wrappedOtherProps } = wrappedProps;
    const { actions: { getGeoLocation, resetGeoState } } = actionProps;
    const actions = { getGeoLocation, resetGeoState, ...wrappedActions };

    return {
      actions,
      geo: { ...stateProps },
      requestStates: { ...wrappedRequestStates },
      ...wrappedOtherProps
    };
  };

  return connect(mapStateToProps, mapActionsToProps, mergeProps)(GeoLocationHOC);
}

export default withGeoHOC;
