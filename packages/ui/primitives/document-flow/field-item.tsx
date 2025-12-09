'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Caveat } from 'next/font/google';

import { CopyPlus, Settings2, Trash } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { match } from 'ts-pattern';

import { PDF_VIEWER_PAGE_SELECTOR } from '@documenso/lib/constants/pdf-viewer';
import type { TFieldMetaSchema } from '@documenso/lib/types/field-meta';
import { ZCheckboxFieldMeta, ZRadioFieldMeta } from '@documenso/lib/types/field-meta';

import { useSignerColors } from '../../lib/signer-colors';
import { cn } from '../../lib/utils';
import { CheckboxField } from './advanced-fields/checkbox';
import { RadioField } from './advanced-fields/radio';
import { FieldIcon } from './field-icon';
import type { TDocumentFlowFormSchema } from './types';

type Field = TDocumentFlowFormSchema['fields'][0];

const fontCaveat = Caveat({
  weight: ['500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
});

export type FieldItemProps = {
  field: Field;
  passive?: boolean;
  disabled?: boolean;
  minHeight?: number;
  minWidth?: number;
  defaultHeight?: number;
  defaultWidth?: number;
  onResize?: (_node: HTMLElement) => void;
  onMove?: (_node: HTMLElement) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onAdvancedSettings?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  recipientIndex?: number;
  hideRecipients?: boolean;
  hasErrors?: boolean;
};

export const FieldItem = ({
  field,
  passive,
  disabled,
  minHeight,
  minWidth,
  defaultHeight,
  defaultWidth,
  onResize,
  onMove,
  onRemove,
  onDuplicate,
  onFocus,
  onBlur,
  onAdvancedSettings,
  recipientIndex = 0,
  hideRecipients = false,
  hasErrors,
}: FieldItemProps) => {
  const [active, setActive] = useState(false);
  const [coords, setCoords] = useState({
    pageX: 0,
    pageY: 0,
    pageHeight: defaultHeight || 0,
    pageWidth: defaultWidth || 0,
  });
  const [_settingsActive, setSettingsActive] = useState(false);
  const [elementDimensions, setElementDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const $el = useRef<HTMLDivElement | null>(null);

  const signerStyles = useSignerColors(recipientIndex);

  const _advancedField = [
    'NUMBER',
    'RADIO',
    'CHECKBOX',
    'DROPDOWN',
    'TEXT',
    'INITIALS',
    'EMAIL',
    'DATE',
    'NAME',
  ].includes(field.type);

  const calculateCoords = useCallback(() => {
    const $page = document.querySelector<HTMLElement>(
      `${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`,
    );

    if (!$page) {
      return;
    }

    const { height, width } = $page.getBoundingClientRect();

    const top = $page.getBoundingClientRect().top + window.scrollY;
    const left = $page.getBoundingClientRect().left + window.scrollX;

    // X and Y are percentages of the page's height and width
    const pageX = (field.pageX / 100) * width + left;
    const pageY = (field.pageY / 100) * height + top;

    const pageHeight = (field.pageHeight / 100) * height;
    const pageWidth = (field.pageWidth / 100) * width;

    setCoords({
      pageX: pageX,
      pageY: pageY,
      pageHeight: pageHeight,
      pageWidth: pageWidth,
    });
  }, [field.pageHeight, field.pageNumber, field.pageWidth, field.pageX, field.pageY]);

  useEffect(() => {
    calculateCoords();
  }, [calculateCoords]);

  useEffect(() => {
    const onResize = () => {
      calculateCoords();
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [calculateCoords]);

  useEffect(() => {
    const onClickOutsideOfField = (event: MouseEvent) => {
      const isOutsideOfField = $el.current && !event.composedPath().includes($el.current);

      setSettingsActive((active) => {
        if (active && isOutsideOfField) {
          return false;
        }

        return active;
      });

      if (isOutsideOfField) {
        onBlur?.();
      }
    };

    document.body.addEventListener('click', onClickOutsideOfField);

    return () => {
      document.body.removeEventListener('click', onClickOutsideOfField);
    };
  }, [onBlur]);

  const hasFieldMetaValues = (
    fieldType: string,
    fieldMeta: TFieldMetaSchema,
    parser: typeof ZCheckboxFieldMeta | typeof ZRadioFieldMeta,
  ) => {
    if (field.type !== fieldType || !fieldMeta) {
      return false;
    }

    const parsedMeta = parser?.parse(fieldMeta);
    return parsedMeta && parsedMeta.values && parsedMeta.values.length > 0;
  };

  const checkBoxHasValues = useMemo(
    () => hasFieldMetaValues('CHECKBOX', field.fieldMeta, ZCheckboxFieldMeta),
    [field.fieldMeta],
  );
  const radioHasValues = useMemo(
    () => hasFieldMetaValues('RADIO', field.fieldMeta, ZRadioFieldMeta),
    [field.fieldMeta],
  );

  const fixedSize = checkBoxHasValues || radioHasValues;

  useEffect(() => {
    if ((field.type === 'CHECKBOX' || field.type === 'RADIO') && $el.current) {
      const rect = $el.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setElementDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    } else {
      setElementDimensions(null);
    }
  }, [field.type, field.fieldMeta]);

  return createPortal(
    <Rnd
      key={coords.pageX + coords.pageY + coords.pageHeight + coords.pageWidth}
      className={cn('group z-20', {
        'pointer-events-none': passive,
        'pointer-events-none cursor-not-allowed opacity-75': disabled,
        'z-10': !active || disabled,
      })}
      minHeight={minHeight || (fixedSize ? 0 : 40)}
      minWidth={minWidth || (fixedSize ? 0 : 118)}
      default={{
        x: coords.pageX,
        y: coords.pageY,
        height:
          (field.type === 'CHECKBOX' || field.type === 'RADIO') && elementDimensions
            ? elementDimensions.height
            : coords.pageHeight,
        width:
          (field.type === 'CHECKBOX' || field.type === 'RADIO') && elementDimensions
            ? elementDimensions.width
            : coords.pageWidth,
      }}
      bounds={`${PDF_VIEWER_PAGE_SELECTOR}[data-page-number="${field.pageNumber}"]`}
      onDragStart={() => setActive(true)}
      onResizeStart={() => setActive(true)}
      enableResizing={{
        top: !fixedSize,
        right: !fixedSize,
        bottom: !fixedSize,
        left: !fixedSize,
        topRight: !fixedSize,
        bottomRight: !fixedSize,
        bottomLeft: !fixedSize,
        topLeft: !fixedSize,
      }}
      onResizeStop={(_e, _d, ref) => {
        setActive(false);
        onResize?.(ref);
      }}
      onDragStop={(_e, d) => {
        setActive(false);
        onMove?.(d.node);
      }}
    >
      <div
        className={cn(
          'relative flex bg-white',
          fixedSize
            ? 'h-fit min-h-fit w-fit min-w-fit items-start'
            : 'h-full w-full items-center justify-center',
          !hasErrors && signerStyles.default.base,
          !hasErrors && signerStyles.default.fieldItem,
          {
            'rounded-lg border border-red-400 bg-red-400/20 shadow-[0_0_0_5px_theme(colors.red.500/10%),0_0_0_2px_theme(colors.red.500/40%),0_0_0_0.5px_theme(colors.red.500)]':
              hasErrors,
          },
          !fixedSize && '[container-type:size]',
        )}
        style={
          fixedSize
            ? {
                width: 'fit-content',
                height: 'fit-content',
                minWidth: 'fit-content',
                minHeight: 'fit-content',
                maxWidth: 'none',
                maxHeight: 'none',
              }
            : {}
        }
        data-error={hasErrors ? 'true' : undefined}
        onClick={() => {
          setSettingsActive((prev) => !prev);
          onFocus?.();
        }}
        ref={$el}
        data-field-id={field.nativeId}
      >
        {match(field.type)
          .with('CHECKBOX', () => (
            <CheckboxField key={`field-item-${field.nativeId}`} field={field} />
          ))
          .with('RADIO', () => <RadioField field={field} />)
          .with('TEXT', () => {
            let value = '';
            let isDefault = false;
            if (field.type === 'TEXT' && field.fieldMeta && typeof field.fieldMeta === 'object') {
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
                  'flex h-full w-full flex-col justify-start',
                  isDefault
                    ? 'items-end text-right'
                    : isHebrew
                      ? 'items-end text-right'
                      : 'items-start text-left',
                )}
                dir={isDefault ? 'rtl' : isHebrew ? 'rtl' : 'ltr'}
                style={{ height: '100%', width: '100%' }}
              >
                <span className="block w-full whitespace-pre-line break-words bg-red-500">
                  {value}
                </span>
              </div>
            );
          })
          .otherwise(() => (
            <FieldIcon
              fieldMeta={field.fieldMeta}
              type={field.type}
              signerEmail={field.signerEmail}
              fontCaveatClassName={fontCaveat.className}
            />
          ))}

        {!hideRecipients && (
          <div className="absolute -right-5 top-0 z-20 hidden h-full w-5 items-center justify-center group-hover:flex">
            <div
              className={cn(
                'flex h-5 w-5 flex-col items-center justify-center rounded-r-md text-[0.5rem] font-bold text-white',
                signerStyles.default.fieldItemInitials,
                {
                  '!opacity-50': disabled || passive,
                },
              )}
            >
              {(field.signerEmail?.charAt(0)?.toUpperCase() ?? '') +
                (field.signerEmail?.charAt(1)?.toUpperCase() ?? '')}
            </div>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="mt-1 flex justify-center">
          <div className="dark:bg-background group flex items-center justify-evenly gap-x-1 rounded-md border bg-gray-900 p-0.5">
            {field.type !== 'SIGNATURE' && field.type !== 'FREE_SIGNATURE' && (
              <button
                className="dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
                onClick={onAdvancedSettings}
                onTouchEnd={onAdvancedSettings}
                onTouchStart={onAdvancedSettings}
              >
                <Settings2 className="h-3 w-3" />
              </button>
            )}

            <button
              className="dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
              onClick={onDuplicate}
              onTouchEnd={onDuplicate}
              onTouchStart={onDuplicate}
            >
              <CopyPlus className="h-3 w-3" />
            </button>

            <button
              className="dark:text-muted-foreground/50 dark:hover:text-muted-foreground dark:hover:bg-foreground/10 rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-100"
              onClick={onRemove}
              onTouchEnd={onRemove}
              onTouchStart={onRemove}
            >
              <Trash className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </Rnd>,
    document.body,
  );
};
