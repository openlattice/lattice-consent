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

type GeoLocationHOCProps = {
  actions :{
    getGeoLocation :RequestSequence;
    resetGeoState :() => void;
  };
  error :Map<*, *>;
  geolocation :?Position;
  getGeoLocationRequestState :RequestState;
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

      const {
        actions,
        error,
        geolocation,
        getGeoLocationRequestState,
      } = this.props;

      const isGettingLocation = getGeoLocationRequestState === RequestStates.PENDING;
      // to avoid an infinite loop, we can only call getGeoLocation() when there's no error
      if ((!error || error.isEmpty()) && !geolocation && !isGettingLocation) {
        actions.getGeoLocation();
      }
    }

    render() {

      const {
        error,
        geolocation,
        getGeoLocationRequestState,
        ...props
      } = this.props;

      const geo = {
        error,
        geolocation,
        getGeoLocationRequestState,
      };

      /* eslint-disable react/jsx-props-no-spreading */
      return (
        <WrappedComponent {...props} geo={geo} />
      );
      /* eslint-enable */
    }
  }

  const mapStateToProps = (state) => ({
    error: state.getIn(['geo', GeoActions.GET_GEO_LOCATION, 'error']),
    geolocation: state.getIn(['geo', 'geolocation']),
    getGeoLocationRequestState: state.getIn(['geo', GeoActions.GET_GEO_LOCATION, 'requestState']),
  });

  const mapActionsToProps = (dispatch) => ({
    actions: bindActionCreators({
      getGeoLocation: GeoActions.getGeoLocation,
      resetGeoState: GeoActions.resetGeoState,
    }, dispatch)
  });

  const mergeProps = (stateProps, dispatchProps, wrappedComponentProps) => {

    const { actions: wrappedComponentActions, ...wrappedComponentOtherProps } = wrappedComponentProps;
    const { actions: { getGeoLocation, resetGeoState } } = dispatchProps;
    const actions = { getGeoLocation, resetGeoState, ...wrappedComponentActions };

    return {
      actions,
      ...wrappedComponentOtherProps,
      ...stateProps,
    };
  };

  return connect(mapStateToProps, mapActionsToProps, mergeProps)(GeoLocationHOC);
}

export default withGeoHOC;
