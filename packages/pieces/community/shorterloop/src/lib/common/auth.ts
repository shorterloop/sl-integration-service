import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const shorterloopAuth = PieceAuth.CustomAuth({
  displayName: 'ShorterLoop API Configuration',
  required: true,
  description: `
    To connect ShorterLoop, you need:

    1. API Key: Generate this in your ShorterLoop account settings
    2. Product ID: Find this in your ShorterLoop product/initiative URL
    3. Base URL: Your ShorterLoop API endpoint (usually https://api.shorterloop.com)
    `,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your ShorterLoop API key from account settings',
    }),
    product_id: Property.ShortText({
      displayName: 'Product ID',
      required: true,
      description: 'Your ShorterLoop product/initiative ID',
    }),
    base_url: Property.ShortText({
      displayName: 'Base URL',
      required: false,
      defaultValue: 'https://api.shorterloop.com',
      description: 'ShorterLoop API base URL (default: https://api.shorterloop.com)',
    }),
  },
  validate: async (auth) => {
    try {
      const baseUrl = auth.base_url || 'https://api.shorterloop.com';
      const productId = auth.product_id;

      // Test the connection by calling a simple endpoint
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/api/v2/products/${productId}/integrations/hubspot/sync-status/test`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.api_key,
        },
      });

      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key or Product ID. Please check your credentials.',
      };
    }
  },
});
