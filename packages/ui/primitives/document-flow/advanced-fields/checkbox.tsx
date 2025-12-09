import { ZCheckboxFieldMeta } from '@documenso/lib/types/field-meta';
import type { TCheckboxFieldMeta } from '@documenso/lib/types/field-meta';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { Label } from '@documenso/ui/primitives/label';

import { FieldIcon } from '../field-icon';
import type { TDocumentFlowFormSchema } from '../types';

type Field = TDocumentFlowFormSchema['fields'][0];

export type CheckboxFieldProps = {
  field: Field;
};

export const CheckboxField = ({ field }: CheckboxFieldProps) => {
  let parsedFieldMeta: TCheckboxFieldMeta | undefined = undefined;

  if (field.fieldMeta) {
    parsedFieldMeta = ZCheckboxFieldMeta.parse(field.fieldMeta);
  }

  const values = parsedFieldMeta?.values || [{ checked: false, value: '' }];
  const hasValues = values.some((item) => item.value && item.value.trim() !== '');
  const hasHebrew = values.some((item) => /[\u0590-\u05FF\u200f\u200e]/.test(item.value || ''));

  return (
    <div
      className="checkbox-field-container"
      data-field-id={field.nativeId}
      style={{
        padding: '0.5rem',
        margin: '0',
        width: '100%',
        height: 'fit-content',
        direction: hasHebrew ? 'rtl' : 'ltr',
        minWidth: 'max-content',
      }}
    >
      {!hasValues && (
        <FieldIcon fieldMeta={parsedFieldMeta} type={field.type} signerEmail={field.signerEmail} />
      )}

      {hasValues && (
        <div
          data-testid="field-content"
          className=""
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',

            width: '100%',
            minWidth: 'max-content',
            alignItems: hasHebrew ? 'flex-start' : 'flex-start',
          }}
        >
          {values.map((item, index) => {
            const itemKey = `${field.nativeId}-checkbox-${index}`;

            if (hasHebrew) {
              // Hebrew: checkbox on the right, label on the left
              return (
                <div
                  key={itemKey}
                  data-testid="field-row"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexDirection: 'row',
                    direction: 'rtl',
                    minWidth: 'max-content',
                    maxWidth: '100%',
                  }}
                >
                  <Checkbox
                    id={itemKey}
                    className="border-muted-foreground/40 h-4 w-4 shrink-0 rounded-sm"
                    checkClassName="fill-muted-foreground/40"
                    checked={item.checked}
                    disabled
                  />
                  <Label
                    htmlFor={itemKey}
                    className="text-black"
                    style={{
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                    }}
                    dir="rtl"
                  >
                    {item.value}
                  </Label>
                </div>
              );
            } else {
              // English: checkbox first, then label (checkbox on the left)
              return (
                <div
                  key={itemKey}
                  data-testid="field-row"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexDirection: 'row',
                    direction: 'ltr',
                    minWidth: 'max-content',
                    maxWidth: '100%',
                  }}
                >
                  <Checkbox
                    id={itemKey}
                    className="border-muted-foreground/40 h-4 w-4 shrink-0 rounded-sm"
                    checkClassName="fill-muted-foreground/40"
                    checked={item.checked}
                    disabled
                  />
                  <Label
                    htmlFor={itemKey}
                    className="text-black"
                    style={{
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                    }}
                    dir="ltr"
                  >
                    {item.value}
                  </Label>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
