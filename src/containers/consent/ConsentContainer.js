/*
 * @flow
 */

import React, { Component } from 'react';

import styled from 'styled-components';
import { Map, fromJS, getIn } from 'immutable';
import { Form } from 'lattice-fabricate';
import { Card, Spinner } from 'lattice-ui-kit';
import { DateTime } from 'luxon';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { RequestStates } from 'redux-reqseq';
import type { RequestSequence, RequestState } from 'redux-reqseq';

import * as ConsentActions from './ConsentActions';
import {
  WITNESS_PSK,
  WITNESS_SIGNATURE_DATE_EAK,
} from './ConsentSchema';
import {
  countAdditionalWitnesses,
  initializeDataWithGeo,
  initializeDataWithSchema,
} from './ConsentUtils';

import { EntitySetNames } from '../../core/edm/constants';
import { GeoActions, GeoErrors, withGeo } from '../../core/geo';
import { RoutingActions } from '../../core/router';

const { GET_CONSENT_FORM_SCHEMA, SUBMIT_CONSENT } = ConsentActions;
const { GET_GEO_LOCATION } = GeoActions;
const { CONSENT_FORM_SCHEMAS_ESN } = EntitySetNames.ENTITY_SET_NAMES;

const Error = styled.div`
  margin-top: 50px;
  text-align: center;
`;

type Props = {
  actions :{
    getConsentFormSchema :RequestSequence;
    submitConsent :RequestSequence;
  };
  geo :{
    error :Map<*, *>;
    geolocation :?Position;
    requestStates :{
      GET_GEO_LOCATION :RequestState;
    };
  };
  requestStates :{
    GET_CONSENT_FORM_SCHEMA :RequestState;
    SUBMIT_CONSENT :RequestState;
  };
  schema :Object;
  schemaEntityKeyId :UUID;
  schemasEntitySetId :UUID;
};

type State = {
  data :Map;
};

class ConsentContainer extends Component<Props, State> {

  constructor(props :Props) {

    super(props);
    this.state = {
      data: Map(),
    };
  }

  componentDidMount() {

    const { actions, schemaEntityKeyId, schemasEntitySetId } = this.props;
    actions.getConsentFormSchema({ schemaEntityKeyId, schemasEntitySetId });
  }

  componentDidUpdate(props :Props) {

    const { geo, requestStates, schema } = this.props;
    const { data } = this.state;

    if (props.requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.PENDING
        && requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.SUCCESS) {
      this.setState({
        data: initializeDataWithSchema(data, schema)
      });
    }

    if (props.geo.requestStates[GET_GEO_LOCATION] === RequestStates.PENDING
        && geo.requestStates[GET_GEO_LOCATION] === RequestStates.SUCCESS
        && geo.geolocation) {
      this.setState({
        data: initializeDataWithGeo(data, geo.geolocation)
      });
    }
  }

  onChange = ({ formData } :Object) => {

    const { data } = this.state;
    let newData = fromJS(formData);

    const countBefore :number = countAdditionalWitnesses(data);
    const countAfter :number = countAdditionalWitnesses(newData);
    // only pre-fill date if we're adding a witness
    if (countAfter > 0 && countAfter > countBefore) {
      newData = newData.setIn(
        [WITNESS_PSK, countAfter - 1, WITNESS_SIGNATURE_DATE_EAK],
        DateTime.local().toISO(),
      );
    }

    if (!data.equals(newData)) {
      this.setState({ data: newData });
    }
  }

  onSubmit = () => {

    const { actions } = this.props;
    const { data } = this.state;
    actions.submitConsent({ data });
  }

  renderGeoError = () => {

    const { geo } = this.props;

    if (geo.error) {
      if (geo.error.get('message') === GeoErrors.PERMISSION_DENIED) {
        return (
          <Error>
            <div>It seems your browser permissions have denied access to Location.</div>
            <div>Please make sure your browser settings are configured to allow access to Location.</div>
          </Error>
        );
      }
      if (geo.error.get('message') === GeoErrors.NOT_SUPPORTED) {
        return (
          <Error>
            <div>It seems your browser does not support Location.</div>
            <div>Please make sure you are using a compatible browser.</div>
          </Error>
        );
      }
    }

    return (
      <Error>
        <div>Sorry, there was an issue with browser geolocation.</div>
        <div>Please make sure your browser settings allow access to Location.</div>
      </Error>
    );
  }

  render() {

    const { geo, requestStates, schema } = this.props;
    const { data } = this.state;

    const isPending = geo.requestStates[GET_GEO_LOCATION] === RequestStates.PENDING
      || requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.PENDING;

    if (isPending) {
      return (
        <Spinner size="2x" />
      );
    }

    if (geo.requestStates[GET_GEO_LOCATION] === RequestStates.FAILURE) {
      return this.renderGeoError();
    }

    if (requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.FAILURE) {
      return (
        <Error>
          Sorry, there was an issue getting the consent form. Please try refreshing the page, or contact support.
        </Error>
      );
    }

    if (requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.SUCCESS
        && geo.requestStates[GET_GEO_LOCATION] === RequestStates.SUCCESS) {
      return (
        <Card>
          <Form
              formData={data.toJS()}
              isSubmitting={requestStates[SUBMIT_CONSENT] === RequestStates.PENDING}
              onChange={this.onChange}
              onSubmit={this.onSubmit}
              schema={getIn(schema, ['dataSchema', 0])}
              uiSchema={getIn(schema, ['uiSchema', 0])} />
        </Card>
      );
    }

    return (
      <Error>
        Sorry, the application is in an unexpected state. Please try refreshing the page, or contact support.
      </Error>
    );
  }
}

const mapStateToProps = (state) => ({
  requestStates: {
    [GET_CONSENT_FORM_SCHEMA]: state.getIn(['consent', GET_CONSENT_FORM_SCHEMA, 'requestState']),
    [SUBMIT_CONSENT]: state.getIn(['consent', SUBMIT_CONSENT, 'requestState']),
  },
  schema: state.getIn(['consent', 'schema']),
  schemaEntityKeyId: state.getIn(['consent', 'schemaEntityKeyId']),
  schemasEntitySetId: state.getIn(['edm', 'entitySetIds', CONSENT_FORM_SCHEMAS_ESN]),
});

const mapActionsToProps = (dispatch) => ({
  actions: bindActionCreators({
    getConsentFormSchema: ConsentActions.getConsentFormSchema,
    goToRoute: RoutingActions.goToRoute,
    submitConsent: ConsentActions.submitConsent,
  }, dispatch)
});

// $FlowFixMe
export default connect(mapStateToProps, mapActionsToProps)(withGeo(ConsentContainer));
