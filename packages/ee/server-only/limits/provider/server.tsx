'use server';

import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';

import { NEXT_AUTH_OPTIONS } from '@documenso/lib/next-auth/auth-options';

import { getServerLimits } from '../server';
import { LimitsProvider as ClientLimitsProvider } from './client';

export type LimitsProviderProps = {
  children?: React.ReactNode;
  teamId?: number;
};

export const LimitsProvider = async ({ children, teamId }: LimitsProviderProps) => {
  const session = await getServerSession(NEXT_AUTH_OPTIONS);
  
  // We don't use request headers for server-side fetching here anymore as we use direct DB access
  // or internal fetch logic within getServerLimits
  const limits = await getServerLimits({ 
    email: session?.user?.email, 
    teamId 
  }).catch(() => undefined);

  return (
    <ClientLimitsProvider initialValue={limits} teamId={teamId}>
      {children}
    </ClientLimitsProvider>
  );
};
