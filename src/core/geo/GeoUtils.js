/*
 * @flow
 */

/* eslint-disable import/prefer-default-export */

import GeoErrors from './GeoErrors';

function getCurrentPositionPromise() :Promise<Position> {

  return new Promise((resolve, reject) => {

    const geo :Geolocation = navigator.geolocation;
    if (!geo) {
      reject(new Error(GeoErrors.NOT_SUPPORTED));
    }

    geo.getCurrentPosition(
      (position :Position) => resolve(position),
      (error :PositionError) => reject(error),
    );
  });
}

export {
  getCurrentPositionPromise,
};
