import { APP_BASE_URL } from '@documenso/lib/constants/app';
import { getSession } from 'next-auth/react';

import { FREE_PLAN_LIMITS } from './constants';
import type { TLimitsResponseSchema } from './schema';
import { ZLimitsResponseSchema } from './schema';
import type { TLimitsSchema } from './schema';
export type GetLimitsOptions = {
  headers?: Record<string, string>;
  teamId?: number | null;
};

// Define a custom plan for active WooCommerce memberships
const CUSTOM_FREE_PLAN_LIMITS: TLimitsSchema = {
  documents: 10, // Increased limits for paying users
  recipients: Infinity,
  directTemplates: Infinity,
};

export const getLimits = async ({ headers, teamId }: GetLimitsOptions = {}) => {
  const requestHeaders = headers ?? {};
  const url = new URL('/api/limits', APP_BASE_URL() ?? 'http://localhost:3000');

  if (teamId) {
    requestHeaders['team-id'] = teamId.toString();
  } 

  try {
    // Get user session to retrieve email
    const session = await getSession();
    const userEmail = session?.user?.email || '';

    console.log('Checking membership for:', userEmail);

    // Check if the user has an active membership in WooCommerce
    const membershipCheckUrl = new URL(
      `/wp-json/memberships/v1/check?email=${userEmail}`,
      'https://tofes-mekovan.co.il' // Replace with your WP site URL
    );

    const membershipResponse = await fetch(membershipCheckUrl.toString());
    const membershipResult = await membershipResponse.json();

    console.log('Membership check response:', membershipResult);

    if (membershipResult.is_active) {
      console.log('✅ User has an active membership, applying upgraded limits');
      return {
        quota: CUSTOM_FREE_PLAN_LIMITS,
        remaining: CUSTOM_FREE_PLAN_LIMITS,
      } satisfies TLimitsResponseSchema;
    }

    console.log('❌ User has NO active membership, applying default free plan');

    // Fetch default limits if no active membership
    const response = await fetch(url.toString(), {
      headers: { ...requestHeaders },
    });

    const result = await response.json();
    return ZLimitsResponseSchema.parse(result);
  } catch (error) {
    console.error('⚠️ Error checking membership:', error);

    // Fallback to default free plan limits if an error occurs
    return {
      quota: FREE_PLAN_LIMITS,
      remaining: FREE_PLAN_LIMITS,
    } satisfies TLimitsResponseSchema;
  }
};
