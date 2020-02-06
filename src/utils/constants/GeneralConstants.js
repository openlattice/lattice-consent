/*
 * @flow
 */

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
const DATA_URL_IMG_PNG_PREFIX :string = 'data:image/png;base64,';
// NOTE: this regex has only been tested for png, which has a different encoding format than jpeg and webp
const DATA_URL_PREFIX_REGEX :RegExp = /^data:image\/[a-z]+;base64,/;

export {
  DATA_URL_IMG_PNG_PREFIX,
  DATA_URL_PREFIX_REGEX,
};
