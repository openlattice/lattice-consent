/*
 * @flow
 */

import Logger from './Logger';
import { stringToBuffer } from './BinaryUtils';
import { isNonEmptyString } from './LangUtils';

const LOG :Logger = new Logger('WebCryptoUtils');

type CryptoKey = {|
  algorithm :Object;
  extractable :boolean;
  type :string;
  usages :string[];
|};

type CryptoKeyPair = {|
  privateKey :CryptoKey;
  publicKey :CryptoKey;
|};

const isWebCryptoAvailable = () :boolean => (
  Object.prototype.toString.call(window.crypto) === '[object Crypto]'
  && Object.prototype.toString.call(window.crypto.subtle) === '[object SubtleCrypto]'
);

function exportPublicKey(publicKey :CryptoKey) :Promise<ArrayBuffer> {

  let errorMsg :string = '';

  if (!publicKey) {
    errorMsg = 'invalid parameter: "publicKey" must be a valid CryptoKey';
    LOG.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey
  return window.crypto.subtle
    .exportKey(
      'raw', // TODO: should this be 'raw' or 'spki'?
      publicKey,
    )
    .then((exportedKey :ArrayBuffer) => exportedKey)
    .catch((error :Error) => {
      LOG.error(error);
      return Promise.reject(error);
    });
}

function generateKeyPair() :Promise<CryptoKeyPair> {

  let errorMsg :string = '';

  if (!isWebCryptoAvailable()) {
    errorMsg = 'WebCrypto API not available';
    LOG.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
  // TODO: these shouldn't be hardcoded
  return window.crypto.subtle
    .generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify'],
    )
    .then((cryptoKeyPair :CryptoKeyPair) => cryptoKeyPair)
    .catch((error :Error) => {
      LOG.error(error);
      return Promise.reject(error);
    });
}

function signData(privateKey :CryptoKey, data :string) :Promise<ArrayBuffer> {

  let errorMsg :string = '';

  if (!isWebCryptoAvailable()) {
    errorMsg = 'WebCrypto API not available';
    LOG.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  if (!isNonEmptyString(data)) {
    errorMsg = 'invalid parameter: "data" must be a non-empty string';
    LOG.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
  // TODO: these shouldn't be hardcoded
  return window.crypto.subtle
    .sign(
      { hash: 'SHA-256', name: 'ECDSA' },
      privateKey,
      stringToBuffer(data),
    )
    .then((signature :ArrayBuffer) => signature)
    .catch((error :Error) => {
      LOG.error(error);
      return Promise.reject(error);
    });
}

export {
  exportPublicKey,
  generateKeyPair,
  signData,
};

export type {
  CryptoKey,
  CryptoKeyPair,
};
