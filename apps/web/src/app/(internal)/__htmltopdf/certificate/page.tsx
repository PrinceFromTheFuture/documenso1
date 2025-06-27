import React from 'react';

import { redirect } from 'next/navigation';

import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { DateTime } from 'luxon';
import { match } from 'ts-pattern';
import { UAParser } from 'ua-parser-js';

import { setupI18nSSR } from '@documenso/lib/client-only/providers/i18n.server';
import { APP_I18N_OPTIONS, ZSupportedLanguageCodeSchema } from '@documenso/lib/constants/i18n';
import {
  RECIPIENT_ROLES_DESCRIPTION,
  RECIPIENT_ROLE_SIGNING_REASONS,
} from '@documenso/lib/constants/recipient-roles';
import { getEntireDocument } from '@documenso/lib/server-only/admin/get-entire-document';
import { decryptSecondaryData } from '@documenso/lib/server-only/crypto/decrypt';
import { getDocumentCertificateAuditLogs } from '@documenso/lib/server-only/document/get-document-certificate-audit-logs';
import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import { extractDocumentAuthMethods } from '@documenso/lib/utils/document-auth';
import { dynamicActivate } from '@documenso/lib/utils/i18n';
import { FieldType } from '@documenso/prisma/client';
import { Card, CardContent } from '@documenso/ui/primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@documenso/ui/primitives/table';

import { Logo } from '~/components/branding/logo';

type SigningCertificateProps = {
  searchParams: {
    d: string;
  };
};

const FRIENDLY_SIGNING_REASONS = {
  ['__OWNER__']: msg`אני הבעלים של המסמך הזה`,
  ...RECIPIENT_ROLE_SIGNING_REASONS,
};

/**
 * DO NOT USE TRANS. YOU MUST USE _ FOR THIS FILE AND ALL CHILDREN COMPONENTS.
 *
 * Cannot use dynamicActivate by itself to translate this specific page and all
 * children components because `not-found.tsx` page runs and overrides the i18n.
 */
export default async function SigningCertificate({ searchParams }: SigningCertificateProps) {
  const { i18n } = await setupI18nSSR();

  const { _ } = useLingui();

  const { d } = searchParams;

  if (typeof d !== 'string' || !d) {
    return redirect('/');
  }

  const rawDocumentId = decryptSecondaryData(d);

  if (!rawDocumentId || isNaN(Number(rawDocumentId))) {
    return redirect('/');
  }

  const documentId = Number(rawDocumentId);

  const document = await getEntireDocument({
    id: documentId,
  }).catch(() => null);

  if (!document) {
    return redirect('/');
  }

  const documentLanguage = ZSupportedLanguageCodeSchema.parse(document.documentMeta?.language);

  await dynamicActivate(i18n, documentLanguage);

  const auditLogs = await getDocumentCertificateAuditLogs({
    id: documentId,
  });

  const isOwner = (email: string) => {
    return email.toLowerCase() === document.User.email.toLowerCase();
  };

  const getDevice = (userAgent?: string | null) => {
    if (!userAgent) {
      return 'לא ידוע';
    }

    const parser = new UAParser(userAgent);

    parser.setUA(userAgent);

    const result = parser.getResult();

    return `${result.os.name} - ${result.browser.name} ${result.browser.version}`;
  };

  const getAuthenticationLevel = (recipientId: number) => {
    const recipient = document.Recipient.find((recipient) => recipient.id === recipientId);

    if (!recipient) {
      return 'לא ידוע';
    }

    const extractedAuthMethods = extractDocumentAuthMethods({
      documentAuth: document.authOptions,
      recipientAuth: recipient.authOptions,
    });

    let authLevel = match(extractedAuthMethods.derivedRecipientActionAuth)
      .with('ACCOUNT', () => _(msg`אימות חשבון מחדש`))
      .with('TWO_FACTOR_AUTH', () => _(msg`אימות דו-שלבי מחדש`))
      .with('PASSKEY', () => _(msg`אימות מפתח מחדש`))
      .with('EXPLICIT_NONE', () => _(msg`דוא"ל`))
      .with(null, () => null)
      .exhaustive();

    if (!authLevel) {
      authLevel = match(extractedAuthMethods.derivedRecipientAccessAuth)
        .with('ACCOUNT', () => _(msg`אימות חשבון`))
        .with(null, () => _(msg`דוא"ל`))
        .exhaustive();
    }

    return authLevel;
  };

  const getRecipientAuditLogs = (recipientId: number) => {
    return {
      [DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT]: auditLogs[DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT].filter(
        (log) =>
          log.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT && log.data.recipientId === recipientId,
      ),
      [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED]: auditLogs[
        DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED
      ].filter(
        (log) =>
          log.type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED &&
          log.data.recipientId === recipientId,
      ),
      [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED]: auditLogs[
        DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED
      ].filter(
        (log) =>
          log.type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED &&
          log.data.recipientId === recipientId,
      ),
    };
  };

  const getRecipientSignatureField = (recipientId: number) => {
    return document.Recipient.find((recipient) => recipient.id === recipientId)?.Field.find(
      (field) => field.type === FieldType.SIGNATURE || field.type === FieldType.FREE_SIGNATURE,
    );
  };

  return (
    <div className="print-provider pointer-events-none mx-auto max-w-screen-md" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="my-8 text-2xl font-bold">{_(msg`אישור חתימה דיגיטלית`)}</h1>
      </div>

      <div className="my-8 flex-row-reverse">
        <div className="flex items-end justify-end gap-x-4">
          <p className="flex-shrink-0 text-sm font-medium print:text-xs">
            {_(msg`אישור חתימה מסופק על ידי`)}:
          </p>

          <Logo className="max-h-6 print:max-h-4" />
        </div>
      </div>
    </div>
  );
} 