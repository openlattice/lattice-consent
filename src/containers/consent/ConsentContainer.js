/*
 * @flow
 */

import React, { useEffect, useState } from 'react';

import { Map, fromJS, getIn } from 'immutable';
import { Form } from 'lattice-fabricate';
import { Spinner } from 'lattice-ui-kit';
import { DateTime } from 'luxon';
import { useDispatch, useSelector } from 'react-redux';
import { RequestStates } from 'redux-reqseq';
import type { RequestState } from 'redux-reqseq';

import * as ConsentActions from './ConsentActions';
import * as ConsentSchema from './ConsentSchema';
import * as ConsentUtils from './ConsentUtils';

import { Frame, Text } from '../../components';
import { useGeo } from '../../core/geo';
import { GeoErrorComponent } from '../../core/geo/components';

const {
  GET_CONSENT_FORM_SCHEMA,
  SUBMIT_CONSENT,
  getConsentFormSchema,
  submitConsent,
} = ConsentActions;

const {
  WITNESS_PSK,
  WITNESS_SIGNATURE_DATE_EAK,
} = ConsentSchema;

const ConsentContainer = () => {

  const [data, setData] = useState(Map());

  const schema :Object = useSelector(
    (store) => store.getIn(['consent', 'schema'])
  );
  const getConsentFormSchemaRS :RequestState = useSelector(
    (store) => store.getIn(['consent', GET_CONSENT_FORM_SCHEMA, 'requestState'])
  );
  const submitConsentRS :RequestState = useSelector(
    (store) => store.getIn(['consent', SUBMIT_CONSENT, 'requestState'])
  );

  const dispatch = useDispatch();
  const [geoPosition, geoError, isPendingGeo] = useGeo();

  useEffect(() => {
    dispatch(getConsentFormSchema());
  }, [dispatch]);

  useEffect(() => {
    if (getConsentFormSchemaRS === RequestStates.SUCCESS) {
      setData(
        (prevData) => ConsentUtils.initializeDataWithSchema(prevData, schema)
      );
    }
  }, [getConsentFormSchemaRS, schema]);

  useEffect(() => {
    if (geoPosition) {
      setData(
        (prevData) => ConsentUtils.initializeDataWithGeo(prevData, geoPosition)
      );
    }
  }, [geoPosition]);

  const onChange = ({ formData } :Object) => {

    let newData = fromJS(formData);

    const countBefore :number = ConsentUtils.countAdditionalWitnesses(data);
    const countAfter :number = ConsentUtils.countAdditionalWitnesses(newData);
    // only pre-fill date if we're adding a witness
    if (countAfter > 0 && countAfter > countBefore) {
      newData = newData.setIn(
        [WITNESS_PSK, countAfter - 1, WITNESS_SIGNATURE_DATE_EAK],
        DateTime.local().toISODate(),
      );
    }

    if (!data.equals(newData)) {
      setData(newData);
    }
  };

  const onSubmit = () => {
    dispatch(submitConsent({ data }));
  };

  /*
   * render
   */

  if (geoError) {
    return (
      <Frame>
        <GeoErrorComponent error={geoError} />
      </Frame>
    );
  }

  if (getConsentFormSchemaRS === RequestStates.FAILURE) {
    return (
      <Frame>
        <Text align="center">
          Sorry, there was an issue getting the consent form. Please try refreshing the page, or contact support.
        </Text>
      </Frame>
    );
  }

  if (getConsentFormSchemaRS === RequestStates.PENDING || isPendingGeo) {
    return (
      <Frame>
        <Spinner size="2x" />
      </Frame>
    );
  }

  if (getConsentFormSchemaRS === RequestStates.SUCCESS && geoPosition) {
    return (
      <Frame padding="0">
        <Form
            formData={data.toJS()}
            isSubmitting={submitConsentRS === RequestStates.PENDING}
            onChange={onChange}
            onSubmit={onSubmit}
            schema={getIn(schema, ['dataSchema', 0])}
            uiSchema={getIn(schema, ['uiSchema', 0])} />
      </Frame>
    );
  }

  return (
    <Frame>
      <Text align="center">
        Sorry, the application is in an unexpected state. Please try refreshing the page, or contact support.
      </Text>
    </Frame>
  );
};

export default ConsentContainer;
