/*
 * @flow
 */

import React from 'react';

import { GeoErrors } from 'lattice-utils';

import Text from './Text';

const GeoErrorComponent = ({ error } :{ error :Error}) => {

  if (error) {
    if (error.message === GeoErrors.PERMISSION_DENIED) {
      return (
        <Text align="center">
          <div>It seems your browser permissions have denied access to Location.</div>
          <div>Please make sure your browser settings are configured to allow access to Location.</div>
        </Text>
      );
    }
    if (error.message === GeoErrors.NOT_SUPPORTED) {
      return (
        <Text align="center">
          <div>It seems your browser does not support Location.</div>
          <div>Please make sure you are using a compatible browser.</div>
        </Text>
      );
    }
  }

  return (
    <Text align="center">
      <div>Sorry, there was an issue with browser geolocation.</div>
      <div>Please make sure your browser settings allow access to Location.</div>
    </Text>
  );
};

export default GeoErrorComponent;
