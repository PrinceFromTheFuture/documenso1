// https://github.com/Hopding/pdf-lib/issues/20#issuecomment-412852821
import fontkit from '@pdf-lib/fontkit';
import type { PDFDocument } from 'pdf-lib';
import { RotationTypes, degrees, radiansToDegrees } from 'pdf-lib';
import { P, match } from 'ts-pattern';

import {
  CHECKBOX_RADIO_BOX_SIZE,
  CHECKBOX_RADIO_LABEL_FONT_SIZE,
  CHECKBOX_RADIO_LABEL_GAP,
  CHECKBOX_RADIO_VERTICAL_SPACING,
} from '@documenso/lib/constants/field-rendering';
import {
  DEFAULT_HANDWRITING_FONT_SIZE,
  DEFAULT_STANDARD_FONT_SIZE,
  MIN_HANDWRITING_FONT_SIZE,
  MIN_STANDARD_FONT_SIZE,
} from '@documenso/lib/constants/pdf';
import { FieldType } from '@documenso/prisma/client';
import { isSignatureFieldType } from '@documenso/prisma/guards/is-signature-field';
import type { FieldWithSignature } from '@documenso/prisma/types/field-with-signature';

import {
  ZCheckboxFieldMeta,
  ZDateFieldMeta,
  ZEmailFieldMeta,
  ZInitialsFieldMeta,
  ZNameFieldMeta,
  ZNumberFieldMeta,
  ZRadioFieldMeta,
  ZTextFieldMeta,
} from '../../types/field-meta';

// Add function to detect Hebrew text
function isHebrewText(text: string): boolean {
  const hebrewPattern = /[\u0590-\u05FF\u200f\u200e]/;
  return hebrewPattern.test(text);
}

export const insertFieldInPDF = async (pdf: PDFDocument, field: FieldWithSignature) => {
  const fontCaveat = await fetch(process.env.FONT_CAVEAT_URI).then(async (res) =>
    res.arrayBuffer(),
  );

  const fontNoto = await fetch(process.env.FONT_NOTO_SANS_URI).then(async (res) =>
    res.arrayBuffer(),
  );

  const isSignatureField = isSignatureFieldType(field.type);

  pdf.registerFontkit(fontkit);

  const pages = pdf.getPages();

  const minFontSize = isSignatureField ? MIN_HANDWRITING_FONT_SIZE : MIN_STANDARD_FONT_SIZE;
  const maxFontSize = isSignatureField ? DEFAULT_HANDWRITING_FONT_SIZE : DEFAULT_STANDARD_FONT_SIZE;

  const page = pages.at(field.page - 1);

  if (!page) {
    throw new Error(`Page ${field.page} does not exist`);
  }

  const pageRotation = page.getRotation();

  let pageRotationInDegrees = match(pageRotation.type)
    .with(RotationTypes.Degrees, () => pageRotation.angle)
    .with(RotationTypes.Radians, () => radiansToDegrees(pageRotation.angle))
    .exhaustive();

  // Round to the closest multiple of 90 degrees.
  pageRotationInDegrees = Math.round(pageRotationInDegrees / 90) * 90;

  const isPageRotatedToLandscape = pageRotationInDegrees === 90 || pageRotationInDegrees === 270;

  let { width: pageWidth, height: pageHeight } = page.getSize();

  // PDFs can have pages that are rotated, which are correctly rendered in the frontend.
  // However when we load the PDF in the backend, the rotation is applied.
  //
  // To account for this, we swap the width and height for pages that are rotated by 90/270
  // degrees. This is so we can calculate the virtual position the field was placed if it
  // was correctly oriented in the frontend.
  //
  // Then when we insert the fields, we apply a transformation to the position of the field
  // so it is rotated correctly.
  if (isPageRotatedToLandscape) {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }

  const fieldWidth = pageWidth * (Number(field.width) / 100);
  const fieldHeight = pageHeight * (Number(field.height) / 100);

  const fieldX = pageWidth * (Number(field.positionX) / 100);
  const fieldY = pageHeight * (Number(field.positionY) / 100);

  const font = await pdf.embedFont(
    isSignatureField ? fontCaveat : fontNoto,
    isSignatureField ? { features: { calt: false } } : undefined,
  );

  if (field.type === FieldType.SIGNATURE || field.type === FieldType.FREE_SIGNATURE) {
    await pdf.embedFont(fontCaveat);
  }

  await match(field)
    .with(
      {
        type: P.union(FieldType.SIGNATURE, FieldType.FREE_SIGNATURE),
      },
      async (field) => {
        if (field.Signature?.signatureImageAsBase64) {
          const image = await pdf.embedPng(field.Signature?.signatureImageAsBase64 ?? '');

          let imageWidth = image.width;
          let imageHeight = image.height;

          const scalingFactor = Math.min(fieldWidth / imageWidth, fieldHeight / imageHeight, 1);

          imageWidth = imageWidth * scalingFactor;
          imageHeight = imageHeight * scalingFactor;

          let imageX = fieldX + (fieldWidth - imageWidth) / 2;
          let imageY = fieldY + (fieldHeight - imageHeight) / 2;

          // Invert the Y axis since PDFs use a bottom-left coordinate system
          imageY = pageHeight - imageY - imageHeight;

          if (pageRotationInDegrees !== 0) {
            const adjustedPosition = adjustPositionForRotation(
              pageWidth,
              pageHeight,
              imageX,
              imageY,
              pageRotationInDegrees,
            );

            imageX = adjustedPosition.xPos;
            imageY = adjustedPosition.yPos;
          }

          page.drawImage(image, {
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
            rotate: degrees(pageRotationInDegrees),
          });
        } else {
          const signatureText = field.Signature?.typedSignature ?? '';

          // Handle multi-line signature text with per-line alignment
          const lines = signatureText.split('\n');
          const lineHeight = font.heightAtSize(maxFontSize);
          // Calculate total text block height
          const totalTextHeight = lines.length * lineHeight;
          // Start Y so the block is vertically centered
          let startY = fieldY + (fieldHeight - totalTextHeight) / 2;
          // Invert Y axis for PDF coordinate system
          startY = pageHeight - startY - lineHeight;

          lines.forEach((line, i) => {
            const lineWidth = font.widthOfTextAtSize(line, maxFontSize);
            const isHebrew = isHebrewText(line);
            // Align text according to natural direction and reverse Hebrew for RTL simulation
            const displayText = isHebrew ? line.split('').reverse().join('') : line;
            const lineX = isHebrew
              ? fieldX + fieldWidth - lineWidth // align right for Hebrew
              : fieldX; // align left for English
            // Y position for this line
            const lineY = startY - i * lineHeight;
            if (pageRotationInDegrees !== 0) {
              const adjustedPosition = adjustPositionForRotation(
                pageWidth,
                pageHeight,
                lineX,
                lineY,
                pageRotationInDegrees,
              );
              page.drawText(displayText, {
                x: adjustedPosition.xPos,
                y: adjustedPosition.yPos,
                size: maxFontSize,
                font,
                rotate: degrees(pageRotationInDegrees),
              });
            } else {
              page.drawText(displayText, {
                x: lineX,
                y: lineY,
                size: maxFontSize,
                font,
                rotate: degrees(pageRotationInDegrees),
              });
            }
          });
        }
      },
    )
    .with({ type: FieldType.CHECKBOX }, (field) => {
      const meta = ZCheckboxFieldMeta.safeParse(field.fieldMeta);
      if (!meta.success) {
        console.error(meta.error);
        throw new Error('Invalid checkbox field meta');
      }
      const values = meta.data.values?.map((item) => ({
        ...item,
        value: item.value.length > 0 ? item.value : `empty-value-${item.id}`,
      }));
      const selected = field.customText.split(',');

      // Use shared constants for consistency
      const boxWidth = CHECKBOX_RADIO_BOX_SIZE;
      const gap = CHECKBOX_RADIO_LABEL_GAP;
      const fontSize = CHECKBOX_RADIO_LABEL_FONT_SIZE;
      const verticalSpacing = CHECKBOX_RADIO_VERTICAL_SPACING;

      const isGroupHebrew = (values ?? []).some((item) => isHebrewText(item.value));

      for (const [index, item] of (values ?? []).entries()) {
        const offsetY = index * verticalSpacing;
        const checkbox = pdf.getForm().createCheckBox(`checkbox.${field.secondaryId}.${index}`);
        if (selected.includes(item.value)) {
          checkbox.check();
        }
        const labelText = item.value.includes('empty-value-') ? '' : item.value;
        const isHebrew = isGroupHebrew;
        const displayText = isHebrewText(labelText)
          ? labelText.split('').reverse().join('')
          : labelText;
        const labelWidth = font.widthOfTextAtSize(labelText, fontSize);

        let boxX, labelX;

        if (isHebrew) {
          // Hebrew (RTL) – box on right, label grows to the left
          boxX = fieldX + fieldWidth - boxWidth;
          labelX = boxX - gap - labelWidth;
        } else {
          // English (LTR) – box on left, label grows to the right
          boxX = fieldX;
          labelX = boxX + boxWidth + gap;
        }

        // Y position (inverted for PDF coordinate system)
        const boxY = pageHeight - (fieldY + offsetY);

        // Apply rotation if needed
        if (pageRotationInDegrees !== 0) {
          const adjustedLabelPos = adjustPositionForRotation(
            pageWidth,
            pageHeight,
            labelX,
            boxY,
            pageRotationInDegrees,
          );
          const adjustedBoxPos = adjustPositionForRotation(
            pageWidth,
            pageHeight,
            boxX,
            boxY,
            pageRotationInDegrees,
          );

          // Draw label
          page.drawText(displayText, {
            x: adjustedLabelPos.xPos,
            y: adjustedLabelPos.yPos,
            size: fontSize,
            font,
            rotate: degrees(pageRotationInDegrees),
          });

          // Draw box
          checkbox.addToPage(page, {
            x: adjustedBoxPos.xPos,
            y: adjustedBoxPos.yPos,
            height: boxWidth,
            width: boxWidth,
            rotate: degrees(pageRotationInDegrees),
          });
        } else {
          // Draw label
          page.drawText(displayText, {
            x: labelX,
            y: boxY,
            size: fontSize,
            font,
          });

          // Draw box
          checkbox.addToPage(page, {
            x: boxX,
            y: boxY,
            height: boxWidth,
            width: boxWidth,
          });
        }
      }
    })
    .with({ type: FieldType.RADIO }, (field) => {
      const meta = ZRadioFieldMeta.safeParse(field.fieldMeta);
      if (!meta.success) {
        console.error(meta.error);
        throw new Error('Invalid radio field meta');
      }
      const values = meta?.data.values?.map((item) => ({
        ...item,
        value: item.value.length > 0 ? item.value : `empty-value-${item.id}`,
      }));
      const selected = field.customText.split(',');

      // Use shared constants for consistency
      const boxWidth = CHECKBOX_RADIO_BOX_SIZE;
      const gap = CHECKBOX_RADIO_LABEL_GAP;
      const fontSize = CHECKBOX_RADIO_LABEL_FONT_SIZE;
      const verticalSpacing = CHECKBOX_RADIO_VERTICAL_SPACING;

      const isGroupHebrew = (values ?? []).some((item) => isHebrewText(item.value));

      for (const [index, item] of (values ?? []).entries()) {
        const offsetY = index * verticalSpacing;
        const radio = pdf.getForm().createRadioGroup(`radio.${field.secondaryId}.${index}`);
        const labelText = item.value.includes('empty-value-') ? '' : item.value;
        const isHebrew = isGroupHebrew;
        const displayText = isHebrewText(labelText)
          ? labelText.split('').reverse().join('')
          : labelText;
        const labelWidth = font.widthOfTextAtSize(labelText, fontSize);

        let boxX, labelX;

        if (isHebrew) {
          // Hebrew (RTL) – box on right, label grows to the left
          boxX = fieldX + fieldWidth - boxWidth;
          labelX = boxX - gap - labelWidth;
        } else {
          // English (LTR) – box on left, label grows to the right
          boxX = fieldX;
          labelX = boxX + boxWidth + gap;
        }

        // Y position (inverted for PDF coordinate system)
        const boxY = pageHeight - (fieldY + offsetY);

        // Apply rotation if needed
        if (pageRotationInDegrees !== 0) {
          const adjustedLabelPos = adjustPositionForRotation(
            pageWidth,
            pageHeight,
            labelX,
            boxY,
            pageRotationInDegrees,
          );
          const adjustedBoxPos = adjustPositionForRotation(
            pageWidth,
            pageHeight,
            boxX,
            boxY,
            pageRotationInDegrees,
          );

          // Draw label
          page.drawText(displayText, {
            x: adjustedLabelPos.xPos,
            y: adjustedLabelPos.yPos,
            size: fontSize,
            font,
            rotate: degrees(pageRotationInDegrees),
          });

          // Draw box
          radio.addOptionToPage(item.value, page, {
            x: adjustedBoxPos.xPos,
            y: adjustedBoxPos.yPos,
            height: boxWidth,
            width: boxWidth,
            rotate: degrees(pageRotationInDegrees),
          });
        } else {
          // Draw label
          page.drawText(displayText, {
            x: labelX,
            y: boxY,
            size: fontSize,
            font,
          });

          // Draw box
          radio.addOptionToPage(item.value, page, {
            x: boxX,
            y: boxY,
            height: boxWidth,
            width: boxWidth,
          });
        }

        if (selected.includes(item.value)) {
          radio.select(item.value);
        }
      }
    })
    .otherwise((field) => {
      const fieldMetaParsers = {
        [FieldType.TEXT]: ZTextFieldMeta,
        [FieldType.NUMBER]: ZNumberFieldMeta,
        [FieldType.DATE]: ZDateFieldMeta,
        [FieldType.EMAIL]: ZEmailFieldMeta,
        [FieldType.NAME]: ZNameFieldMeta,
        [FieldType.INITIALS]: ZInitialsFieldMeta,
      } as const;

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const Parser = fieldMetaParsers[field.type as keyof typeof fieldMetaParsers];
      const meta = Parser ? Parser.safeParse(field.fieldMeta) : null;

      const customFontSize = meta?.success && meta.data.fontSize ? meta.data.fontSize : null;
      const longestLineInTextForWidth = field.customText
        .split('\n')
        .sort((a, b) => b.length - a.length)[0];

      let fontSize = customFontSize || maxFontSize;
      let textWidth = font.widthOfTextAtSize(longestLineInTextForWidth, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      if (!customFontSize) {
        const scalingFactor = Math.min(fieldWidth / textWidth, fieldHeight / textHeight, 1);
        fontSize = Math.max(Math.min(fontSize * scalingFactor, maxFontSize), minFontSize);
      }

      textWidth = font.widthOfTextAtSize(longestLineInTextForWidth, fontSize);

      // For all text fields, align each line: right if Hebrew, left otherwise
      const lines = field.customText.split('\n');
      const lineHeight = font.heightAtSize(fontSize);
      const totalTextHeight = lines.length * lineHeight;
      let startY = fieldY + (fieldHeight - totalTextHeight) / 2;
      startY = pageHeight - startY - lineHeight;
      lines.forEach((line, i) => {
        const isHebrew = isHebrewText(line);
        // Reverse Hebrew text for RTL simulation in PDF
        const displayText = isHebrew ? line.split('').reverse().join('') : line;
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        const lineX = isHebrew
          ? fieldX + fieldWidth - lineWidth // align right
          : fieldX; // align left
        const lineY = startY - i * lineHeight;
        if (pageRotationInDegrees !== 0) {
          const adjustedPosition = adjustPositionForRotation(
            pageWidth,
            pageHeight,
            lineX,
            lineY,
            pageRotationInDegrees,
          );
          page.drawText(displayText, {
            x: adjustedPosition.xPos,
            y: adjustedPosition.yPos,
            size: fontSize,
            font,
            rotate: degrees(pageRotationInDegrees),
          });
        } else {
          page.drawText(displayText, {
            x: lineX,
            y: lineY,
            size: fontSize,
            font,
            rotate: degrees(pageRotationInDegrees),
          });
        }
      });
    });

  return pdf;
};

const adjustPositionForRotation = (
  pageWidth: number,
  pageHeight: number,
  xPos: number,
  yPos: number,
  pageRotationInDegrees: number,
) => {
  if (pageRotationInDegrees === 270) {
    xPos = pageWidth - xPos;
    [xPos, yPos] = [yPos, xPos];
  }

  if (pageRotationInDegrees === 90) {
    yPos = pageHeight - yPos;
    [xPos, yPos] = [yPos, xPos];
  }

  // Invert all the positions since it's rotated by 180 degrees.
  if (pageRotationInDegrees === 180) {
    xPos = pageWidth - xPos;
    yPos = pageHeight - yPos;
  }

  return {
    xPos,
    yPos,
  };
};
