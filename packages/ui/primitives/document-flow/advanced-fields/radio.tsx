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

// Function to detect if text contains Hebrew characters
function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

export const RadioField = ({ field }: RadioFieldProps) => {
  let parsedFieldMeta: TRadioFieldMeta | undefined = undefined;

  if (field.fieldMeta) {
    parsedFieldMeta = ZRadioFieldMeta.parse(field.fieldMeta);
  }

  if (parsedFieldMeta && (!parsedFieldMeta.values || parsedFieldMeta.values.length === 0)) {
    return (
      <FieldIcon fieldMeta={field.fieldMeta} type={field.type} signerEmail={field.signerEmail} />
    );
  }

  return (
    <div className="flex h-full w-full items-start justify-start">
      {!parsedFieldMeta?.values ? (
        <FieldIcon fieldMeta={field.fieldMeta} type={field.type} signerEmail={field.signerEmail} />
      ) : (
        <div className="flex h-full w-full flex-col justify-start">
          <RadioGroup className="flex h-full w-full flex-col justify-start">
            {parsedFieldMeta.values?.map((item, index) => {
              const isRTL = isHebrew(item.value);
              
              if (isRTL) {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 w-full"
                    style={{ direction: 'rtl', justifyContent: 'flex-start', flexDirection: 'row-reverse' }}
                  >
                    <Label
                      htmlFor={`option-${index}`}
                      className="text-[clamp(0.425rem,25cqw,0.825rem)] flex-1"
                      style={{ textAlign: 'right', paddingRight: '0.25rem' }}
                      dir="rtl"
                    >
                      {item.value}
                    </Label>
                    <RadioGroupItem
                      className="pointer-events-none h-[clamp(0.425rem,25cqw,0.825rem)] w-[clamp(0.425rem,25cqw,0.825rem)] border border-black flex-shrink-0"
                      value={item.value}
                      id={`option-${index}`}
                      checked={item.checked}
                    />
                  </div>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 w-full"
                    style={{ direction: 'ltr', justifyContent: 'flex-start' }}
                  >
                    <RadioGroupItem
                      className="pointer-events-none h-[clamp(0.425rem,25cqw,0.825rem)] w-[clamp(0.425rem,25cqw,0.825rem)] border border-black"
                      value={item.value}
                      id={`option-${index}`}
                      checked={item.checked}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="text-[clamp(0.425rem,25cqw,0.825rem)]"
                      style={{ width: '100%' }}
                    >
                      {item.value}
                    </Label>
                  </div>
                );
              }
            })}
          </RadioGroup>
        </div>
      )}
    </div>
  );
};
