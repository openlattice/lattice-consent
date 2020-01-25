/*
 * @flow
 */

import {
  call,
  put,
  select,
  takeEvery,
} from '@redux-saga/core/effects';
import { List, Map, fromJS, getIn } from 'immutable';
import { Constants } from 'lattice';
import { DataProcessingUtils } from 'lattice-fabricate';
import { DataApiActions, DataApiSagas, SearchApiActions, SearchApiSagas } from 'lattice-sagas';
import type { FQN } from 'lattice';
import type { SequenceAction } from 'redux-reqseq';

import SigningRoles from './constants/SigningRoles';
import {
  CLEAR_CONSENT_DATA,
  GET_CONSENT_FORM_SCHEMA,
  SUBMIT_CONSENT,
  clearConsentData,
  getConsentFormSchema,
  submitConsent,
} from './ConsentActions';

import Logger from '../../utils/Logger';
import { DataActions, DataSagas } from '../../core/data';
import { EntitySetNames, FullyQualifiedNames } from '../../core/edm/constants';
import { BinaryUtils, DateTimeUtils, WebCryptoUtils } from '../../utils';
import { ERR_ACTION_VALUE_NOT_DEFINED, ERR_WORKER_SAGA } from '../../utils/Errors';
// import { tryConvertingToDataURL } from '../../utils/Utils';
import type { CryptoKeyPair } from '../../utils/WebCryptoUtils';

const LOG = new Logger('ConsentSagas');
const { OPENLATTICE_ID_FQN } = Constants;
const { submitDataGraph } = DataActions;
const { submitDataGraphWorker } = DataSagas;
const { getEntityData } = DataApiActions;
const { getEntityDataWorker } = DataApiSagas;
const { searchEntityNeighborsBulk, searchEntityNeighbors } = SearchApiActions;
const { searchEntityNeighborsBulkWorker, searchEntityNeighborsWorker } = SearchApiSagas;

const {
  getEntityAddressKey,
  getPageSectionKey,
  processAssociationEntityData,
} = DataProcessingUtils;

const {
  OL_ALGORITHM_NAME_FQN,
  OL_CRYPTO_KEY_FQN,
  OL_DATE_TIME_FQN,
  OL_DESCRIPTION_FQN,
  OL_ELLIPTIC_CURVE_NAME_FQN,
  OL_HASH_FUNCTION_NAME_FQN,
  OL_NAME_FQN,
  OL_ROLE_FQN,
  OL_SCHEMA_FQN,
  OL_SIGNATURE_DATA_FQN,
  OL_TEXT_FQN,
  OL_TYPE_FQN,
} = FullyQualifiedNames.PROPERTY_TYPE_FQNS;

const {
  DECRYPTED_BY_ESN,
  INCLUDES_ESN,
  LOCATED_AT_ESN,
  SIGNED_BY_ESN,
  VERIFIES_ESN,
} = EntitySetNames.ASSOCIATION_ENTITY_SET_NAMES;

const {
  CLIENTS_ESN,
  CONSENT_FORM_CONTENT_ESN,
  CONSENT_FORM_ESN,
  CONSENT_FORM_SCHEMAS_ESN,
  DIGITAL_SIGNATURE_ESN,
  ELECTRONIC_SIGNATURE_ESN,
  LOCATION_ESN,
  PUBLIC_KEY_ESN,
  STAFF_ESN,
  WITNESSES_ESN,
} = EntitySetNames.ENTITY_SET_NAMES;

/*
 *
 * ConsentActions.getConsentData()
 *
 */

// function* getConsentDataWorker(action :SequenceAction) :Generator<*, *, *> {
//
//   const { id, value } = action;
//   if (value === null || value === undefined) {
//     yield put(getConsentData.failure(id, ERR_ACTION_VALUE_NOT_DEFINED));
//     return;
//   }
//
//   let response :Object = {};
//   let searchParams :Object = {};
//
//   const { filters, clientEntityKeyId } :GetConsentDataAction = value;
//
//   try {
//     yield put(getConsentData.request(action.id));
//
//     /*
//      * 1. get neighbors
//      */
//
//     const peopleESId :string = yield select(state => state.getIn(['edm', 'entitySetIdsByName', CLIENTS_ESN]));
//     searchParams = { entitySetId: peopleESId, entityKeyId: clientEntityKeyId };
//     response = yield call(searchEntityNeighborsWorker, searchEntityNeighbors(searchParams));
//     if (response.error) throw response.error;
//     const clientNeighborsResults :List<Map> = fromJS(response.data);
//
//     /*
//      * 2. get form neighbors
//      */
//
//     const formEntityData :Map = clientNeighborsResults
//       .filter((neighborResult :Map) => (
//         neighborResult.getIn(['neighborEntitySet', 'name'], '') === CONSENT_FORM_ESN
//         && neighborResult.getIn(['neighborDetails', OL_NAME_FQN, 0], '') === filters[OL_NAME_FQN]
//         && neighborResult.getIn(['neighborDetails', OL_TYPE_FQN, 0], '') === filters[OL_TYPE_FQN]
//       ))
//       /*
//        * !!! ATTENTION !!!
//        * it's possible for a client to have multiple signed consent forms since a client can be admitted multiple
//        * times, so sorting by most recent signing date might not be the correct thing to do
//        */
//       .sort((neighborResult1 :Map, neighborResult2 :Map) => {
//         // a person (client) is connected to a form with the "signed by" edge. as such, this check should always
//         // be true... but... things don't always work as planned
//         if (
//           neighborResult1.getIn(['associationEntitySet', 'name'], '') === SIGNED_BY_ESN
//           && neighborResult2.getIn(['associationEntitySet', 'name'], '') === SIGNED_BY_ESN
//         ) {
//           const date1 :string = neighborResult1.getIn(['associationDetails', OL_DATE_TIME_FQN, 0]);
//           const date2 :string = neighborResult2.getIn(['associationDetails', OL_DATE_TIME_FQN, 0]);
//           if (date1 === date2) {
//             return 0;
//           }
//           return isAfter(date1, date2) ? -1 : 1; // moves most recent date to the front / top
//         }
//         return 0;
//       })
//       .map((neighborResult :Map) => neighborResult.get('neighborDetails'))
//       .first(Map());
//
//     if (!formEntityData || formEntityData.isEmpty()) {
//       yield put(getConsentData.success(action.id, {}));
//       return;
//     }
//
//     const formEKId :string = formEntityData.getIn([OPENLATTICE_ID_FQN, 0]);
//     const formsESId :string = yield select(state => state.getIn(['edm', 'entitySetIdsByName', CONSENT_FORM_ESN]));
//     searchParams = { entitySetId: formsESId, entityKeyId: formEKId };
//     response = yield call(searchEntityNeighborsWorker, searchEntityNeighbors(searchParams));
//     if (response.error) throw response.error;
//     const formNeighborsResults :List<Map> = fromJS(response.data);
//
//     /*
//      * 3. get signature neighbors
//      */
//
//     const formSignaturesEntityData :List<Map> = formNeighborsResults
//       .filter((neighborResult :Map) => (
//         neighborResult.getIn(['associationEntitySet', 'name'], '') === INCLUDES_ESN
//         && neighborResult.getIn(['neighborEntitySet', 'name'], '') === ELECTRONIC_SIGNATURE_ESN
//       ))
//       .map((neighborResult :Map) => neighborResult.get('neighborDetails'));
//
//     if (!formSignaturesEntityData || formSignaturesEntityData.isEmpty()) {
//       throw new Error("this form doesn't have signatures; this is unexpected");
//     }
//
//     const signaturesEntitySetId :UUID = yield select(
//       state => state.getIn(['edm', 'entitySetIdsByName', ELECTRONIC_SIGNATURE_ESN])
//     );
//     const signaturesEntityKeyIds :List<UUID> = formSignaturesEntityData.map(
//       (signatureEntityData :Map) => signatureEntityData.getIn([OPENLATTICE_ID_FQN, 0])
//     );
//     // TODO: entityIds should be entityKeyIds
//     searchParams = { entitySetId: signaturesEntitySetId, entityIds: signaturesEntityKeyIds.toJS() };
//     response = yield call(searchEntityNeighborsBulkWorker, searchEntityNeighborsBulk(searchParams));
//     if (response.error) throw response.error;
//     const signaturesNeighborsResults :Map = fromJS(response.data);
//
//     /*
//      * 4. identify which signature entityKeyIds belong to client, staff, witnesses
//      */
//
//     let clientSignatureEntityKeyId :UUID;
//     let staffSignatureEntityKeyId :UUID;
//     let witnessSignatureEntityKeyIds :List<UUID> = List();
//     signaturesNeighborsResults.forEach((signatureNeighborsResults :List<Map>, signatureEntityKeyId :UUID) => {
//       signatureNeighborsResults.forEach((neighborResult :Map) => {
//         if (
//           neighborResult.getIn(['neighborEntitySet', 'name'], '') === CLIENTS_ESN
//           && neighborResult.getIn(['associationEntitySet', 'name'], '') === SIGNED_BY_ESN
//           && neighborResult.getIn(['associationDetails', OL_ROLE_FQN, 0], '') === SigningRoles.CLIENT
//         ) {
//           clientSignatureEntityKeyId = signatureEntityKeyId;
//         }
//         else if (
//           neighborResult.getIn(['neighborEntitySet', 'name'], '') === EMPLOYEE_ESN
//           && neighborResult.getIn(['associationEntitySet', 'name'], '') === SIGNED_BY_ESN
//           && neighborResult.getIn(['associationDetails', OL_ROLE_FQN, 0], '') === SigningRoles.STAFF
//         ) {
//           staffSignatureEntityKeyId = signatureEntityKeyId;
//         }
//         else if (
//           neighborResult.getIn(['neighborEntitySet', 'name'], '') === WITNESSES_ESN
//           && neighborResult.getIn(['associationEntitySet', 'name'], '') === SIGNED_BY_ESN
//           && neighborResult.getIn(['associationDetails', OL_ROLE_FQN, 0], '') === SigningRoles.WITNESS
//         ) {
//           witnessSignatureEntityKeyIds = witnessSignatureEntityKeyIds.push(signatureEntityKeyId);
//         }
//       });
//     });
//
//     /*
//      * 5. identify which signatures entity data belong to client, staff, witnesses
//      */
//
//     let clientSignatureEntityData :Map = Map();
//     let staffSignatureEntityData :Map = Map();
//     let witnessSignaturesEntityData :List<Map> = List();
//     formSignaturesEntityData.forEach((signatureEntityData :Map) => {
//       const signatureEntityKeyId :UUID = signatureEntityData.getIn([OPENLATTICE_ID_FQN, 0]);
//       if (clientSignatureEntityKeyId === signatureEntityKeyId) {
//         clientSignatureEntityData = signatureEntityData;
//       }
//       else if (staffSignatureEntityKeyId === signatureEntityKeyId) {
//         staffSignatureEntityData = signatureEntityData;
//       }
//       else if (witnessSignatureEntityKeyIds.includes(signatureEntityKeyId)) {
//         witnessSignaturesEntityData = witnessSignaturesEntityData.push(signatureEntityData);
//       }
//     });
//
//     /*
//      * 6. collect all relevant consent data into one object
//      */
//
//     const formContentEntityData :List<Map> = formNeighborsResults
//       .filter((neighbor :Map) => (
//         neighbor.getIn(['associationEntitySet', 'name'], '') === INCLUDES_ESN
//         && neighbor.getIn(['neighborEntitySet', 'name'], '') === CONSENT_FORM_CONTENT_ESN
//       ))
//       .map((neighbor :Map) => neighbor.get('neighborDetails'))
//       .first(Map());
//
//     const consentData :Map = fromJS({
//       [getPageSectionKey(1, 2)]: {
//         [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_DESCRIPTION_FQN)]: formEntityData.getIn([OL_DESCRIPTION_FQN, 0]),
//         [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_NAME_FQN)]: formEntityData.getIn([OL_NAME_FQN, 0]),
//         [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_TYPE_FQN)]: formEntityData.getIn([OL_TYPE_FQN, 0]),
//       },
//       [getPageSectionKey(1, 3)]: {
//         [getEntityAddressKey(0, CONSENT_FORM_CONTENT_ESN, OL_TEXT_FQN)]: JSON.parse(
//           formContentEntityData.getIn([OL_TEXT_FQN, 0])
//         ),
//       },
//       [getPageSectionKey(1, 4)]: {
//         [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: formatAsDate(
//           clientSignatureEntityData.getIn([OL_DATE_TIME_FQN, 0])
//         ),
//         [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: tryConvertingToDataURL(
//           clientSignatureEntityData.getIn([OL_SIGNATURE_DATA_FQN, 0])
//         ),
//         [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: (
//           clientSignatureEntityData.getIn([OL_NAME_FQN, 0])
//         ),
//       },
//       [getPageSectionKey(1, 5)]: {
//         [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: formatAsDate(
//           staffSignatureEntityData.getIn([OL_DATE_TIME_FQN, 0])
//         ),
//         [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: tryConvertingToDataURL(
//           staffSignatureEntityData.getIn([OL_SIGNATURE_DATA_FQN, 0])
//         ),
//         [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: (
//           staffSignatureEntityData.getIn([OL_NAME_FQN, 0])
//         ),
//       },
//       [getPageSectionKey(1, 6)]: witnessSignaturesEntityData.map((witnessSignatureEntityData :Map) => ({
//         [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: formatAsDate(
//           witnessSignatureEntityData.getIn([OL_DATE_TIME_FQN, 0])
//         ),
//         [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: tryConvertingToDataURL(
//           witnessSignatureEntityData.getIn([OL_SIGNATURE_DATA_FQN, 0])
//         ),
//         [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: (
//           witnessSignatureEntityData.getIn([OL_NAME_FQN, 0])
//         ),
//       }))
//     });
//
//     yield put(getConsentData.success(action.id, consentData));
//   }
//   catch (error) {
//     LOG.error(ERR_WORKER_SAGA, error);
//     yield put(getConsentData.failure(action.id, error));
//   }
//   finally {
//     yield put(getConsentData.finally(action.id));
//   }
// }

// function* getConsentDataWatcher() :Generator<*, *, *> {
//
//   yield takeEvery(GET_CONSENT_DATA, getConsentDataWorker);
// }

/*
 *
 * ConsentActions.submitConsent()
 *
 */

// function* submitConsentWorker(action :SequenceAction) :Generator<*, *, *> {
//
//   try {
//
//     const { value } = action;
//     if (value === null || value === undefined) {
//       throw new Error(ERR_ACTION_VALUE_NOT_DEFINED);
//     }
//
//     yield put(submitConsent.request(action.id));
//
//     let response :Object = {};
//
//     const edm = yield select((state) => state.get('edm'));
//
//     const entitySetIds = yield select((state) => ({
//       [DIGITAL_SIGNATURE_ESN]: state.getIn(['edm', 'entitySetIdsByName', DIGITAL_SIGNATURE_ESN]),
//       [CONSENT_FORM_ESN]: state.getIn(['edm', 'entitySetIdsByName', CONSENT_FORM_ESN]),
//       [PUBLIC_KEY_ESN]: state.getIn(['edm', 'entitySetIdsByName', PUBLIC_KEY_ESN]),
//       [SIGNED_BY_ESN]: state.getIn(['edm', 'entitySetIdsByName', SIGNED_BY_ESN]),
//     }));
//
//     const propertyTypeIds :{ [FQN] :UUID } = yield select((state) => ({
//       [OL_DATE_TIME_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_DATE_TIME_FQN]),
//       [OL_DATE_TIME_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_DATE_TIME_FQN]),
//       [OL_ALGORITHM_NAME_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_ALGORITHM_NAME_FQN]),
//       [OL_CRYPTO_KEY_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_CRYPTO_KEY_FQN]),
//       [OL_ELLIPTIC_CURVE_NAME_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_ELLIPTIC_CURVE_NAME_FQN]),
//       [OL_HASH_FUNCTION_NAME_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_HASH_FUNCTION_NAME_FQN]),
//       [OL_SIGNATURE_DATA_FQN]: state.getIn(['edm', 'propertyTypeIds', OL_SIGNATURE_DATA_FQN]),
//     }));
//
//     /*
//      * 1. generate cryptographic key pair
//      */
//
//     const keypair :CryptoKeyPair = yield WebCryptoUtils.generateKeyPair();
//     const publicKey :ArrayBuffer = yield WebCryptoUtils.exportPublicKey(keypair.publicKey);
//     const publicKeyAsBase64 :string = BinaryUtils.bufferToBase64(publicKey);
//
//     /*
//      * 2. sign entity data
//      */
//
//     const dataToSign = JSON.stringify(value.entityData);
//     const digitalSignature :ArrayBuffer = yield WebCryptoUtils.signData(keypair.privateKey, dataToSign);
//     const digitalSignatureAsBase64 :string = BinaryUtils.bufferToBase64(digitalSignature);
//
//     /*
//      * 3. update data for submit
//      */
//
//     const digitalSignatureEntityData = [{
//       [propertyTypeIds[OL_DATE_TIME_FQN]]: [value.timestamp],
//       [propertyTypeIds[OL_ALGORITHM_NAME_FQN]]: ['ECDSA'], // NOTE: must be same as sign()
//       [propertyTypeIds[OL_HASH_FUNCTION_NAME_FQN]]: ['SHA-256'], // NOTE: must be same as sign()
//       [propertyTypeIds[OL_SIGNATURE_DATA_FQN]]: [{
//         data: digitalSignatureAsBase64,
//         'content-type': 'application/octet-stream',
//       }],
//     }];
//
//     const publicKeyEntityData = [{
//       [propertyTypeIds[OL_DATE_TIME_FQN]]: [value.timestamp],
//       [propertyTypeIds[OL_ALGORITHM_NAME_FQN]]: ['ECDSA'], // NOTE: must be same as generateKey()
//       [propertyTypeIds[OL_ELLIPTIC_CURVE_NAME_FQN]]: ['P-256'], // NOTE: must be same as generateKey()
//       [propertyTypeIds[OL_CRYPTO_KEY_FQN]]: [{
//         data: publicKeyAsBase64,
//         'content-type': 'application/octet-stream',
//       }],
//     }];
//
//     const newEntityData = fromJS(value.entityData)
//       .set(entitySetIds[DIGITAL_SIGNATURE_ESN], digitalSignatureEntityData)
//       .set(entitySetIds[PUBLIC_KEY_ESN], publicKeyEntityData)
//       .toJS();
//
//     const associations = [];
//
//     // digital signature -> decrypted by -> public key
//     associations.push([DECRYPTED_BY_ESN, 0, DIGITAL_SIGNATURE_ESN, 0, PUBLIC_KEY_ESN, {
//       [OL_DATE_TIME_FQN]: [value.timestamp],
//     }]);
//
//     // digital signature -> verifies -> form
//     associations.push([VERIFIES_ESN, 0, DIGITAL_SIGNATURE_ESN, 0, CONSENT_FORM_ESN, {
//       [OL_DATE_TIME_FQN]: [value.timestamp],
//     }]);
//
//     // public key -> verifies -> form
//     associations.push([VERIFIES_ESN, 0, PUBLIC_KEY_ESN, 0, CONSENT_FORM_ESN, {
//       [OL_DATE_TIME_FQN]: [value.timestamp],
//     }]);
//
//     const newAssociationEntityData = processAssociationEntityData(fromJS(associations), edm);
//     const updatedAssociationEntityData = fromJS(value.associationEntityData)
//       .mergeDeep(newAssociationEntityData)
//       .toJS();
//
//     /*
//      * 4. submit consent data
//      */
//
//     response = yield call(
//       submitDataGraphWorker,
//       submitDataGraph({
//         associationEntityData: updatedAssociationEntityData,
//         entityData: newEntityData,
//       }),
//     );
//     if (response.error) {
//       throw response.error;
//     }
//
//     yield put(submitConsent.success(action.id));
//   }
//   catch (error) {
//     LOG.error(action.type, error);
//     yield put(submitConsent.failure(action.id, error));
//   }
//   finally {
//     yield put(submitConsent.finally(action.id));
//   }
// }
//
// function* submitConsentWatcher() :Generator<*, *, *> {
//
//   yield takeEvery(SUBMIT_CONSENT, submitConsentWorker);
// }

/*
 *
 * ConsentActions.getConsentFormSchema
 *
 */

function* getConsentFormSchemaWorker(action :SequenceAction) :Generator<*, *, *> {

  try {
    yield put(getConsentFormSchema.request(action.id, action.value));

    const { schemaEntityKeyId, schemasEntitySetId } = action.value;
    const response = yield call(
      getEntityDataWorker,
      getEntityData({ entityKeyId: schemaEntityKeyId, entitySetId: schemasEntitySetId })
    );
    if (response.error) throw response.error;

    const entity = response.data;
    const schemaAsString = getIn(entity, [OL_SCHEMA_FQN, 0]);
    const schema = JSON.parse(schemaAsString);
    const schemaMap = Map({ dataSchema: schema.dataSchema, uiSchema: schema.uiSchema });

    yield put(getConsentFormSchema.success(action.id, schemaMap));
  }
  catch (error) {
    LOG.error(action.type, error);
    yield put(getConsentFormSchema.failure(action.id, error));
  }
  finally {
    yield put(getConsentFormSchema.finally(action.id));
  }
}

function* getConsentFormSchemaWatcher() :Generator<*, *, *> {

  yield takeEvery(GET_CONSENT_FORM_SCHEMA, getConsentFormSchemaWorker);
}

export {
  // getConsentDataWatcher,
  // getConsentDataWorker,
  getConsentFormSchemaWatcher,
  getConsentFormSchemaWorker,
  // submitConsentWatcher,
  // submitConsentWorker,
};
