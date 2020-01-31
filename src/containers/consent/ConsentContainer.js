/*
 * @flow
 */

import React, { Component } from 'react';

import styled from 'styled-components';
import { List, Map, fromJS } from 'immutable';
import { Constants } from 'lattice';
import { DataProcessingUtils, Form } from 'lattice-fabricate';
import { Card, Spinner } from 'lattice-ui-kit';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { RequestStates } from 'redux-reqseq';
import type { RequestSequence, RequestState } from 'redux-reqseq';

import * as ConsentActions from './ConsentActions';
import { SigningRoles } from './constants';

import { EntitySetNames, FullyQualifiedNames } from '../../core/edm/constants';
import { GeoErrors, withGeo } from '../../core/geo';
import { RoutingActions } from '../../core/router';
// import * as M from './MetallicaConsentSchema';

const { OPENLATTICE_ID_FQN } = Constants;

const {
  INDEX_MAPPERS,
  KEY_MAPPERS,
  VALUE_MAPPERS,
  getEntityAddressKey,
  getPageSectionKey,
  processAssociationEntityData,
  processEntityData,
} = DataProcessingUtils;

const {
  INCLUDES_ESN,
  LOCATED_AT_ESN,
  SIGNED_BY_ESN,
} = EntitySetNames.ASSOCIATION_ENTITY_SET_NAMES;

const {
  CLIENTS_ESN,
  CONSENT_FORM_CONTENT_ESN,
  CONSENT_FORM_ESN,
  CONSENT_FORM_SCHEMAS_ESN,
  ELECTRONIC_SIGNATURE_ESN,
  LOCATION_ESN,
  STAFF_ESN,
  WITNESSES_ESN,
} = EntitySetNames.ENTITY_SET_NAMES;

const {
  GEN_FULL_NAME_FQN,
  LOCATION_LATITUDE_FQN,
  LOCATION_LONGITUDE_FQN,
  OL_DATE_TIME_FQN,
  OL_DESCRIPTION_FQN,
  OL_NAME_FQN,
  OL_ROLE_FQN,
  OL_SCHEMA_FQN,
  OL_SIGNATURE_DATA_FQN,
  OL_TEXT_FQN,
  OL_TYPE_FQN,
} = FullyQualifiedNames.PROPERTY_TYPE_FQNS;

const { GET_CONSENT_FORM_SCHEMA } = ConsentActions;

const Error = styled.div`
  margin-top: 50px;
  text-align: center;
`;

type Props = {
  actions :{
    getConsentFormSchema :RequestSequence;
    submitConsent :RequestSequence;
  };
  clientEntityKeyId :UUID;
  entitySetIds :{
    CLIENTS_ESN :UUID;
    CONSENT_FORM_CONTENT_ESN :UUID;
    CONSENT_FORM_ESN :UUID;
    CONSENT_FORM_SCHEMAS_ESN :UUID;
    DECRYPTED_BY_ESN :UUID;
    DIGITAL_SIGNATURE_ESN :UUID;
    ELECTRONIC_SIGNATURE_ESN :UUID;
    INCLUDES_ESN :UUID;
    LOCATED_AT_ESN :UUID;
    LOCATION_ESN :UUID;
    PUBLIC_KEY_ESN :UUID;
    SIGNED_BY_ESN :UUID;
    STAFF_ESN :UUID;
    VERIFIES_ESN :UUID;
    WITNESSES_ESN :UUID;
  };
  geo :{
    error :Map<*, *>;
    geolocation :?Position;
    getGeoLocationRequestState :RequestState;
  };
  propertyTypeIds :Map;
  requestStates :{
    GET_CONSENT_FORM_SCHEMA :RequestState;
  };
  schema :Map;
  schemaEntityKeyId :UUID;
  staffEntityKeyId :UUID;
};

type State = {
  data :Map;
  initialized :boolean;
};

class ConsentContainer extends Component<Props, State> {

  constructor(props :Props) {

    super(props);
    this.state = {
      data: {},
      initialized: false,
    };
  }

  componentDidMount() {

    const { actions, entitySetIds, schemaEntityKeyId } = this.props;

    actions.getConsentFormSchema({
      schemaEntityKeyId,
      schemasEntitySetId: entitySetIds[CONSENT_FORM_SCHEMAS_ESN],
    });
  }

  componentDidUpdate(props :Props) {

    const { schema } = this.props;
    if (props.schema.isEmpty() && !schema.isEmpty()) {
      // we have the schema, we can hydrate initial data
      this.setState({
        data: this.getInitialData(),
        initialized: true,
      });
    }
  }

  getInitialData = () => {

    const data = {};
    const nowAsISO :string = (new Date()).toISOString();

    data[getPageSectionKey(1, 2)] = {
      [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: nowAsISO,
    };

    if (this.isStaffSignatureRequired()) {
      data[getPageSectionKey(1, 3)] = {
        [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: nowAsISO,
      };
    }

    if (this.areWitnessSignaturesRequired()) {
      data[getPageSectionKey(1, 4)] = [];
    }

    return fromJS(data);
  }

  isStaffSignatureRequired = () => {

    const { schema } = this.props;
    return schema.hasIn(['dataSchema', 0, 'properties', getPageSectionKey(1, 3)]);
  }

  areWitnessSignaturesRequired = () => {

    const { schema } = this.props;
    return schema.hasIn(['dataSchema', 0, 'properties', getPageSectionKey(1, 4)]);
  }

  getAdditionalWitnessesCount = (data :Map) => {

    let additionalWitnessesCount :number = 0;
    const additionalWitnessesData :?List = data.get(getPageSectionKey(1, 4), List());
    if (additionalWitnessesData) {
      additionalWitnessesCount = additionalWitnessesData.count();
    }
    return additionalWitnessesCount;
  }

  onChange = ({ formData } :Object) => {

    const { data } = this.state;
    let newData = fromJS(formData);
    const nowAsISO :string = (new Date()).toISOString();

    // !!! IMPORTANT !!!
    // the witness name needs to be copied from the signature entity to the person entity and kept in sync
    const countBefore :number = this.getAdditionalWitnessesCount(data);
    const countAfter :number = this.getAdditionalWitnessesCount(newData);
    if (countAfter > 0) {
      for (let i = 0; i < countAfter; i += 1) {
        newData = newData.setIn(
          [getPageSectionKey(1, 4), i, getEntityAddressKey(-1, WITNESSES_ESN, GEN_FULL_NAME_FQN)],
          newData.getIn(
            [getPageSectionKey(1, 4), i, getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)],
          ),
        );
        // only pre-fill date if we're adding a witness and we're at the last index
        if (countAfter > countBefore && i === (countAfter - 1)) {
          newData = newData.setIn(
            [getPageSectionKey(1, 4), i, getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)],
            nowAsISO,
          );
        }
      }
    }

    if (!data.equals(newData)) {
      this.setState({ data: newData });
    }
  }

  // onSubmit = () => {
  //
  //   const {
  //     actions,
  //     clientEntityKeyId,
  //     entitySetIds,
  //     geo,
  //     propertyTypeIds,
  //     staffEntityKeyId,
  //   } = this.props;
  //   const { data } = this.state;
  //   const { geolocation } = geo;
  //
  //   const additionalWitnessesCount :number = this.getAdditionalWitnessesCount(data);
  //   const nowAsISO :string = (new Date()).toISOString();
  //
  //   const associations = [];
  //
  //   /*
  //    *
  //    * form -> includes -> content
  //    *
  //    */
  //
  //   // form -> includes -> content
  //   associations.push([INCLUDES_ESN, 0, CONSENT_FORM_ESN, 0, CONSENT_FORM_CONTENT_ESN, {
  //     [OL_DATE_TIME_FQN]: [nowAsISO],
  //   }]);
  //
  //   /*
  //    *
  //    * form -> includes -> signature
  //    *
  //    */
  //
  //   // form -> includes -> signature (client)
  //   associations.push([INCLUDES_ESN, 0, CONSENT_FORM_ESN, 0, ELECTRONIC_SIGNATURE_ESN, {
  //     [OL_DATE_TIME_FQN]: [nowAsISO],
  //   }]);
  //   // form -> includes -> signature (staff)
  //   if (this.isStaffSignatureRequired()) {
  //     associations.push([INCLUDES_ESN, 0, CONSENT_FORM_ESN, 1, ELECTRONIC_SIGNATURE_ESN, {
  //       [OL_DATE_TIME_FQN]: [nowAsISO],
  //     }]);
  //   }
  //   // form -> includes -> signature (witnesses)
  //   if (this.areWitnessSignaturesRequired()) {
  //     for (let witnessIndex = 0; witnessIndex < additionalWitnessesCount; witnessIndex += 1) {
  //       // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
  //       // have to start at index 2
  //       const witnessSignatureIndex :number = witnessIndex + 2;
  //       associations.push([INCLUDES_ESN, 0, CONSENT_FORM_ESN, witnessSignatureIndex, ELECTRONIC_SIGNATURE_ESN, {
  //         [OL_DATE_TIME_FQN]: [nowAsISO],
  //       }]);
  //     }
  //   }
  //
  //   /*
  //    *
  //    * signature -> located at -> location
  //    *
  //    */
  //
  //   // signature (client) -> located at -> location
  //   associations.push([LOCATED_AT_ESN, 0, ELECTRONIC_SIGNATURE_ESN, 0, LOCATION_ESN, {
  //     [OL_DATE_TIME_FQN]: [nowAsISO],
  //   }]);
  //   // signature (staff) -> located at -> location
  //   if (this.isStaffSignatureRequired()) {
  //     associations.push([LOCATED_AT_ESN, 1, ELECTRONIC_SIGNATURE_ESN, 0, LOCATION_ESN, {
  //       [OL_DATE_TIME_FQN]: [nowAsISO],
  //     }]);
  //   }
  //   // signature (witness) -> located at -> location
  //   if (this.areWitnessSignaturesRequired()) {
  //     for (let witnessIndex = 0; witnessIndex < additionalWitnessesCount; witnessIndex += 1) {
  //       // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
  //       // have to start at index 2
  //       const witnessSignatureIndex :number = witnessIndex + 2;
  //       associations.push([LOCATED_AT_ESN, witnessSignatureIndex, ELECTRONIC_SIGNATURE_ESN, 0, LOCATION_ESN, {
  //         [OL_DATE_TIME_FQN]: [nowAsISO],
  //       }]);
  //     }
  //   }
  //
  //   /*
  //    *
  //    * form -> signed by -> person
  //    *
  //    */
  //
  //   // form -> signed by -> person (client)
  //   associations.push([SIGNED_BY_ESN, 0, CONSENT_FORM_ESN, clientEntityKeyId, CLIENTS_ESN, {
  //     [OL_DATE_TIME_FQN]: [nowAsISO],
  //     [OL_ROLE_FQN]: [SigningRoles.CLIENT],
  //   }]);
  //   // form -> signed by -> person (staff)
  //   if (this.isStaffSignatureRequired()) {
  //     associations.push([SIGNED_BY_ESN, 0, CONSENT_FORM_ESN, staffEntityKeyId, STAFF_ESN, {
  //       [OL_DATE_TIME_FQN]: [nowAsISO],
  //       [OL_ROLE_FQN]: [SigningRoles.STAFF],
  //     }]);
  //   }
  //   // form -> signed by -> person (witness)
  //   for (let witnessIndex = 0; witnessIndex < additionalWitnessesCount; witnessIndex += 1) {
  //     // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
  //     // have to start at index 2
  //     associations.push([SIGNED_BY_ESN, 0, CONSENT_FORM_ESN, witnessIndex, WITNESSES_ESN, {
  //       [OL_DATE_TIME_FQN]: [nowAsISO],
  //       [OL_ROLE_FQN]: [SigningRoles.WITNESS],
  //     }]);
  //   }
  //
  //   /*
  //    *
  //    * signature -> signed by -> person
  //    *
  //    */
  //
  //   // signature -> signed by -> person (client)
  //   associations.push([SIGNED_BY_ESN, 0, ELECTRONIC_SIGNATURE_ESN, clientEntityKeyId, CLIENTS_ESN, {
  //     [OL_DATE_TIME_FQN]: [nowAsISO],
  //     [OL_ROLE_FQN]: [SigningRoles.CLIENT],
  //   }]);
  //   // signature -> signed by -> person (staff)
  //   if (this.isStaffSignatureRequired()) {
  //     associations.push([SIGNED_BY_ESN, 1, ELECTRONIC_SIGNATURE_ESN, staffEntityKeyId, STAFF_ESN, {
  //       [OL_DATE_TIME_FQN]: [nowAsISO],
  //       [OL_ROLE_FQN]: [SigningRoles.STAFF],
  //     }]);
  //   }
  //   // signature -> signed by -> person (witness)
  //   for (let witnessIndex = 0; witnessIndex < additionalWitnessesCount; witnessIndex += 1) {
  //     // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
  //     // have to start at index 2
  //     const witnessSignatureIndex :number = witnessIndex + 2;
  //     associations.push([SIGNED_BY_ESN, witnessSignatureIndex, ELECTRONIC_SIGNATURE_ESN, witnessIndex, WITNESSES_ESN, {
  //       [OL_DATE_TIME_FQN]: [nowAsISO],
  //       [OL_ROLE_FQN]: [SigningRoles.WITNESS],
  //     }]);
  //   }
  //
  //   const entityMappers = Map().withMutations((mappers :Map) => {
  //
  //     const keyMappers = Map().withMutations((map :Map) => {
  //       map.set(getEntityAddressKey(0, CONSENT_FORM_CONTENT_ESN, OL_TEXT_FQN), JSON.stringify);
  //     });
  //     mappers.set(KEY_MAPPERS, keyMappers);
  //
  //     if (this.areWitnessSignaturesRequired()) {
  //       const indexMappers = Map().withMutations((map :Map) => {
  //         // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
  //         // have to start at index 2
  //         map.set(getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN), (i) => i + 2);
  //         map.set(getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN), (i) => i + 2);
  //         map.set(getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN), (i) => i + 2);
  //       });
  //       mappers.set(INDEX_MAPPERS, indexMappers);
  //     }
  //
  //     const valueMappers = Map().withMutations((map :Map) => {
  //       map.set(getEntityAddressKey(0, LOCATION_ESN, LOCATION_LATITUDE_FQN), () => geolocation.coords.latitude);
  //       map.set(getEntityAddressKey(0, LOCATION_ESN, LOCATION_LONGITUDE_FQN), () => geolocation.coords.longitude);
  //       map.set(getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN), () => nowAsISO);
  //       map.set(getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN), this.signatureValueMapper);
  //       if (this.isStaffSignatureRequired()) {
  //         map.set(getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN), () => nowAsISO);
  //         map.set(getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN), this.signatureValueMapper);
  //       }
  //       if (this.areWitnessSignaturesRequired()) {
  //         map.set(getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN), () => nowAsISO);
  //         map.set(getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN), this.signatureValueMapper);
  //       }
  //     });
  //     mappers.set(VALUE_MAPPERS, valueMappers);
  //   });
  //
  //   const entityData = processEntityData(data, entitySetIds, propertyTypeIds, entityMappers);
  //   const associationEntityData = processAssociationEntityData(associations, entitySetIds, propertyTypeIds);
  //   actions.submitConsent({ associationEntityData, entityData, timestamp: nowAsISO });
  // }

  // NOTE: this is a temporary fix for getting binary submissions to work. we should figure out a way to not have to
  // hardcode the Content-Type here
  signatureValueMapper = (value :any) => ({
    data: value,
    'content-type': 'image/png',
  })

  renderGeoError = () => {

    const { geo } = this.props;

    if (geo.error && geo.error.get('message') === GeoErrors.PERMISSION_DENIED) {
      return (
        <Error>
          <div>It seems your browser permissions have denied access to Location.</div>
          <div>Please make sure your browser settings are configured to allow access to Location.</div>
        </Error>
      );
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
    const { data, initialized } = this.state;

    const isPending = geo.getGeoLocationRequestState === RequestStates.PENDING
      || requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.PENDING;

    if (isPending) {
      return (
        <Spinner size="2x" />
      );
    }

    if (geo.getGeoLocationRequestState === RequestStates.FAILURE) {
      return this.renderGeoError();
    }

    if (requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.FAILURE) {
      return (
        <Error>
          Sorry, there was an issue getting the consent form. Please try refreshing the page, or contact support.
        </Error>
      );
    }

    if (requestStates[GET_CONSENT_FORM_SCHEMA] === RequestStates.SUCCESS && initialized) {
      return (
        <Card>
          <Form
              formData={data.toJS()}
              onChange={this.onChange}
              schema={schema.getIn(['dataSchema', 0])}
              uiSchema={schema.getIn(['uiSchema', 0])} />
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
  propertyTypeIds: state.getIn(['edm', 'propertyTypeIds']),
  requestStates: {
    [GET_CONSENT_FORM_SCHEMA]: state.getIn(['consent', GET_CONSENT_FORM_SCHEMA, 'requestState']),
  },
  schema: state.getIn(['consent', 'schema']),
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
