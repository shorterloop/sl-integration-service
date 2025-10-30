# ShorterLoop Activepieces Custom Piece

## Overview
This custom Activepieces piece allows customers to sync CRM data (HubSpot, Salesforce, Pipedrive, etc.) to their ShorterLoop account. It provides visual, no-code integration capabilities for account and user management.

## Features

### Authentication
- **API Key-based**: Secure API key authentication
- **Product-scoped**: Each connection is scoped to a specific ShorterLoop product/initiative
- **Connection validation**: Tests API credentials during setup

### Actions

#### 1. Sync Account & Users
Syncs a company and its contacts from any CRM to ShorterLoop.

**Use Cases:**
- Import HubSpot companies → ShorterLoop accounts
- Sync Salesforce accounts → ShorterLoop accounts
- Import Pipedrive organizations → ShorterLoop accounts

**Features:**
- Smart deduplication by CRM ID
- Upsert capability (create or update)
- Multi-user sync in one action
- Flexible field mapping

**Inputs:**
- Account Name (required)
- CRM Company ID (required) - for deduplication
- Domain, ARR, MRR, Plan Tier, Industry, etc. (optional)
- Users array (optional) - contacts to associate
- Upsert flag (default: true)

**Output:**
```json
{
  "success": true,
  "message": "Account created and synced successfully",
  "data": {
    "account": {
      "id": 123,
      "name": "Acme Corp",
      "external_id": "hubspot_12345",
      ...
    },
    "sync_stats": {
      "users_created": 2,
      "users_updated": 0,
      "users_associated": 2,
      "errors": 0
    }
  }
}
```

#### 2. Get Sync Status
Check if a CRM company is already synced to ShorterLoop.

**Use Cases:**
- Conditional workflows (sync only if not already synced)
- Monitoring sync health
- Debugging sync issues

**Inputs:**
- CRM Company ID (required)

**Output:**
```json
{
  "success": true,
  "data": {
    "is_synced": true,
    "account_id": 123,
    "account_name": "Acme Corp",
    "last_synced_at": "2025-10-30T20:15:00Z",
    "user_count": 2
  }
}
```

#### 3. Find Account by CRM ID
Find a ShorterLoop account by its CRM company ID.

**Use Cases:**
- Lookup account details before syncing
- Conditional logic based on existing data
- Data enrichment workflows

**Inputs:**
- CRM Company ID (required)

**Output:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Acme Corp",
    "external_id": "hubspot_12345",
    "arr": 50000,
    "product_users": [...]
  }
}
```

## Installation

### Option 1: Development (Local)

1. **Navigate to the Activepieces project:**
   ```bash
   cd d:\dev\shorterloop\sl-integration-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the piece:**
   ```bash
   npx nx build pieces-community-shorterloop
   ```

4. **The piece will be available in your local Activepieces instance**

### Option 2: Production (Railway)

1. **Commit the piece to your fork:**
   ```bash
   cd d:\dev\shorterloop\sl-integration-service
   git add packages/pieces/community/shorterloop
   git commit -m "Add custom ShorterLoop piece for CRM sync"
   git push
   ```

2. **Railway will automatically rebuild and deploy**

3. **The piece will be available in your Activepieces instance after deployment**

## Usage Example: HubSpot → ShorterLoop

### Workflow: Sync Premium Companies Only

```yaml
name: HubSpot Premium Companies → ShorterLoop
trigger:
  type: hubspot_company_updated

steps:
  # Step 1: Filter for Premium tier only
  - name: filter_premium
    type: filter
    condition: "{{trigger.company.plan_tier}} === 'Premium'"

  # Step 2: Get contacts from HubSpot
  - name: get_contacts
    type: hubspot_get_contacts
    company_id: "{{trigger.company.id}}"
    limit: 50

  # Step 3: Transform contacts to user format
  - name: map_users
    type: code
    code: |
      const contacts = steps.get_contacts.output;
      return contacts.map(contact => ({
        email: contact.properties.email,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname
      }));

  # Step 4: Sync to ShorterLoop
  - name: sync_to_shorterloop
    type: shorterloop_sync_account_users
    account_name: "{{trigger.company.name}}"
    external_id: "{{trigger.company.id}}"
    domain: "{{trigger.company.domain}}"
    arr: "{{trigger.company.annualrevenue}}"
    plan_tier: "{{trigger.company.plan_tier}}"
    industry: "{{trigger.company.industry}}"
    users: "{{steps.map_users.output}}"
    upsert: true
```

## Configuration

### Setting up ShorterLoop Connection

1. **In Activepieces, add a new Connection**
2. **Select "ShorterLoop"**
3. **Enter:**
   - **API Key**: Your ShorterLoop API key (generate in ShorterLoop settings)
   - **Product ID**: Your ShorterLoop product/initiative ID (from URL)
   - **Base URL**: `https://api.shorterloop.com` (or your custom domain)
4. **Click "Test Connection"** - should show ✓ if valid

### Getting Your ShorterLoop Credentials

#### API Key
1. Log in to ShorterLoop
2. Go to **Settings** → **Integrations**
3. Click **"Generate API Key"**
4. Copy the key (it will only be shown once)

#### Product ID
1. Navigate to your product/initiative in ShorterLoop
2. Look at the URL: `https://app.shorterloop.com/products/123`
3. The number `123` is your Product ID

## Field Mapping Guide

### CRM → ShorterLoop Field Mapping

| CRM Field (HubSpot) | ShorterLoop Field | Notes |
|---------------------|-------------------|-------|
| `company.name` | `account_name` | Required |
| `company.id` | `external_id` | Required for deduplication |
| `company.domain` | `domain` | Used for auto-associating users |
| `company.annualrevenue` | `arr` | Annual revenue |
| `company.plan_tier` | `plan_tier` | Subscription tier |
| `company.industry` | `industry` | Industry vertical |
| `company.numberofemployees` | `company_size` | Employee count range |
| `contact.email` | `users[].email` | User email (required) |
| `contact.firstname` | `users[].firstName` | User first name |
| `contact.lastname` | `users[].lastName` | User last name |

## Advanced Workflows

### 1. Conditional Sync (Only if Not Already Synced)

```yaml
steps:
  - name: check_sync_status
    type: shorterloop_get_sync_status
    crm_company_id: "{{trigger.company.id}}"

  - name: conditional_sync
    type: branch
    conditions:
      - if: "{{steps.check_sync_status.data.is_synced}} === false"
        then:
          - type: shorterloop_sync_account_users
            # ... sync configuration
```

### 2. Scheduled Bulk Sync

```yaml
trigger:
  type: schedule
  cron: "0 2 * * *"  # Every day at 2 AM

steps:
  - name: get_hubspot_companies
    type: hubspot_search_companies
    filter_groups: [
      { filters: [{ property: "plan_tier", operator: "EQ", value: "Premium" }] }
    ]

  - name: loop_companies
    type: loop
    items: "{{steps.get_hubspot_companies.output.results}}"
    steps:
      - type: shorterloop_sync_account_users
        account_name: "{{loop.item.properties.name}}"
        external_id: "{{loop.item.id}}"
        # ... other fields
```

### 3. Multi-CRM Support

Same workflow works for different CRMs:

**Salesforce:**
```yaml
- name: sync_salesforce_account
  type: shorterloop_sync_account_users
  account_name: "{{trigger.account.Name}}"
  external_id: "{{trigger.account.Id}}"
  arr: "{{trigger.account.AnnualRevenue}}"
```

**Pipedrive:**
```yaml
- name: sync_pipedrive_org
  type: shorterloop_sync_account_users
  account_name: "{{trigger.organization.name}}"
  external_id: "{{trigger.organization.id}}"
  arr: "{{trigger.organization.custom_fields.arr}}"
```

## Error Handling

### Common Errors

#### 1. "Invalid API key or Product ID"
- **Cause**: Incorrect credentials
- **Fix**: Regenerate API key in ShorterLoop settings, verify Product ID

#### 2. "Account name is required"
- **Cause**: Missing required field
- **Fix**: Ensure `account_name` is provided and not empty

#### 3. 401 Unauthorized
- **Cause**: Expired or invalid API key
- **Fix**: Generate new API key

#### 4. 404 Not Found (on Find Account)
- **Cause**: Account doesn't exist in ShorterLoop
- **Fix**: This is normal - use Sync action to create it

### Retry Logic

Add retry logic for transient failures:

```yaml
- name: sync_with_retry
  type: shorterloop_sync_account_users
  retry:
    enabled: true
    max_attempts: 3
    delay: 5000  # 5 seconds
```

## Monitoring & Debugging

### Check Sync Results

The sync action returns detailed results:

```json
{
  "sync_stats": {
    "users_created": 2,
    "users_updated": 0,
    "users_associated": 2,
    "errors": 0
  },
  "user_results": {
    "created": [...],
    "updated": [...],
    "associated": [...],
    "errors": [
      {
        "email": "invalid-email",
        "error": "Invalid email format"
      }
    ]
  }
}
```

### Logging

Check Activepieces execution logs:
1. Go to **Flows** → Your flow
2. Click **"Executions"** tab
3. View detailed step-by-step logs

## FAQ

### Q: Can I sync data from multiple CRMs to the same ShorterLoop product?
**A:** Yes! The `external_id` field includes the CRM type automatically, so you can sync from HubSpot, Salesforce, etc. without conflicts.

### Q: What happens if I sync the same company twice?
**A:** With `upsert: true` (default), the account will be updated. Existing users are associated, new users are created.

### Q: Can I customize which fields are synced?
**A:** Yes! All fields except `account_name` and `external_id` are optional. Map only the fields you need.

### Q: How do I sync additional custom fields?
**A:** Use the `crm_data` JSON field to store any additional CRM metadata:
```yaml
crm_data:
  custom_field_1: "{{trigger.company.custom_field_1}}"
  custom_field_2: "{{trigger.company.custom_field_2}}"
```

### Q: Can customers see this in their Activepieces instance?
**A:** Yes! Once deployed to Railway, the ShorterLoop piece will appear in the Activepieces pieces list for all users.

## Development

### File Structure

```
packages/pieces/community/shorterloop/
├── package.json
├── README.md
└── src/
    ├── index.ts                      # Main piece definition
    └── lib/
        ├── common/
        │   └── auth.ts                # Authentication configuration
        └── actions/
            ├── sync-account-users.ts  # Sync action
            ├── get-sync-status.ts     # Status check action
            └── find-account.ts        # Find action
```

### Adding New Actions

1. Create new action file in `src/lib/actions/`
2. Import and export in `src/index.ts`
3. Rebuild: `npx nx build pieces-community-shorterloop`

### Testing Locally

1. **Start Activepieces locally:**
   ```bash
   npm run start
   ```

2. **Create a test flow** using the ShorterLoop piece

3. **Execute and check logs**

## Support

For issues or questions:
- Check ShorterLoop backend logs: Look for `[HubSpot Sync]`
- Check Activepieces execution logs
- Contact: support@shorterloop.com

## License

MIT License - Same as Activepieces