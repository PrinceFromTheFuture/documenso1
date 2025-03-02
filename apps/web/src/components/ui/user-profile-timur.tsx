'use client';

import Image from 'next/image';
import LogoImage from '@documenso/assets/logo.png';

import { Trans } from '@lingui/macro';
import { File } from 'lucide-react';

import timurImage from '@documenso/assets/images/timur.png';
import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { VerifiedIcon } from '@documenso/ui/icons/verified';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';

export type UserProfileTimurProps = {
  className?: string;
  rows?: number;
};

export const UserProfileTimur = ({ className, rows = 2 }: UserProfileTimurProps) => {
  const baseUrl = new URL(NEXT_PUBLIC_WEBAPP_URL() ?? 'http://localhost:3000');

  return (
    <div
      className={cn(
        'dark:bg-background flex flex-col items-center rounded-xl bg-neutral-100 p-4',
        className,
      )}
    >
           <Image
            src={LogoImage}
            alt="Tofes-Mekovan Logo"
            className="dark:invert"
            width={170}
            height={25}
          />
 <br></br>
      <div className="mt-4">
        <Image
          src={timurImage}
          className="h-20 w-20 rounded-full"
          alt="image of timur ercan founder of documenso"
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-center gap-x-2">
          <h2 className="text-2xl font-semibold"><Trans>Timur Ercan</Trans></h2>

          <VerifiedIcon className="text-primary h-8 w-8" />
        </div>

        <p className="text-muted-foreground mt-4 max-w-[40ch] text-center text-sm">
          <Trans>Hey I’m Timur</Trans>
        </p>

        <p className="text-muted-foreground mt-1 max-w-[40ch] text-center text-sm">
          <Trans>You too can have a profile like mine right here and now upon completing registration. Online signature with a click of a button - simple, fast and secure.</Trans>
        </p>
      </div>

      <div className="mt-8 w-full">
        <div className="dark:divide-foreground/30 dark:border-foreground/30 divide-y-2 divide-neutral-200 overflow-hidden rounded-lg border-2 border-neutral-200">
          <div className="text-muted-foreground dark:bg-foreground/20 bg-neutral-50 p-4 font-medium">
            <Trans>Documents</Trans>
          </div>

          {Array(rows)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-background flex items-center justify-between gap-x-6 p-4"
              >
                <div className="flex items-center gap-x-2">
                  <File className="text-muted-foreground/80 h-8 w-8" strokeWidth={1.5} />

                  <div className="space-y-2">
                    <div className="dark:bg-foreground/30 h-1.5 w-24 rounded-full bg-neutral-300 md:w-36" />
                    <div className="dark:bg-foreground/20 h-1.5 w-16 rounded-full bg-neutral-200 md:w-24" />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button type="button" size="sm" className="pointer-events-none w-32">
                    <Trans>Sign</Trans>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
