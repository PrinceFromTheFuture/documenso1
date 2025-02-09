import { generateOpenApi } from '@ts-rest/open-api';

import { ApiContractV1 } from './contract';

export const OpenAPIV1 = Object.assign(
  generateOpenApi(
    ApiContractV1,
    {
      info: {
        title: 'Tofes-Mekovan API',
        version: '1.0.0',
        description: 'The Tofes-Mekovan API for retrieving, creating, updating and deleting documents.',
      },
    },
    {
      setOperationId: true,
    },
  ),
  {
    components: {
      securitySchemes: {
        authorization: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
        },
      },
    },
    security: [
      {
        authorization: [],
      },
    ],
  },
);
