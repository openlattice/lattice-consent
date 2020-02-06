
/*
 * @flow
 */

import {
  CLIENT_EKID,
  FORM_EKID,
} from './QueryStringParams';

type RedirectFlowOutgoingParamsEnum = {|
  CLIENT_EKID :typeof CLIENT_EKID;
  FORM_EKID :typeof FORM_EKID;
|};
type RedirectFlowOutgoingParam = $Values<RedirectFlowOutgoingParamsEnum>;

// TODO: look into using Immutable.Map() or other possible "enum" libraries
const RedirectFlowOutgoingParams :{|...RedirectFlowOutgoingParamsEnum |} = Object.freeze({
  CLIENT_EKID,
  FORM_EKID,
});

export default RedirectFlowOutgoingParams;
export type {
  RedirectFlowOutgoingParam,
  RedirectFlowOutgoingParamsEnum,
};
