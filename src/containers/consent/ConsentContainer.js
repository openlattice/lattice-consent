/*
 * @flow
 */

import React, { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { Map, fromJS, getIn } from 'immutable';
import { Form } from 'lattice-fabricate';
import { Button, Spinner } from 'lattice-ui-kit';
import { ValidationUtils, useGeo } from 'lattice-utils';
import { DateTime } from 'luxon';
import { useDispatch, useSelector } from 'react-redux';
import { RequestStates } from 'redux-reqseq';
import type { RequestState } from 'redux-reqseq';

import * as ConsentActions from './ConsentActions';
import * as ConsentSchema from './ConsentSchema';
import * as ConsentUtils from './ConsentUtils';

import { Frame, GeoErrorComponent, Text } from '../../components';

const { isValidUUID } = ValidationUtils;

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

const SubmitButton = styled(Button)`
  width: 200px;
  margin: 0 0 30px 30px;
`;

const ConsentContainer = () => {

  const formRef = useRef();
  const [data, setData] = useState(Map());

  const channelId :?UUID = useSelector((store) => store.getIn(['consent', 'channelId']));
  const schema :Object = useSelector((store) => store.getIn(['consent', 'schema']));
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

  useEffect(() => {
    if (isValidUUID(channelId)) {
      const message = {
        id: channelId,
        value: {
          action: SUBMIT_CONSENT,
          state: submitConsentRS,
        },
      };
      window.parent.postMessage(message, window.location.origin);
    }
  }, [channelId, submitConsentRS]);

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

  const onClickSubmit = () => {
    if (formRef.current) {
      formRef.current.submit();
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
    const isSubmitting = submitConsentRS === RequestStates.PENDING;
    return (
      <Frame padding="0">
        <Form
            disabled={isSubmitting}
            formData={data.toJS()}
            hideSubmit
            onChange={onChange}
            onSubmit={onSubmit}
            ref={formRef}
            schema={getIn(schema, ['dataSchema', 0])}
            uiSchema={getIn(schema, ['uiSchema', 0])} />
        <SubmitButton isLoading={isSubmitting} mode="primary" onClick={onClickSubmit}>Submit</SubmitButton>
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
