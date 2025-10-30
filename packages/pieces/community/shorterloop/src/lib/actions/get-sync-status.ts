import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { shorterloopAuth } from '../common/auth';

export const getSyncStatus = createAction({
  auth: shorterloopAuth,
  name: 'get_sync_status',
  displayName: 'Get Sync Status',
  description: 'Check if a CRM company is synced to ShorterLoop and get sync metadata',
  props: {
    crm_company_id: Property.ShortText({
      displayName: 'CRM Company ID',
      required: true,
      description: 'External CRM company ID (HubSpot company ID, Salesforce account ID, etc.)',
    }),
  },
  async run(context) {
    const {
      api_key,
      product_id,
      base_url = 'https://api.shorterloop.com',
    } = context.auth;

    const { crm_company_id } = context.propsValue;

    // Make API request
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${base_url}/api/v2/products/${product_id}/integrations/hubspot/sync-status/${crm_company_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: api_key,
      },
    });

    return response.body;
  },
});
