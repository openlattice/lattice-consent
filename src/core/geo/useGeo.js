/*
 * @flow
 */

import { useEffect, useState } from 'react';

import GeoErrors from './GeoErrors';

import { Logger } from '../../utils';

const LOG = new Logger('useGeo');

const useGeo = () => {

  const [position, setPosition] = useState();
  const [error, setError] = useState();

  const onError = (e :Error | PositionError) => {
    let errorMessage :string = e.message;
    if (errorMessage.toLowerCase().includes('denied')) {
      errorMessage = GeoErrors.PERMISSION_DENIED;
    }
    const finalError = new Error(errorMessage);
    LOG.error(finalError);
    setError(finalError);
  };

  const onSuccess = (p :Position) => {
    setPosition(p);
  };

  useEffect(() => {
    try {
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

  const isPending = !position && !error;
  return [position, error, isPending];
};

export default useGeo;
