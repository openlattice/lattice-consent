/*
 * @flow
 */

import { DataProcessingUtils } from 'lattice-fabricate';

import { EntitySetNames, FullyQualifiedNames } from '../../core/edm/constants';

const { getEntityAddressKey, getPageSectionKey } = DataProcessingUtils;

const {
  ELECTRONIC_SIGNATURE_ESN,
  CONSENT_FORM_ESN,
  LOCATION_ESN,
  WITNESSES_ESN,
} = EntitySetNames.ENTITY_SET_NAMES;

const {
  GEN_FULL_NAME_FQN,
  LOCATION_LATITUDE_FQN,
  LOCATION_LONGITUDE_FQN,
  OL_DATE_TIME_FQN,
  OL_DESCRIPTION_FQN,
  OL_SIGNATURE_DATA_FQN,
  OL_NAME_FQN,
  OL_SCHEMA_FQN,
  OL_TEXT_FQN,
  OL_TYPE_FQN,
} = FullyQualifiedNames.PROPERTY_TYPE_FQNS;

/*
 * location
 */

export const LOCATION_PSK = getPageSectionKey(0, 1);
export const LOCATION_LATITUDE_EAK = getEntityAddressKey(0, LOCATION_ESN, LOCATION_LATITUDE_FQN);
export const LOCATION_LONGITUDE_EAK = getEntityAddressKey(0, LOCATION_ESN, LOCATION_LONGITUDE_FQN);

/*
 * consent form (invisible)
 */

export const CONSENT_FORM_PSK = getPageSectionKey(0, 2);
export const CONSENT_FORM_DESCRIPTION_EAK = getEntityAddressKey(0, CONSENT_FORM_ESN, OL_DESCRIPTION_FQN);
export const CONSENT_FORM_NAME_EAK = getEntityAddressKey(0, CONSENT_FORM_ESN, OL_NAME_FQN);
export const CONSENT_FORM_SCHEMA_EAK = getEntityAddressKey(0, CONSENT_FORM_ESN, OL_SCHEMA_FQN);
export const CONSENT_FORM_TYPE_EAK = getEntityAddressKey(0, CONSENT_FORM_ESN, OL_TYPE_FQN);

/*
 * consent form (visible)
 */

export const CONSENT_FORM_CONTENT_PSK = getPageSectionKey(1, 1);
export const CONSENT_FORM_CONTENT_EAK = getEntityAddressKey(0, CONSENT_FORM_ESN, OL_TEXT_FQN);

/*
 * client signature
 */

export const CLIENT_PSK = getPageSectionKey(1, 2);
export const CLIENT_SIGNATURE_NAME_EAK = getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN);
export const CLIENT_SIGNATURE_DATE_EAK = getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN);
export const CLIENT_SIGNATURE_DATA_EAK = getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN);

/*
 * staff signature
 */

export const STAFF_PSK = getPageSectionKey(1, 3);
export const STAFF_SIGNATURE_NAME_EAK = getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN);
export const STAFF_SIGNATURE_DATE_EAK = getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN);
export const STAFF_SIGNATURE_DATA_EAK = getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN);

/*
 * witness signature
 */

export const WITNESS_PSK = getPageSectionKey(1, 4);
export const WITNESS_NAME_EAK = getEntityAddressKey(-1, WITNESSES_ESN, GEN_FULL_NAME_FQN);
export const WITNESS_SIGNATURE_NAME_EAK = getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN);
export const WITNESS_SIGNATURE_DATE_EAK = getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN);
export const WITNESS_SIGNATURE_DATA_EAK = getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN);

/*
 * This is meant to be a starting point for all consent forms. For the time being, we're trying to keep things simple,
 * and as such, all consent forms are meant to follow the same structure:
 *   - page 0 (invisible):
 *     - section 1: geolocation data
 *     - section 2: consent form data
 *   - page 1 (visible):
 *     - section 1: consent form data
 *     - section 2: client signature data (required everywhere)
 *     - section 3: staff signature data (only required on some forms)
 *     - section 4: additional witnesses signature data (only required on some forms)
 */

const dataSchema = {
  properties: {
    [LOCATION_PSK]: {
      properties: {
        [LOCATION_LATITUDE_EAK]: {
          type: 'number',
        },
        [LOCATION_LONGITUDE_EAK]: {
          type: 'number',
        },
      },
      required: [
        LOCATION_LATITUDE_EAK,
        LOCATION_LONGITUDE_EAK,
      ],
      title: '',
      type: 'object',
    },
    [CONSENT_FORM_PSK]: {
      properties: {
        [CONSENT_FORM_DESCRIPTION_EAK]: {
          type: 'string',
        },
        [CONSENT_FORM_NAME_EAK]: {
          type: 'string',
        },
        [CONSENT_FORM_SCHEMA_EAK]: {
          type: 'string',
        },
        [CONSENT_FORM_TYPE_EAK]: {
          type: 'string',
        },
      },
      required: [
        CONSENT_FORM_DESCRIPTION_EAK,
        CONSENT_FORM_NAME_EAK,
        CONSENT_FORM_SCHEMA_EAK,
        CONSENT_FORM_TYPE_EAK,
      ],
      title: '',
      type: 'object',
    },
    [CONSENT_FORM_CONTENT_PSK]: {
      properties: {
        [CONSENT_FORM_CONTENT_EAK]: {
          properties: {},
          title: '',
          type: 'object',
        },
      },
      required: [
        CONSENT_FORM_CONTENT_EAK,
      ],
      title: '',
      type: 'object',
    },
    [CLIENT_PSK]: {
      properties: {
        [CLIENT_SIGNATURE_NAME_EAK]: {
          title: 'Client name',
          type: 'string',
        },
        [CLIENT_SIGNATURE_DATE_EAK]: {
          title: 'Date',
          type: 'string',
        },
        [CLIENT_SIGNATURE_DATA_EAK]: {
          title: 'Client signature',
          type: 'string',
        },
      },
      required: [
        CLIENT_SIGNATURE_NAME_EAK,
        CLIENT_SIGNATURE_DATE_EAK,
        CLIENT_SIGNATURE_DATA_EAK,
      ],
      title: 'Client',
      type: 'object',
    },
    [STAFF_PSK]: {
      properties: {
        [STAFF_SIGNATURE_NAME_EAK]: {
          title: 'Staff name',
          type: 'string',
        },
        [STAFF_SIGNATURE_DATE_EAK]: {
          title: 'Date',
          type: 'string',
        },
        [STAFF_SIGNATURE_DATA_EAK]: {
          title: 'Staff signature',
          type: 'string',
        },
      },
      required: [
        STAFF_SIGNATURE_NAME_EAK,
        STAFF_SIGNATURE_DATE_EAK,
        STAFF_SIGNATURE_DATA_EAK,
      ],
      title: 'Staff',
      type: 'object',
    },
    [WITNESS_PSK]: {
      items: {
        properties: {
          [WITNESS_SIGNATURE_NAME_EAK]: {
            title: 'Witness name',
            type: 'string',
          },
          [WITNESS_SIGNATURE_DATE_EAK]: {
            title: 'Date',
            type: 'string',
          },
          [WITNESS_SIGNATURE_DATA_EAK]: {
            title: 'Witness signature',
            type: 'string',
          },
          [WITNESS_NAME_EAK]: {
            type: 'string',
          },
        },
        required: [
          WITNESS_SIGNATURE_NAME_EAK,
          WITNESS_SIGNATURE_DATE_EAK,
          WITNESS_SIGNATURE_DATA_EAK,
        ],
        title: '',
        type: 'object',
      },
      title: 'Witnesses',
      type: 'array',
    },
  },
  title: '',
  type: 'object',
};

const uiSchema = {
  [LOCATION_PSK]: {
    classNames: 'hidden',
  },
  [CONSENT_FORM_PSK]: {
    classNames: 'hidden',
  },
  [CONSENT_FORM_CONTENT_PSK]: {
    classNames: 'column-span-12',
    [CONSENT_FORM_CONTENT_EAK]: {
      classNames: 'column-span-12',
    },
  },
  [CLIENT_PSK]: {
    classNames: 'column-span-12 grid-container',
    [CLIENT_SIGNATURE_NAME_EAK]: {
      classNames: 'column-span-6',
    },
    [CLIENT_SIGNATURE_DATE_EAK]: {
      classNames: 'column-span-6',
      'ui:disabled': true,
      'ui:widget': 'DateWidget',
    },
    [CLIENT_SIGNATURE_DATA_EAK]: {
      classNames: 'column-span-12',
      'ui:widget': 'SignatureWidget',
    },
  },
  [STAFF_PSK]: {
    classNames: 'column-span-12 grid-container',
    [STAFF_SIGNATURE_NAME_EAK]: {
      classNames: 'column-span-6',
    },
    [STAFF_SIGNATURE_DATE_EAK]: {
      classNames: 'column-span-6',
      'ui:disabled': true,
      'ui:widget': 'DateWidget',
    },
    [STAFF_SIGNATURE_DATA_EAK]: {
      classNames: 'column-span-12',
      'ui:widget': 'SignatureWidget',
    },
  },
  [WITNESS_PSK]: {
    classNames: 'column-span-12',
    items: {
      classNames: 'column-span-12 grid-container',
      [WITNESS_SIGNATURE_NAME_EAK]: {
        classNames: 'column-span-6',
      },
      [WITNESS_SIGNATURE_DATE_EAK]: {
        classNames: 'column-span-6',
        'ui:disabled': true,
        'ui:widget': 'DateWidget',
      },
      [WITNESS_SIGNATURE_DATA_EAK]: {
        classNames: 'column-span-12',
        'ui:widget': 'SignatureWidget',
      },
      [WITNESS_NAME_EAK]: {
        classNames: 'hidden',
      },
    },
    'ui:options': {
      addButtonText: 'Additional Witness',
    },
  },
};

export {
  dataSchema,
  uiSchema,
};
