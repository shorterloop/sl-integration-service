import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { shorterloopAuth } from '../common/auth';

export const syncAccountAndUsers = createAction({
  auth: shorterloopAuth,
  name: 'sync_account_users',
  displayName: 'Sync Account & Users',
  description: 'Sync a company and its contacts from CRM (HubSpot, Salesforce, etc.) to ShorterLoop',
  props: {
    account_name: Property.ShortText({
      displayName: 'Account Name',
      required: true,
      description: 'Company/account name',
    }),
    external_id: Property.ShortText({
      displayName: 'CRM Company ID',
      required: true,
      description: 'External CRM ID (HubSpot company ID, Salesforce account ID, etc.) - used for deduplication',
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      required: false,
      description: 'Company email domain (e.g., acme.com)',
    }),
    arr: Property.Number({
      displayName: 'ARR (Annual Recurring Revenue)',
      required: false,
      description: 'Annual Recurring Revenue in dollars',
    }),
    mrr: Property.Number({
      displayName: 'MRR (Monthly Recurring Revenue)',
      required: false,
      description: 'Monthly Recurring Revenue in dollars',
    }),
    plan_tier: Property.ShortText({
      displayName: 'Plan Tier',
      required: false,
      description: 'Subscription plan tier (e.g., Free, Pro, Enterprise)',
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
      description: 'Industry vertical',
    }),
    company_size: Property.ShortText({
      displayName: 'Company Size',
      required: false,
      description: 'Company size range (e.g., 1-10, 11-50, 51-200)',
    }),
    customer_since: Property.ShortText({
      displayName: 'Customer Since',
      required: false,
      description: 'Date became customer (YYYY-MM-DD format)',
    }),
    renewal_date: Property.ShortText({
      displayName: 'Renewal Date',
      required: false,
      description: 'Contract renewal date (YYYY-MM-DD format)',
    }),
    crm_data: Property.Json({
      displayName: 'Additional CRM Data',
      required: false,
      description: 'Any additional CRM metadata (JSON object)',
    }),
    users: Property.Array({
      displayName: 'Users/Contacts',
      required: false,
      description: 'Array of user objects to associate with this account',
      defaultValue: [],
    }),
    upsert: Property.Checkbox({
      displayName: 'Update if Exists',
      required: false,
      description: 'If true, update existing account with same CRM ID. If false, skip if account exists.',
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      api_key,
      product_id,
      base_url = 'https://api.shorterloop.com',
    } = context.auth;

    const {
      account_name,
      external_id,
      domain,
      arr,
      mrr,
      plan_tier,
      industry,
      company_size,
      customer_since,
      renewal_date,
      crm_data,
      users,
      upsert,
    } = context.propsValue;

    // Build request payload
    const payload = {
      account: {
        name: account_name,
        external_id: external_id,
        domain: domain || null,
        arr: arr || null,
        mrr: mrr || null,
        plan_tier: plan_tier || null,
        industry: industry || null,
        company_size: company_size || null,
        customer_since: customer_since || null,
        renewal_date: renewal_date || null,
        crm_data: crm_data || null,
      },
      users: users || [],
      upsert: upsert,
    };

    // Make API request
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${base_url}/api/v2/products/${product_id}/integrations/hubspot/sync`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: api_key,
      },
      body: payload,
    });

    return response.body;
  },
});
