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

// Function to detect if text contains Hebrew characters
function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

export const CheckboxField = ({ field }: CheckboxFieldProps) => {
  let parsedFieldMeta: TCheckboxFieldMeta | undefined = undefined;

  if (field.fieldMeta) {
    parsedFieldMeta = ZCheckboxFieldMeta.parse(field.fieldMeta);
  }

  if (parsedFieldMeta && (!parsedFieldMeta.values || parsedFieldMeta.values.length === 0)) {
    return (
      <FieldIcon fieldMeta={field.fieldMeta} type={field.type} signerEmail={field.signerEmail} />
    );
  }

  return (
    <div className="flex h-full w-full items-start justify-start" style={{ marginRight: 'auto' }}>
      {!parsedFieldMeta?.values ? (
        <FieldIcon fieldMeta={field.fieldMeta} type={field.type} signerEmail={field.signerEmail} />
      ) : (
        <div className="flex h-full w-full flex-col justify-start items-start">
          {parsedFieldMeta.values.map((item: { value: string; checked: boolean }, index: number) => {
            const isRTL = isHebrew(item.value);
            return (
              <div 
                key={index}
                className="flex items-center w-full justify-start"
                style={isRTL 
                  ? { gap: '0.25rem', direction: 'rtl', justifyContent: 'flex-end' }
                  : { gap: '0.25rem', direction: 'ltr', justifyContent: 'flex-start' }
                }
              >
                {isRTL ? (
                  <>
                    <Checkbox
                      className="h-[clamp(0.425rem,25cqw,0.825rem)] w-[clamp(0.425rem,25cqw,0.825rem)] flex-shrink-0 border border-black"
                      checkClassName="text-white"
                      id={`checkbox-${index}`}
                      checked={item.checked}
                    />
                    <Label
                      htmlFor={`checkbox-${index}`}
                      className="text-[clamp(0.425rem,25cqw,0.825rem)] flex-1"
                      style={{ textAlign: 'right', width: '100%', marginLeft: 'auto' }}
                    >
                      {item.value}
                    </Label>
                  </>
                ) : (
                  <>
                    <Checkbox
                      className="h-[clamp(0.425rem,25cqw,0.825rem)] w-[clamp(0.425rem,25cqw,0.825rem)] flex-shrink-0 border border-black"
                      checkClassName="text-white"
                      id={`checkbox-${index}`}
                      checked={item.checked}
                    />
                    <Label
                      htmlFor={`checkbox-${index}`}
                      className="text-[clamp(0.425rem,25cqw,0.825rem)] flex-1"
                      style={{ textAlign: 'left', width: '100%' }}
                      dir="ltr"
                    >
                      {item.value}
                    </Label>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
