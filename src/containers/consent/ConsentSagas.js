/*
 * @flow
 */

import qs from 'qs';
import {
  call,
  put,
  select,
  takeEvery,
} from '@redux-saga/core/effects';
import {
  Map,
  fromJS,
  get,
  getIn,
  has,
} from 'immutable';
import { DataProcessingUtils } from 'lattice-fabricate';
import { DataApiActions, DataApiSagas } from 'lattice-sagas';
import { DateTime } from 'luxon';
import type { SequenceAction } from 'redux-reqseq';

import {
  CONSENT_INITIALIZER,
  GET_CONSENT_FORM_SCHEMA,
  SUBMIT_CONSENT,
  consentInitializer,
  getConsentFormSchema,
  submitConsent,
} from './ConsentActions';
import {
  CLIENT_SIGNATURE_DATA_EAK,
  CLIENT_SIGNATURE_DATE_EAK,
  CONSENT_FORM_CONTENT_EAK,
  CONSENT_FORM_CONTENT_PSK,
  STAFF_SIGNATURE_DATA_EAK,
  STAFF_SIGNATURE_DATE_EAK,
  WITNESS_NAME_EAK,
  WITNESS_PSK,
  WITNESS_SIGNATURE_DATA_EAK,
  WITNESS_SIGNATURE_DATE_EAK,
  WITNESS_SIGNATURE_NAME_EAK,
} from './ConsentSchema';
import {
  countAdditionalWitnesses,
  isStaffSignatureRequired,
  isWitnessSignatureRequired,
  signatureValueMapper,
} from './ConsentUtils';
import { QueryStringParams, SigningRoles } from './constants';

import Logger from '../../utils/Logger';
import { DataActions, DataSagas } from '../../core/data';
import { EntitySetNames, FullyQualifiedNames } from '../../core/edm/constants';
import {
  BinaryUtils,
  LangUtils,
  ValidationUtils,
  WebCryptoUtils,
} from '../../utils';
import type { CryptoKeyPair } from '../../utils/WebCryptoUtils';

const LOG = new Logger('ConsentSagas');
const { submitDataGraph } = DataActions;
const { submitDataGraphWorker } = DataSagas;
const { getEntityData } = DataApiActions;
const { getEntityDataWorker } = DataApiSagas;

const { isDefined, isNonEmptyString } = LangUtils;
const { isValidUUID } = ValidationUtils;
const {
  INDEX_MAPPERS,
  KEY_MAPPERS,
  VALUE_MAPPERS,
  processAssociationEntityData,
  processEntityData,
} = DataProcessingUtils;

const {
  OL_ALGORITHM_NAME_FQN,
  OL_CRYPTO_KEY_FQN,
  OL_DATE_TIME_FQN,
  OL_ELLIPTIC_CURVE_NAME_FQN,
  OL_HASH_FUNCTION_NAME_FQN,
  OL_ROLE_FQN,
  OL_SCHEMA_FQN,
  OL_SIGNATURE_DATA_FQN,
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
  CONSENT_FORMS_ESN,
  CONSENT_FORM_SCHEMAS_ESN,
  DIGITAL_SIGNATURES_ESN,
  ELECTRONIC_SIGNATURES_ESN,
  LOCATION_ESN,
  PUBLIC_KEYS_ESN,
  STAFF_ESN,
  WITNESSES_ESN,
} = EntitySetNames.ENTITY_SET_NAMES;

/*
 *
 * ConsentActions.consentInitializer()
 *
 */

function* consentInitializerWorker(action :SequenceAction) :Generator<*, *, *> {

  const workerResponse :Object = {};

  try {
    yield put(consentInitializer.request(action.id));

    const qsParams = qs.parse(window.location.search, { ignoreQueryPrefix: true });

    const qsError :?Error = Object.keys(QueryStringParams)
      .filter((param :string) => QueryStringParams[param] !== QueryStringParams.REDIRECT_URL)
      .reduce(
        (error :any, param :string) => {
          if (isDefined(error)) return error;
          if (!has(qsParams, param)) return new Error(`missing a required query string param: ${param}`);
          const id = get(qsParams, param);
          if (!isValidUUID(id)) return new Error(`query string param must be a valid UUID: ${param} ${id}`);
          return undefined;
        },
        undefined,
      );
    if (qsError) throw qsError;

    const entitySetIds = {
      [CLIENTS_ESN]: qsParams[QueryStringParams.CLIENTS_ESID],
      [CONSENT_FORMS_ESN]: qsParams[QueryStringParams.CONSENT_FORMS_ESID],
      [CONSENT_FORM_SCHEMAS_ESN]: qsParams[QueryStringParams.CONSENT_FORM_SCHEMAS_ESID],
      [DECRYPTED_BY_ESN]: qsParams[QueryStringParams.DECRYPTED_BY_ESID],
      [DIGITAL_SIGNATURES_ESN]: qsParams[QueryStringParams.DIGITAL_SIGNATURES_ESID],
      [ELECTRONIC_SIGNATURES_ESN]: qsParams[QueryStringParams.ELECTRONIC_SIGNATURES_ESID],
      [INCLUDES_ESN]: qsParams[QueryStringParams.INCLUDES_ESID],
      [LOCATED_AT_ESN]: qsParams[QueryStringParams.LOCATED_AT_ESID],
      [LOCATION_ESN]: qsParams[QueryStringParams.LOCATION_ESID],
      [PUBLIC_KEYS_ESN]: qsParams[QueryStringParams.PUBLIC_KEYS_ESID],
      [SIGNED_BY_ESN]: qsParams[QueryStringParams.SIGNED_BY_ESID],
      [STAFF_ESN]: qsParams[QueryStringParams.STAFF_ESID],
      [VERIFIES_ESN]: qsParams[QueryStringParams.VERIFIES_ESID],
      [WITNESSES_ESN]: qsParams[QueryStringParams.WITNESSES_ESID],
    };

    const entityKeyIds = {
      clientEntityKeyId: qsParams[QueryStringParams.CLIENT_EKID],
      schemaEntityKeyId: qsParams[QueryStringParams.SCHEMA_EKID],
      staffEntityKeyId: qsParams[QueryStringParams.STAFF_EKID],
    };

    let redirectURL :?URL;
    if (isNonEmptyString(qsParams[QueryStringParams.REDIRECT_URL])) {
      redirectURL = new URL(qsParams[QueryStringParams.REDIRECT_URL]);
    }

    yield put(consentInitializer.success(action.id, { entityKeyIds, entitySetIds, redirectURL }));
  }
  catch (error) {
    LOG.error(action.type, error);
    workerResponse.error = error;
    yield put(consentInitializer.failure(action.id));
  }
  finally {
    yield put(consentInitializer.finally(action.id));
  }

  return workerResponse;
}

function* consentInitializerWatcher() :Generator<*, *, *> {

  yield takeEvery(CONSENT_INITIALIZER, consentInitializerWorker);
}

/*
 *
 * ConsentActions.submitConsent()
 *
 */

function* submitConsentWorker(action :SequenceAction) :Generator<*, *, *> {

  try {
    yield put(submitConsent.request(action.id));

    const { value } = action;
    let { data } = value;

    const {
      clientEntityKeyId,
      entitySetIds,
      propertyTypeIds,
      redirectURL,
      schema,
      staffEntityKeyId,
    } :{
      clientEntityKeyId :UUID;
      entitySetIds :Map<string, UUID>;
      propertyTypeIds :Map<string, UUID>;
      redirectURL :?URL;
      schema :Object;
      staffEntityKeyId :UUID;
    } = yield select((state) => ({
      clientEntityKeyId: state.getIn(['consent', 'clientEntityKeyId']),
      entitySetIds: state.getIn(['edm', 'entitySetIds']),
      propertyTypeIds: state.getIn(['edm', 'propertyTypeIds']),
      redirectURL: state.getIn(['consent', 'redirectURL']),
      schema: state.getIn(['consent', 'schema']),
      staffEntityKeyId: state.getIn(['consent', 'staffEntityKeyId']),
    }));

    /*
     *
     * entity and association data pre-submission processing
     *
     */

    const associations = [];
    const nowAsISO = DateTime.local().toISO();
    const additionalWitnesses :number = countAdditionalWitnesses(data);
    const staffSignatureRequired :boolean = isStaffSignatureRequired(schema);
    const witnessSignatureRequired :boolean = isWitnessSignatureRequired(schema);

    /*
     * !!! IMPORTANT !!!
     * we assume that there will always exist a person entity for clients and staff, but not for witnesses. as such,
     * only witness names need to be copied from the signature entity to the person entity.
     */

    if (witnessSignatureRequired) {
      for (let witnessIndex = 0; witnessIndex < additionalWitnesses; witnessIndex += 1) {
        data = data.setIn(
          [WITNESS_PSK, witnessIndex, WITNESS_NAME_EAK],
          data.getIn([WITNESS_PSK, witnessIndex, WITNESS_SIGNATURE_NAME_EAK]),
        );
      }
    }

    /*
     * form -> includes -> signature
     */

    // form -> includes -> signature (client)
    associations.push([INCLUDES_ESN, 0, CONSENT_FORMS_ESN, 0, ELECTRONIC_SIGNATURES_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
    }]);

    // form -> includes -> signature (staff)
    if (staffSignatureRequired) {
      associations.push([INCLUDES_ESN, 0, CONSENT_FORMS_ESN, 1, ELECTRONIC_SIGNATURES_ESN, {
        [OL_DATE_TIME_FQN]: [nowAsISO],
      }]);
    }

    // form -> includes -> signature (witnesses)
    if (witnessSignatureRequired) {
      for (let witnessIndex = 0; witnessIndex < additionalWitnesses; witnessIndex += 1) {
        // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
        // have to start at index 2
        const signatureIndex :number = witnessIndex + 2;
        associations.push([INCLUDES_ESN, 0, CONSENT_FORMS_ESN, signatureIndex, ELECTRONIC_SIGNATURES_ESN, {
          [OL_DATE_TIME_FQN]: [nowAsISO],
        }]);
      }
    }

    /*
     * signature -> located at -> location
     */

    // signature (client) -> located at -> location
    associations.push([LOCATED_AT_ESN, 0, ELECTRONIC_SIGNATURES_ESN, 0, LOCATION_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
    }]);

    // signature (staff) -> located at -> location
    if (staffSignatureRequired) {
      associations.push([LOCATED_AT_ESN, 1, ELECTRONIC_SIGNATURES_ESN, 0, LOCATION_ESN, {
        [OL_DATE_TIME_FQN]: [nowAsISO],
      }]);
    }

    // signature (witness) -> located at -> location
    if (witnessSignatureRequired) {
      for (let witnessIndex = 0; witnessIndex < additionalWitnesses; witnessIndex += 1) {
        // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
        // have to start at index 2
        const signatureIndex :number = witnessIndex + 2;
        associations.push([LOCATED_AT_ESN, signatureIndex, ELECTRONIC_SIGNATURES_ESN, 0, LOCATION_ESN, {
          [OL_DATE_TIME_FQN]: [nowAsISO],
        }]);
      }
    }

    /*
     * form -> signed by -> person
     */

    // form -> signed by -> person (client)
    associations.push([SIGNED_BY_ESN, 0, CONSENT_FORMS_ESN, clientEntityKeyId, CLIENTS_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
      [OL_ROLE_FQN]: [SigningRoles.CLIENT],
    }]);

    // form -> signed by -> person (staff)
    if (staffSignatureRequired) {
      associations.push([SIGNED_BY_ESN, 0, CONSENT_FORMS_ESN, staffEntityKeyId, STAFF_ESN, {
        [OL_DATE_TIME_FQN]: [nowAsISO],
        [OL_ROLE_FQN]: [SigningRoles.STAFF],
      }]);
    }

    // form -> signed by -> person (witness)
    if (witnessSignatureRequired) {
      for (let witnessIndex = 0; witnessIndex < additionalWitnesses; witnessIndex += 1) {
        // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
        // have to start at index 2
        associations.push([SIGNED_BY_ESN, 0, CONSENT_FORMS_ESN, witnessIndex, WITNESSES_ESN, {
          [OL_DATE_TIME_FQN]: [nowAsISO],
          [OL_ROLE_FQN]: [SigningRoles.WITNESS],
        }]);
      }
    }

    /*
     * signature -> signed by -> person
     */

    // signature -> signed by -> person (client)
    associations.push([SIGNED_BY_ESN, 0, ELECTRONIC_SIGNATURES_ESN, clientEntityKeyId, CLIENTS_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
      [OL_ROLE_FQN]: [SigningRoles.CLIENT],
    }]);

    // signature -> signed by -> person (staff)
    if (staffSignatureRequired) {
      associations.push([SIGNED_BY_ESN, 1, ELECTRONIC_SIGNATURES_ESN, staffEntityKeyId, STAFF_ESN, {
        [OL_DATE_TIME_FQN]: [nowAsISO],
        [OL_ROLE_FQN]: [SigningRoles.STAFF],
      }]);
    }

    // signature -> signed by -> person (witness)
    if (witnessSignatureRequired) {
      for (let witnessIndex = 0; witnessIndex < additionalWitnesses; witnessIndex += 1) {
        // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
        // have to start at index 2
        const signatureIndex :number = witnessIndex + 2;
        associations.push([SIGNED_BY_ESN, signatureIndex, ELECTRONIC_SIGNATURES_ESN, witnessIndex, WITNESSES_ESN, {
          [OL_DATE_TIME_FQN]: [nowAsISO],
          [OL_ROLE_FQN]: [SigningRoles.WITNESS],
        }]);
      }
    }

    const entityMappers = Map().withMutations((mappers :Map) => {

      /*
       * EntityAddressKey mappers
       */

      const keyMappers = Map().withMutations((map :Map) => {
        map.set(CONSENT_FORM_CONTENT_EAK, JSON.stringify);
      });
      mappers.set(KEY_MAPPERS, keyMappers);

      /*
       * index mappers
       */

      if (witnessSignatureRequired) {
        const indexMappers = Map().withMutations((map :Map) => {
          // NOTE: the client signature gets index 0 and the staff signature gets index 1, so the witness signatures
          // have to start at index 2
          map.set(WITNESS_SIGNATURE_NAME_EAK, (i) => i + 2);
          map.set(WITNESS_SIGNATURE_DATE_EAK, (i) => i + 2);
          map.set(WITNESS_SIGNATURE_DATA_EAK, (i) => i + 2);
        });
        mappers.set(INDEX_MAPPERS, indexMappers);
      }

      /*
       * value mappers
       */

      const valueMappers = Map().withMutations((map :Map) => {
        map.set(CLIENT_SIGNATURE_DATE_EAK, () => nowAsISO);
        map.set(CLIENT_SIGNATURE_DATA_EAK, signatureValueMapper);
        if (staffSignatureRequired) {
          map.set(STAFF_SIGNATURE_DATE_EAK, () => nowAsISO);
          map.set(STAFF_SIGNATURE_DATA_EAK, signatureValueMapper);
        }
        if (witnessSignatureRequired) {
          map.set(WITNESS_SIGNATURE_DATE_EAK, () => nowAsISO);
          map.set(WITNESS_SIGNATURE_DATA_EAK, signatureValueMapper);
        }
      });
      mappers.set(VALUE_MAPPERS, valueMappers);
    });

    /*
     * !!! IMPORTANT !!!
     * we are going to substitute the value for "form content", i.e.
     *   [CONSENT_FORM_CONTENT_PSK, CONSENT_FORM_CONTENT_EAK]
     *   [page1section1, 0__@@__CONSENT_FORMS_ESN__@@__ol.text]
     *
     * what we refer to as "form content" is simply just the stuff before the signature sections. prior to invoking
     * "processEntityData", we are going to replace the value for "form content" with the entirety of the "form data",
     * which includes "all the stuff". most importantly, it includes the entire RJSF internal data structure, i.e.
     *
     *   "page0section1": {
     *     "0__@@__LOCATION_ESN__@@__location.latitude": 0,
     *     "0__@@__LOCATION_ESN__@@__location.longitude": 0,
     *   },
     *   "page0section2": {
     *     "0__@@__CONSENT_FORMS_ESN__@@__ol.description": "",
     *     "0__@@__CONSENT_FORMS_ESN__@@__ol.name": "",
     *     "0__@@__CONSENT_FORMS_ESN__@@__ol.type": "CONSENT",
     *     "0__@@__CONSENT_FORMS_ESN__@@__ol.schema": "{ \"dataSchema\" { ... }, \"uiSchema\": { ... } }",
     *   },
     *   "page1section1": {
     *     "0__@@__CONSENT_FORMS_ESN__@@__ol.text": {
     *       0: "",
     *       1: "",
     *       2: "",
     *       ...
     *     },
     *   },
     *   "page1section2": {
     *     "0__@@__ELECTRONIC_SIGNATURES_ESN__@@__ol.datetime": "",
     *     "0__@@__ELECTRONIC_SIGNATURES_ESN__@@__ol.name": "",
     *     "0__@@__ELECTRONIC_SIGNATURES_ESN__@@__ol.signaturedata": "",
     *   },
     *   "page1section3": {
     *     "1__@@__ELECTRONIC_SIGNATURES_ESN__@@__ol.datetime": "",
     *     "1__@@__ELECTRONIC_SIGNATURES_ESN__@@__ol.signaturedata": "",
     *     "1__@@__ELECTRONIC_SIGNATURES_ESN__@@__ol.name": "",
     *   },
     *   "page1section4": [ ... ],
     *
     * doing this lets us preserve the exact state and structure of the form at the time of submission. further, this
     * makes it easy for us to "re-render" what was submitted because we have all of the information we need on the
     * form entity: "ol.schema" holds the RJSF data schema and ui schema, and "ol.text" holds the entire "form data"
     * object to pass to RJSF. finally, this also means we don't have to make extra requests to crawl the edm graph
     * to gather and reconstruct the form data.
     */

    data = data.setIn(
      [CONSENT_FORM_CONTENT_PSK, CONSENT_FORM_CONTENT_EAK],
      data.toJS(),
    );

    const entityData = processEntityData(data, entitySetIds, propertyTypeIds, entityMappers);

    /*
     *
     * digital signature
     *
     */

    /*
     * 1. generate cryptographic key pair
     */

    const keypair :CryptoKeyPair = yield WebCryptoUtils.generateKeyPair();
    const publicKey :ArrayBuffer = yield WebCryptoUtils.exportPublicKey(keypair.publicKey);
    const publicKeyAsBase64 :string = BinaryUtils.bufferToBase64(publicKey);

    /*
     * 2. sign entity data
     */

    const dataToSign :string = JSON.stringify(entityData);
    const digitalSignature :ArrayBuffer = yield WebCryptoUtils.signData(keypair.privateKey, dataToSign);
    const digitalSignatureAsBase64 :string = BinaryUtils.bufferToBase64(digitalSignature);

    /*
     * 3. update entity data for submit
     */

    const digitalSignatureEntityData = {
      [get(propertyTypeIds, OL_DATE_TIME_FQN)]: [nowAsISO],
      [get(propertyTypeIds, OL_ALGORITHM_NAME_FQN)]: ['ECDSA'], // NOTE: must be same as sign()
      [get(propertyTypeIds, OL_HASH_FUNCTION_NAME_FQN)]: ['SHA-256'], // NOTE: must be same as sign()
      [get(propertyTypeIds, OL_SIGNATURE_DATA_FQN)]: [{
        data: digitalSignatureAsBase64,
        'content-type': 'application/octet-stream',
      }],
    };
    if (Object.keys(digitalSignatureEntityData).length !== 4) {
      const errorMessage = 'expected entity data to have 4 properties';
      LOG.error(errorMessage, digitalSignatureEntityData);
      throw new Error();
    }

    const publicKeyEntityData = {
      [get(propertyTypeIds, OL_DATE_TIME_FQN)]: [nowAsISO],
      [get(propertyTypeIds, OL_ALGORITHM_NAME_FQN)]: ['ECDSA'], // NOTE: must be same as generateKey()
      [get(propertyTypeIds, OL_ELLIPTIC_CURVE_NAME_FQN)]: ['P-256'], // NOTE: must be same as generateKey()
      [get(propertyTypeIds, OL_CRYPTO_KEY_FQN)]: [{
        data: publicKeyAsBase64,
        'content-type': 'application/octet-stream',
      }],
    };
    if (Object.keys(publicKeyEntityData).length !== 4) {
      const errorMessage = 'expected entity data to have 4 properties';
      LOG.error(errorMessage, publicKeyEntityData);
      throw new Error();
    }

    const newEntityData = fromJS(entityData)
      .set(get(entitySetIds, DIGITAL_SIGNATURES_ESN), [digitalSignatureEntityData])
      .set(get(entitySetIds, PUBLIC_KEYS_ESN), [publicKeyEntityData])
      .toJS();

    /*
     * digital signature -> decrypted by -> public key
     */

    associations.push([DECRYPTED_BY_ESN, 0, DIGITAL_SIGNATURES_ESN, 0, PUBLIC_KEYS_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
    }]);

    /*
     * digital signature -> verifies -> form
     */

    associations.push([VERIFIES_ESN, 0, DIGITAL_SIGNATURES_ESN, 0, CONSENT_FORMS_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
    }]);

    /*
     * public key -> verifies -> form
     */

    associations.push([VERIFIES_ESN, 0, PUBLIC_KEYS_ESN, 0, CONSENT_FORMS_ESN, {
      [OL_DATE_TIME_FQN]: [nowAsISO],
    }]);

    const associationEntityData = processAssociationEntityData(associations, entitySetIds, propertyTypeIds);

    const response = yield call(
      submitDataGraphWorker,
      submitDataGraph({
        associationEntityData,
        entityData: newEntityData,
      }),
    );
    if (response.error) {
      throw response.error;
    }

    if (redirectURL) {
      const finalRedirectURL = new URL(redirectURL.href);
      const formEntityKeyId :UUID = getIn(response.data, ['entityKeyIds', entitySetIds.get(CONSENT_FORMS_ESN), 0]);
      finalRedirectURL.search = qs.stringify({ clientEntityKeyId, formEntityKeyId });
      window.location.replace(finalRedirectURL.href);
    }

    yield put(submitConsent.success(action.id));
  }
  catch (error) {
    LOG.error(action.type, error);
    yield put(submitConsent.failure(action.id, error));
  }
  finally {
    yield put(submitConsent.finally(action.id));
  }
}

function* submitConsentWatcher() :Generator<*, *, *> {

  yield takeEvery(SUBMIT_CONSENT, submitConsentWorker);
}

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

    // TODO: we need some kind of schema validation here

    yield put(getConsentFormSchema.success(action.id, schema));
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
  consentInitializerWatcher,
  consentInitializerWorker,
  getConsentFormSchemaWatcher,
  getConsentFormSchemaWorker,
  submitConsentWatcher,
  submitConsentWorker,
};
