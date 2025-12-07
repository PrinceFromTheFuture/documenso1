'use client';

import { Caveat } from 'next/font/google';

import { useLingui } from '@lingui/react';
import type { Prisma } from '@prisma/client';
import { createPortal } from 'react-dom';
import { match } from 'ts-pattern';

import { useFieldPageCoords } from '@documenso/lib/client-only/hooks/use-field-page-coords';
import type { TCheckboxFieldMeta } from '@documenso/lib/types/field-meta';
import type { TFieldMetaSchema as FieldMetaType } from '@documenso/lib/types/field-meta';
import { FieldType } from '@documenso/prisma/client';

import { cn } from '../../lib/utils';
import { Card, CardContent } from '../card';
import { CheckboxField } from './advanced-fields/checkbox';
import { RadioField } from './advanced-fields/radio';
import { FieldIcon } from './field-icon';
import type { TDocumentFlowFormSchema } from './types';

const fontCaveat = Caveat({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
});

export type ShowFieldItemProps = {
  field: Prisma.FieldGetPayload<null>;
  recipients: Prisma.RecipientGetPayload<null>[];
};

export const ShowFieldItem = ({ field, recipients }: ShowFieldItemProps) => {
  const { _ } = useLingui();

  const coords = useFieldPageCoords(field);

  const signerEmail =
    recipients.find((recipient) => recipient.id === field.recipientId)?.email ?? '';

  // Detect if content is Hebrew or English for checkbox fields
  let languageClass = '';
  if (
    field.type === 'CHECKBOX' &&
    field.fieldMeta &&
    typeof field.fieldMeta === 'object' &&
    'values' in field.fieldMeta
  ) {
    const checkboxMeta = field.fieldMeta as TCheckboxFieldMeta;
    const values = checkboxMeta.values ?? [];
    const hasHebrew = values.some((item) => /[\u0590-\u05FF\u200f\u200e]/.test(item.value || ''));
    const hasEnglish = values.some((item) => /^[a-zA-Z\s]+$/.test(item.value?.trim() || ''));

    if (hasHebrew && !hasEnglish) {
      languageClass = 'checkbox-field-hebrew';
    } else if (hasEnglish && !hasHebrew) {
      languageClass = 'checkbox-field-english';
    } else {
      languageClass = 'checkbox-field-mixed';
    }
  }

  // זיהוי עברית בתוכן (unused but kept for potential future use)
  // const isHebrew = field.fieldMeta && typeof field.fieldMeta === 'object' && Object.values(field.fieldMeta).some(v => typeof v === 'string' && /[\u0590-\u05FF]/.test(v));

  return createPortal(
    <>
      <div
        style={{
          top: `${coords.y}px`,
          left: `${coords.x}px`,
          height: `${coords.height}px`,
          width: field.type === 'CHECKBOX' ? 'auto' : `${coords.width}px`,
          minWidth:
            field.type === 'CHECKBOX'
              ? field.type === 'CHECKBOX' && languageClass === 'checkbox-field-hebrew'
                ? `${coords.width}px`
                : `${coords.width}px`
              : 'auto',
          overflow: field.type === 'CHECKBOX' ? 'visible' : 'hidden',
          maxWidth: field.type === 'CHECKBOX' ? 'none' : '100%',
          position: 'absolute',
          transform: 'none',
        }}
        className={cn('absolute z-10', {
          'pointer-events-none opacity-75': !(
            field.type === 'CHECKBOX' &&
            (languageClass === 'checkbox-field-english' || languageClass === 'checkbox-field-mixed')
          ),
          'pointer-events-auto opacity-100':
            field.type === 'CHECKBOX' &&
            (languageClass === 'checkbox-field-english' ||
              languageClass === 'checkbox-field-mixed'),
        })}
      >
        <Card
          className={cn(
            'h-full [container-type:size]',
            languageClass,
            field.type === 'CHECKBOX' && languageClass === 'checkbox-field-hebrew'
              ? 'w-full border-none bg-transparent p-0 shadow-none'
              : field.type === 'CHECKBOX'
                ? 'w-full border-none bg-transparent p-0 shadow-none'
                : 'bg-background w-full',
          )}
        >
          <CardContent
            className={cn(
              'flex h-full w-full flex-col text-[clamp(0.575rem,1.8cqw,1.2rem)] leading-none',
              field.type === 'CHECKBOX' && languageClass === 'checkbox-field-hebrew'
                ? 'text-foreground m-0 p-0'
                : field.type === 'CHECKBOX'
                  ? 'text-foreground m-0 items-center justify-center p-0'
                  : 'text-muted-foreground/50 items-center justify-center p-0',
              field.type === FieldType.SIGNATURE && fontCaveat.className,
            )}
          >
            {match(field.type)
              .with('CHECKBOX', () => (
                <div
                  className={cn(
                    'relative m-0 flex h-fit min-h-fit items-end p-0',
                    languageClass === 'checkbox-field-english'
                      ? 'w-full justify-end'
                      : languageClass === 'checkbox-field-hebrew'
                        ? 'w-full justify-start'
                        : 'w-fit min-w-fit',
                  )}
                  style={
                    languageClass === 'checkbox-field-hebrew'
                      ? { width: '100%', maxWidth: '100%' }
                      : {}
                  }
                >
                  <CheckboxField
                    key={`show-field-${field.id}`}
                    field={
                      {
                        formId: String(field.id),
                        nativeId: field.id,
                        type: field.type,
                        signerEmail: signerEmail,
                        pageNumber: field.page,
                        pageX: field.positionX,
                        pageY: field.positionY,
                        pageWidth: field.width,
                        pageHeight: field.height,
                        fieldMeta: field.fieldMeta as FieldMetaType,
                      } as TDocumentFlowFormSchema['fields'][0]
                    }
                  />
                </div>
              ))
              .with('RADIO', () => (
                <div className="relative flex h-fit min-h-fit w-fit min-w-fit items-start rounded-lg bg-white p-0.5">
                  <RadioField
                    field={
                      {
                        formId: String(field.id),
                        nativeId: field.id,
                        type: field.type,
                        signerEmail: signerEmail,
                        pageNumber: field.page,
                        pageX: field.positionX,
                        pageY: field.positionY,
                        pageWidth: field.width,
                        pageHeight: field.height,
                        fieldMeta: field.fieldMeta as FieldMetaType,
                      } as TDocumentFlowFormSchema['fields'][0]
                    }
                  />
                </div>
              ))
              .with('TEXT', () => {
                let value = '';
                let isDefault = false;
                if (field.fieldMeta && typeof field.fieldMeta === 'object') {
                  if (
                    'text' in field.fieldMeta &&
                    typeof field.fieldMeta.text === 'string' &&
                    field.fieldMeta.text
                  ) {
                    value = field.fieldMeta.text;
                  } else if (
                    'label' in field.fieldMeta &&
                    typeof field.fieldMeta.label === 'string' &&
                    field.fieldMeta.label
                  ) {
                    value = field.fieldMeta.label;
                  } else {
                    value = 'טקסט';
                    isDefault = true;
                  }
                }
                const isHebrew = /^[\u0590-\u05FF]/.test(value.trim());
                return (
                  <div
                    className={cn(
                      'relative flex h-full w-full flex-col justify-start rounded-lg bg-white p-0.5',
                      isDefault
                        ? 'items-end text-right'
                        : isHebrew
                          ? 'items-end text-right'
                          : 'items-start text-left',
                    )}
                    dir={isDefault ? 'rtl' : isHebrew ? 'rtl' : 'ltr'}
                    style={{ minWidth: '100px', minHeight: '50px', width: '100%', height: '100%' }}
                  >
                    <span className="block w-full whitespace-pre-line break-words">{value}</span>
                  </div>
                );
              })
              .otherwise(() => (
                <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-white p-0">
                  <FieldIcon
                    fieldMeta={field.fieldMeta as FieldMetaType}
                    type={field.type}
                    signerEmail={signerEmail}
                    fontCaveatClassName={fontCaveat.className}
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </>,
    document.body,
  );
};
