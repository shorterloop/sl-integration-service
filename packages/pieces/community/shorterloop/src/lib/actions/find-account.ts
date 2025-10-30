import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { shorterloopAuth } from '../common/auth';

export const findAccount = createAction({
  auth: shorterloopAuth,
  name: 'find_account',
  displayName: 'Find Account by CRM ID',
  description: 'Find a ShorterLoop account by its CRM company ID (HubSpot, Salesforce, etc.)',
  props: {
    crm_company_id: Property.ShortText({
      displayName: 'CRM Company ID',
      required: true,
      description: 'External CRM company ID to search for',
    }),
  },
  async run(context) {
    const {
      api_key,
      product_id,
      base_url = 'https://api.shorterloop.com',
    } = context.auth;

    const { crm_company_id } = context.propsValue;

    try {
      // Make API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${base_url}/api/v2/products/${product_id}/integrations/hubspot/accounts/${crm_company_id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: api_key,
        },
      });

      return response.body;
    } catch (error) {
      // If 404, return null instead of throwing error
      if (error.response?.status === 404) {
        return {
          success: false,
          found: false,
          message: 'Account not found',
        };
      }
      throw error;
    }
  },
});
