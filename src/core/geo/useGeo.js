/*
 * @flow
 */

import { useEffect, useState } from 'react';

import { RequestStates } from 'redux-reqseq';

import GeoErrors from './GeoErrors';

import { Logger } from '../../utils';

const LOG = new Logger('useGeo');

const useGeo = () => {

  const [position, setPosition] = useState();
  const [requestState, setRequestState] = useState(RequestStates.STANDBY);
  const [error, setError] = useState();

  const onError = (e :Error | PositionError) => {
    let errorMessage :string = e.message;
    if (errorMessage.toLowerCase().includes('denied')) {
      errorMessage = GeoErrors.PERMISSION_DENIED;
    }
    const finalError = new Error(errorMessage);
    LOG.error(finalError);
    setError(finalError);
    setRequestState(RequestStates.FAILURE);
  };

  const onSuccess = (p :Position) => {
    setPosition(p);
    setRequestState(RequestStates.SUCCESS);
  };

  useEffect(() => {
    try {
      setRequestState(RequestStates.PENDING);
      const geo :Geolocation = navigator.geolocation;
      if (!geo) {
        throw new Error(GeoErrors.NOT_SUPPORTED);
      }
      geo.getCurrentPosition(onSuccess, onError);
    }
    catch (e) {
      onError(e);
    }
  }, []);

  return [position, requestState, error];
};

export default useGeo;
