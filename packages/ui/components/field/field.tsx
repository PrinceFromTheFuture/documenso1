'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import { useFieldPageCoords } from '@documenso/lib/client-only/hooks/use-field-page-coords';
import type { TFieldMetaSchema } from '@documenso/lib/types/field-meta';
import { ZFieldMetaSchema } from '@documenso/lib/types/field-meta';
import type { Field } from '@documenso/prisma/client';
import { fieldsShiftAdditions } from '@documenso/web/src/constants';

import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../primitives/card';

// Utility function to detect if text contains Hebrew
const containsHebrew = (text: string) => {
  const hebrewPattern = /[\u0590-\u05FF]/;
  return hebrewPattern.test(text);
};

/**
 * Shift adjustment factor for dynamic fields (checkbox/radio)
 * Range: 1-150 (values above 100 are possible for extra aggressive shifting)
 *
 * This controls how aggressively fields shift left based on their position:
 * - 0: No shift applied (left-align everywhere)
 * - 25-40: Minimal shift, only affects fields very close to right edge
 * - 50-70: Moderate shift, balanced alignment
 * - 80-100: Aggressive shift, strong right-alignment for right-positioned fields
 * - 100+: Extra aggressive, maximum shift (capped at 150)
 *
 * The shift is progressive: fields on the left get minimal shift,
 * fields on the right get maximum shift based on this factor.
 */
const DYNAMIC_FIELD_SHIFT_FACTOR = 10;
export type FieldRootContainerProps = {
  field: Field;
  children: React.ReactNode;
};

export type FieldContainerPortalProps = {
  field: Field;
  className?: string;
  children: React.ReactNode;
  cardClassName?: string;
};

const getCardClassNames = (
  field: Field,
  parsedField: TFieldMetaSchema | null,
  isValidating: boolean,
  checkBoxOrRadio: boolean,
  cardClassName?: string,
) => {
  const baseClasses = 'field-card-container relative z-20 h-full w-full transition-all';

  // If custom className provided, skip default conditional styling and use override
  if (cardClassName) {
    return cn(baseClasses, cardClassName);
  }

  const insertedClasses =
    'bg-primary/20 border-primary ring-primary/20 ring-offset-primary/20 ring-2 ring-offset-2 dark:shadow-none';
  const nonRequiredClasses =
    'border-yellow-200 shadow-none ring-1 ring-yellow-50 ring-offset-1 ring-offset-yellow-50 dark:border-1';
  const validatingClasses = 'border-orange-300 ring-1 ring-orange-300';
  const requiredClasses =
    'border-red-500 shadow-none ring-2 ring-red-200 ring-offset-2 ring-offset-red-200 hover:text-red-500';
  const requiredCheckboxRadioClasses = 'border-dashed border-red-500';

  if (checkBoxOrRadio) {
    return cn(
      {
        [insertedClasses]: field.inserted,
        'ring-offset-yellow-100 border-dashed border-yellow-200 ring-1 ring-yellow-50 ring-offset-1 dark:shadow-none':
          !field.inserted && !parsedField?.required,
        'shadow-none': !field.inserted,
        [validatingClasses]: !field.inserted && isValidating,
        [requiredCheckboxRadioClasses]: !field.inserted && parsedField?.required,
      },
      cardClassName,
    );
  }

  return cn(
    baseClasses,
    {
      [insertedClasses]: field.inserted,
      [nonRequiredClasses]: !field.inserted && !parsedField?.required,
      'shadow-none': !field.inserted && checkBoxOrRadio,
      [validatingClasses]: !field.inserted && isValidating,
      [requiredClasses]: !field.inserted && parsedField?.required && !checkBoxOrRadio,
    },
    cardClassName,
  );
};

function useCalculatedWidth(ref: React.RefObject<HTMLDivElement>) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const calculateWidth = () => {
      if (ref.current) {
        setWidth(ref.current.offsetWidth);
      }
    };

    // Calculate initial width
    calculateWidth();

    // Create ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(calculateWidth);
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return width;
}

export function FieldContainerPortal({
  field,
  children,
  className = '',
}: FieldContainerPortalProps) {
  const coords = useFieldPageCoords(field);
  const divRef = useRef<HTMLDivElement>(null);

  const isCheckboxOrRadioField = field.type === 'CHECKBOX' || field.type === 'RADIO';

  // Calculate the correct left offset for checkbox/radio fields
  const leftOffset = isCheckboxOrRadioField
    ? { top: fieldsShiftAdditions.top - 10, left: fieldsShiftAdditions.left - 7 }
    : { top: 0, left: 0 };

  const style = {
    top: `${coords.y + leftOffset.top}px`,
    left: `${coords.x + leftOffset.left}px`,
    position: 'absolute' as const,
    transform: 'none',
    ...(!isCheckboxOrRadioField && {
      height: `${coords.height}px`,
      width: `${coords.width}px`,
    }),
    ...(isCheckboxOrRadioField && {
      minHeight: `${coords.height}px`,
      minWidth: `${coords.width}px`,
    }),
  };

  return createPortal(
    <div className={cn('absolute z-20', className)} style={style} ref={divRef}>
      {children}
    </div>,
    document.body,
  );
}

export function FieldRootContainer({ field, children, cardClassName }: FieldContainerPortalProps) {
  const [isValidating, setIsValidating] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new MutationObserver((_mutations) => {
      if (ref.current) {
        setIsValidating(ref.current.getAttribute('data-validate') === 'true');
      }
    });

    observer.observe(ref.current, {
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const parsedField = useMemo(
    () => (field.fieldMeta ? ZFieldMetaSchema.parse(field.fieldMeta) : null),
    [field.fieldMeta],
  );
  const isCheckboxOrRadio = useMemo(
    () => parsedField?.type === 'checkbox' || parsedField?.type === 'radio',
    [parsedField],
  );
  const isReadOnlyTextField = useMemo(
    () => field.type === 'TEXT' && parsedField?.readOnly === true,
    [field.type, parsedField],
  );
  const cardClassNames = useMemo(
    () => getCardClassNames(field, parsedField, isValidating, isCheckboxOrRadio, cardClassName),
    [field, parsedField, isValidating, isCheckboxOrRadio, cardClassName],
  );
  if (isReadOnlyTextField) {
    return <FieldContainerPortal field={field}>{children}</FieldContainerPortal>;
  }
  return (
    <FieldContainerPortal field={field}>
      <Card
        id={`field-${field.id}`}
        ref={ref}
        data-inserted={field.inserted ? 'true' : 'false'}
        className={cardClassNames}
      >
        <CardContent className="text-foreground hover:shadow-primary-foreground group flex h-full w-full flex-col items-center justify-center">
          {children}
        </CardContent>
      </Card>
    </FieldContainerPortal>
  );
}
