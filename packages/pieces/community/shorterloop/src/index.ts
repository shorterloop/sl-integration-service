import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { shorterloopAuth } from './lib/common/auth';
import { syncAccountAndUsers } from './lib/actions/sync-account-users';
import { getSyncStatus } from './lib/actions/get-sync-status';
import { findAccount } from './lib/actions/find-account';

export const shorterloop = createPiece({
  displayName: 'ShorterLoop',
  description: 'Sync CRM data (HubSpot, Salesforce, etc.) to ShorterLoop for customer insights and feedback management',
  auth: shorterloopAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/shorterloop.png',
  authors: ['ShorterLoop'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.CRM],
  actions: [
    syncAccountAndUsers,
    getSyncStatus,
    findAccount,
  ],
  triggers: [],
});