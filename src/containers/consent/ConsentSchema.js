/*
 * @flow
 */

import { DataProcessingUtils } from 'lattice-fabricate';

import { EntitySetNames, FullyQualifiedNames } from '../../core/edm/constants';

const {
  getEntityAddressKey,
  getPageSectionKey,
} = DataProcessingUtils;

const {
  ELECTRONIC_SIGNATURE_ESN,
  CONSENT_FORM_ESN,
  CONSENT_FORM_CONTENT_ESN,
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
 * This is meant to be a starting point for all consent forms. For the time being, we're trying to keep things simple,
 * and as such, all consent forms are meant to follow the same structure:
 *   - page 0:
 *     - section 1: geolocation data (invisible)
 *     - section 2: consent form data (invisible)
 *   - page 1:
 *     - section 1: consent form content data
 *     - section 2: client signature data (required everywhere)
 *     - section 3: staff signature data (only required on some forms)
 *     - section 4: additional witnesses signature data (only required on some forms)
 */

const dataSchema = {
  properties: {
    [getPageSectionKey(0, 1)]: {
      properties: {
        [getEntityAddressKey(0, LOCATION_ESN, LOCATION_LATITUDE_FQN)]: {
          type: 'number',
        },
        [getEntityAddressKey(0, LOCATION_ESN, LOCATION_LONGITUDE_FQN)]: {
          type: 'number',
        },
      },
      required: [
        getEntityAddressKey(0, LOCATION_ESN, LOCATION_LATITUDE_FQN),
        getEntityAddressKey(0, LOCATION_ESN, LOCATION_LONGITUDE_FQN),
      ],
      title: '',
      type: 'object',
    },
    [getPageSectionKey(0, 2)]: {
      properties: {
        [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_DESCRIPTION_FQN)]: {
          type: 'string',
        },
        [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_NAME_FQN)]: {
          type: 'string',
        },
        [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_SCHEMA_FQN)]: {
          type: 'string',
        },
        [getEntityAddressKey(0, CONSENT_FORM_ESN, OL_TYPE_FQN)]: {
          type: 'string',
        },
      },
      required: [
        getEntityAddressKey(0, CONSENT_FORM_ESN, OL_DESCRIPTION_FQN),
        getEntityAddressKey(0, CONSENT_FORM_ESN, OL_NAME_FQN),
        getEntityAddressKey(0, CONSENT_FORM_ESN, OL_SCHEMA_FQN),
        getEntityAddressKey(0, CONSENT_FORM_ESN, OL_TYPE_FQN),
      ],
      title: '',
      type: 'object',
    },
    [getPageSectionKey(1, 1)]: {
      properties: {
        [getEntityAddressKey(0, CONSENT_FORM_CONTENT_ESN, OL_TEXT_FQN)]: {
          properties: {},
          title: '',
          type: 'object',
        },
      },
      required: [
        getEntityAddressKey(0, CONSENT_FORM_CONTENT_ESN, OL_TEXT_FQN),
      ],
      title: '',
      type: 'object',
    },
    [getPageSectionKey(1, 2)]: {
      properties: {
        [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: {
          title: 'Client name',
          type: 'string',
        },
        [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: {
          title: 'Date',
          type: 'string',
        },
        [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: {
          title: 'Client signature',
          type: 'string',
        },
      },
      required: [
        getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN),
        getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN),
        getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN),
      ],
      title: 'Client',
      type: 'object',
    },
    [getPageSectionKey(1, 3)]: {
      properties: {
        [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: {
          title: 'Staff name',
          type: 'string',
        },
        [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: {
          title: 'Date',
          type: 'string',
        },
        [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: {
          title: 'Staff signature',
          type: 'string',
        },
      },
      required: [
        getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN),
        getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN),
        getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN),
      ],
      title: 'Staff',
      type: 'object',
    },
    [getPageSectionKey(1, 4)]: {
      items: {
        properties: {
          [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: {
            title: 'Witness name',
            type: 'string',
          },
          [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: {
            title: 'Date',
            type: 'string',
          },
          [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: {
            title: 'Witness signature',
            type: 'string',
          },
          [getEntityAddressKey(-1, WITNESSES_ESN, GEN_FULL_NAME_FQN)]: {
            type: 'string',
          },
        },
        required: [
          getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN),
          getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN),
          getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN),
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
  [getPageSectionKey(0, 1)]: {
    classNames: 'hidden',
  },
  [getPageSectionKey(0, 2)]: {
    classNames: 'hidden',
  },
  [getPageSectionKey(1, 1)]: {
    classNames: 'column-span-12',
    [getEntityAddressKey(0, CONSENT_FORM_CONTENT_ESN, OL_TEXT_FQN)]: {
      classNames: 'column-span-12',
    },
  },
  [getPageSectionKey(1, 2)]: {
    classNames: 'column-span-12 grid-container',
    [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: {
      classNames: 'column-span-6',
    },
    [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: {
      classNames: 'column-span-6',
      'ui:widget': 'DateWidget',
    },
    [getEntityAddressKey(0, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: {
      classNames: 'column-span-12',
      'ui:widget': 'SignatureWidget',
    },
  },
  [getPageSectionKey(1, 3)]: {
    classNames: 'column-span-12 grid-container',
    [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: {
      classNames: 'column-span-6',
    },
    [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: {
      classNames: 'column-span-6',
      'ui:widget': 'DateWidget',
    },
    [getEntityAddressKey(1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: {
      classNames: 'column-span-12',
      'ui:widget': 'SignatureWidget',
    },
  },
  [getPageSectionKey(1, 4)]: {
    classNames: 'column-span-12',
    items: {
      classNames: 'column-span-12 grid-container',
      [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_NAME_FQN)]: {
        classNames: 'column-span-6',
      },
      [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_DATE_TIME_FQN)]: {
        classNames: 'column-span-6',
        'ui:widget': 'DateWidget',
      },
      [getEntityAddressKey(-1, ELECTRONIC_SIGNATURE_ESN, OL_SIGNATURE_DATA_FQN)]: {
        classNames: 'column-span-12',
        'ui:widget': 'SignatureWidget',
      },
      [getEntityAddressKey(-1, WITNESSES_ESN, GEN_FULL_NAME_FQN)]: {
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
