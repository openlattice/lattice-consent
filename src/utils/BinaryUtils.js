/*
 * @flow
 */

import isArrayBuffer from 'lodash/isArrayBuffer';

import Logger from './Logger';
import { isDefined } from './LangUtils';
import { DATA_URL_IMG_PNG_PREFIX } from './constants/GeneralConstants';

const LOG :Logger = new Logger('BinaryUtils');

function bufferToString(value :ArrayBuffer) :string {

  let errorMsg :string = '';

  if (!isArrayBuffer(value)) {
    errorMsg = 'invalid parameter: "value" must be an ArrayBuffer';
    LOG.error(errorMsg);
    throw new Error(errorMsg);
  }

  const bufferView :Uint8Array = new Uint8Array(value);
  const size :number = bufferView.byteLength;
  let stringBuilder :string = '';
  for (let i = 0; i < size; i += 1) {
    stringBuilder += String.fromCharCode(bufferView[i]);
  }
  return stringBuilder;
}

function stringToBuffer(value :string) :ArrayBuffer {

  let errorMsg :string = '';

  if (!isDefined(value)) {
    errorMsg = 'invalid parameter: "value" must be defined';
    LOG.error(errorMsg);
    throw new Error(errorMsg);
  }

  const size :number = value.length;
  const buffer :ArrayBuffer = new ArrayBuffer(size);
  const bufferView :Uint8Array = new Uint8Array(buffer);

  for (let i = 0; i < size; i += 1) {
    bufferView[i] = value.charCodeAt(i);
  }

  return buffer;
}

function bufferToBase64(value :ArrayBuffer) :string {

  return btoa(bufferToString(value));
}

function base64ToBuffer(value :string) :ArrayBuffer {

  return stringToBuffer(atob(value));
}

function canvasToBase64(canvas :HTMLCanvasElement) :string {

  return canvas.toDataURL().slice(DATA_URL_IMG_PNG_PREFIX.length);
}

export {
  base64ToBuffer,
  bufferToBase64,
  bufferToString,
  canvasToBase64,
  stringToBuffer,
};
