import { ZRadioFieldMeta } from '@documenso/lib/types/field-meta';
import type { TRadioFieldMeta } from '@documenso/lib/types/field-meta';
import { Label } from '@documenso/ui/primitives/label';
import { RadioGroup, RadioGroupItem } from '@documenso/ui/primitives/radio-group';

import { FieldIcon } from '../field-icon';
import type { TDocumentFlowFormSchema } from '../types';

type Field = TDocumentFlowFormSchema['fields'][0];

export type RadioFieldProps = {
  field: Field;
};

export const RadioField = ({ field }: RadioFieldProps) => {
  let parsedFieldMeta: TRadioFieldMeta | undefined = undefined;

  if (field.fieldMeta) {
    parsedFieldMeta = ZRadioFieldMeta.parse(field.fieldMeta);
  }

  const values = parsedFieldMeta?.values || [{ checked: false, value: '' }];
  const defaultValue = values.find((v) => v.checked)?.value || '';
  const hasValues = values.some((item) => item.value && item.value.trim() !== '');

  return (
    <div
      data-field-id={field.nativeId}
      style={{
        width: '100%',
        height: 'fit-content',
        padding: '0.5rem',
      }}
    >
      {!hasValues && (
        <FieldIcon fieldMeta={parsedFieldMeta} type={field.type} signerEmail={field.signerEmail} />
      )}

      {hasValues && (
        <RadioGroup
          value={defaultValue}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '100%',
          }}
        >
          {values.map((item, index) => {
            const itemKey = `${field.nativeId}-radio-${index}`;
            const itemHasHebrew = /[\u0590-\u05FF\u200f\u200e]/.test(item.value || '');

            if (itemHasHebrew) {
              // Hebrew: radio on the right, label on the left, container stretched to the left
              return (
                <div
                  key={itemKey}
                  data-testid="field-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    direction: 'rtl',
                    width: '100%',
                  }}
                >
                  <RadioGroupItem
                    value={item.value}
                    id={itemKey}
                    checked={item.checked}
                    className="border-muted-foreground/40 h-4 w-4 shrink-0 rounded-full"
                  />
                  <Label
                    htmlFor={itemKey}
                    className="text-muted-foreground cursor-pointer"
                    style={{
                      textAlign: 'right',
                      flex: 1,
                    }}
                    dir="rtl"
                  >
                    {item.value}
                  </Label>
                </div>
              );
            } else {
              // English: radio first, then label (radio on the left)
              return (
                <div
                  key={itemKey}
                  data-testid="field-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    direction: 'ltr',
                    width: '100%',
                  }}
                >
                  <RadioGroupItem
                    value={item.value}
                    id={itemKey}
                    checked={item.checked}
                    className="border-muted-foreground/40 h-4 w-4 shrink-0 rounded-full"
                  />
                  <Label
                    htmlFor={itemKey}
                    className="text-muted-foreground cursor-pointer"
                    style={{
                      textAlign: 'left',
                      flex: 1,
                    }}
                    dir="ltr"
                  >
                    {item.value}
                  </Label>
                </div>
              );
            }
          })}
        </RadioGroup>
      )}
    </div>
  );
};
