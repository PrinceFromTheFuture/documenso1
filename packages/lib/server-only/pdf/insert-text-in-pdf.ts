import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { CAVEAT_FONT_PATH } from '../../constants/pdf';

export async function insertTextInPDF(
  pdfAsBase64: string,
  text: string,
  positionX: number,
  positionY: number,
  page = 0,
  useHandwritingFont = true,
  customFontSize?: number,
): Promise<string> {
  // Fetch the font file from the public URL.
  const fontResponse = await fetch(CAVEAT_FONT_PATH());
  const fontCaveat = await fontResponse.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfAsBase64);

  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(useHandwritingFont ? fontCaveat : StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const pdfPage = pages[page];

  const textSize = customFontSize || (useHandwritingFont ? 50 : 15);
  const textWidth = font.widthOfTextAtSize(text, textSize);
  const textHeight = font.heightAtSize(textSize);
  const fieldSize = { width: 250, height: 64 };

  // Because pdf-lib use a bottom-left coordinate system, we need to invert the y position
  // we then center the text in the middle by adding half the height of the text
  // plus the height of the field and divide the result by 2
  const invertedYPosition =
    pdfPage.getHeight() - positionY - (fieldSize.height + textHeight / 2) / 2;

  // DEBUG: Draw a marker to verify this code is running
  pdfPage.drawText('DEBUG-ALIGNMENT', {
    x: 10,
    y: pdfPage.getHeight() - 20,
    size: 10,
    color: rgb(255, 0, 0),
    font,
  });

  // Right-align the text within the field
  const rightAlignXPosition = positionX + fieldSize.width - textWidth;

  pdfPage.drawText(text, {
    x: rightAlignXPosition,
    y: invertedYPosition,
    size: textSize,
    color: rgb(255, 0, 0),
    font,
  });

  // Draw a thick red rectangle around the field for debug
  pdfPage.drawRectangle({
    x: positionX,
    y: pdfPage.getHeight() - positionY - fieldSize.height,
    width: fieldSize.width,
    height: fieldSize.height,
    borderColor: rgb(1, 0, 0),
    borderWidth: 3,
  });

  const pdfAsUint8Array = await pdfDoc.save();

  return Buffer.from(pdfAsUint8Array).toString('base64');
}
