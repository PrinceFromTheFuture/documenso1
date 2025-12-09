/**
 * Shared constants for checkbox and radio field rendering
 * These values MUST be used consistently across:
 * - Document editor
 * - Signing page
 * - PDF export
 *
 * This ensures pixel-perfect positioning across all views
 */

/**
 * Box dimensions for checkbox and radio buttons
 * In pixels for web, in points for PDF (1px = 1pt for our purposes)
 */
export const CHECKBOX_RADIO_BOX_SIZE = 12;

/**
 * Vertical spacing between multiple checkbox/radio items
 * In pixels for web, in points for PDF
 */
export const CHECKBOX_RADIO_VERTICAL_SPACING = 16;

/**
 * Horizontal gap between the box and its label
 * In pixels for web, in points for PDF
 */
export const CHECKBOX_RADIO_LABEL_GAP = 6;

/**
 * Font size for checkbox/radio labels
 * In pixels for web, in points for PDF
 */
export const CHECKBOX_RADIO_LABEL_FONT_SIZE = 12;

/**
 * Tailwind CSS classes that match the above constants
 * Use these in React components to ensure consistency
 */
export const CHECKBOX_RADIO_CLASSES = {
  /** Box size: 12px (w-3 h-3) */
  boxSize: 'h-3 w-3',
  /** Vertical spacing: 16px (gap-y-4) */
  verticalGap: 'gap-y-4',
  /** Horizontal spacing: 6px (gap-x-1.5) */
  horizontalGap: 'gap-x-1.5',
  /** Label font size: 12px (text-xs) */
  labelFontSize: 'text-sm',
} as const;

/**
 * Padding for RTL (Hebrew) labels
 * Applied to the right side to maintain consistent spacing
 */
export const CHECKBOX_RADIO_RTL_LABEL_PADDING = 4; // 0.25rem in Tailwind
