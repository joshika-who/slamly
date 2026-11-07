import { getBookResponses } from './responseService';

export const MAX_EXPORT_RESPONSES = 500;
export const EXPORT_PAGE_BATCH_SIZE = 25;

/**
 * Pastel scrapbook colour palette matching variables.css (RGB tuples for jsPDF).
 * Uses dark warm ink (#261F1C) on light cream and pastel fills for high contrast.
 */
export const PDF_THEME_PALETTE = {
  pink: {
    label: 'Pastel Rose',
    fill: [250, 210, 221],      // #FAD2DD
    softFill: [254, 240, 244],  // Soft rose tint for response headers
    accent: [200, 67, 102],     // #C84366
    tape: [247, 182, 198],
  },
  lavender: {
    label: 'Soft Lavender',
    fill: [228, 218, 246],      // #E4DAF6
    softFill: [245, 241, 252],
    accent: [83, 58, 139],      // #533A8B
    tape: [212, 195, 243],
  },
  peach: {
    label: 'Warm Peach',
    fill: [253, 224, 198],      // #FDE0C6
    softFill: [254, 244, 234],
    accent: [179, 80, 29],      // #B3501D
    tape: [252, 204, 168],
  },
  sage: {
    label: 'Sage Leaf',
    fill: [213, 232, 218],      // #D5E8DA
    softFill: [240, 247, 242],
    accent: [35, 87, 57],       // #235739
    tape: [189, 222, 198],
  },
};

const INK_DARK = [38, 31, 28];       // #261F1C
const INK_MUTED = [82, 66, 58];      // #52423A
const INK_SOFT = [107, 88, 78];      // #6B584E
const PAPER_CREAM = [255, 253, 249]; // #FFFDF9
const PAPER_WARM = [253, 248, 242];  // #FDF8F2
const BORDER_TAN = [220, 208, 194];  // #DCD0C2

/**
 * Normalizes common typographic punctuation (smart quotes, dashes, ellipsis, bullets)
 * into standard ASCII equivalents so normal prose never triggers false font warnings.
 */
export function normalizeTypographicPunctuation(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/\u00A0/g, ' ');
}

/**
 * Checks whether a single Unicode code point can be rendered by jsPDF's built-in
 * Latin-1 (WinAnsiEncoding) standard fonts (`helvetica` / `times`).
 * Supports:
 * - Standard ASCII printable characters (0x20 - 0x7E)
 * - Newlines and tabs (\n, \r, \t)
 * - Latin-1 Supplement (0xA0 - 0xFF, e.g., é, è, ê, ñ, ç, ü, ö, á, í, ó, ú)
 */
function isSupportedLatinCodePoint(codePoint) {
  if (codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d) return true;
  if (codePoint >= 0x20 && codePoint <= 0x7e) return true;
  if (codePoint >= 0xa0 && codePoint <= 0xff) return true;
  return false;
}

/**
 * Returns true if the given string contains any character outside built-in PDF Latin-1 support
 * (such as Emoji, Tamil, Hindi, Arabic, CJK, etc.).
 */
export function containsUnsupportedPdfChars(rawText) {
  if (typeof rawText !== 'string' || !rawText) return false;
  const normalized = normalizeTypographicPunctuation(rawText);
  for (const char of normalized) {
    const codePoint = char.codePointAt(0);
    if (!isSupportedLatinCodePoint(codePoint)) {
      return true;
    }
  }
  return false;
}

/**
 * Replaces any character outside built-in PDF Latin-1 support with `?`.
 * Iterates by Unicode code point (`for...of`) so multi-byte emoji become a single `?`.
 */
export function sanitizePdfText(rawText) {
  if (typeof rawText !== 'string' || !rawText) return '';
  const normalized = normalizeTypographicPunctuation(rawText);
  let output = '';
  for (const char of normalized) {
    const codePoint = char.codePointAt(0);
    output += isSupportedLatinCodePoint(codePoint) ? char : '?';
  }
  return output;
}

/**
 * Scans a book and its responses for characters that built-in jsPDF fonts cannot render.
 * Returns counts of affected respondent names, answers, and book fields so the UI can warn the owner
 * before generating the PDF.
 */
export function scanUnsupportedPdfCharacters(book, responses = []) {
  let affectedNamesCount = 0;
  let affectedAnswersCount = 0;
  let affectedBookFieldsCount = 0;

  if (book) {
    if (containsUnsupportedPdfChars(book.title)) affectedBookFieldsCount += 1;
    if (containsUnsupportedPdfChars(book.description)) affectedBookFieldsCount += 1;
  }

  if (Array.isArray(responses)) {
    responses.forEach((resp) => {
      if (containsUnsupportedPdfChars(resp?.respondentName)) {
        affectedNamesCount += 1;
      }
      if (Array.isArray(resp?.answers)) {
        resp.answers.forEach((ans) => {
          if (
            containsUnsupportedPdfChars(ans?.answer) ||
            containsUnsupportedPdfChars(ans?.question)
          ) {
            affectedAnswersCount += 1;
          }
        });
      }
    });
  }

  const totalAffectedCount =
    affectedNamesCount + affectedAnswersCount + affectedBookFieldsCount;

  return {
    hasUnsupported: totalAffectedCount > 0,
    affectedNamesCount,
    affectedAnswersCount,
    affectedBookFieldsCount,
    totalAffectedCount,
  };
}

/**
 * Converts a book title into a safe URL/file slug containing only lowercase letters,
 * numbers, and single hyphens. Falls back to "slam-book" if no usable characters remain.
 */
export function slugifyBookTitle(title) {
  if (typeof title !== 'string' || !title.trim()) {
    return 'slam-book';
  }

  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Strip diacritics (e.g. é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'slam-book';
}

/**
 * Builds the PDF download filename: `slamly-<book-title-slug>-<YYYY-MM-DD>.pdf`
 */
export function buildPdfFileName(bookTitle, date = new Date()) {
  const slug = slugifyBookTitle(bookTitle);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `slamly-${slug}-${year}-${month}-${day}.pdf`;
}

/**
 * 1. fetchAllResponses(bookId) or fetchAllResponses(userId, bookId)
 * Loops through the paginated `getBookResponses` (25 per page) until all responses are loaded,
 * with a safety cap of 500 responses (`MAX_EXPORT_RESPONSES`).
 *
 * Returns an Array of responses with `.responses`, `.capped` (boolean), and `.limit` (500)
 * properties attached so callers can either use the array directly or destructure `{ responses, capped }`.
 */
export async function fetchAllResponses(arg1, arg2) {
  const hasExplicitUser = typeof arg2 === 'string';
  const userId = hasExplicitUser ? arg1 : undefined;
  const bookId = hasExplicitUser ? arg2 : arg1;

  const collected = [];
  let cursor = null;
  let hasMore = true;
  let capped = false;

  while (hasMore && collected.length < MAX_EXPORT_RESPONSES) {
    const remainingCapacity = MAX_EXPORT_RESPONSES - collected.length;
    const pageSize = Math.min(EXPORT_PAGE_BATCH_SIZE, remainingCapacity);

    const pageResult = hasExplicitUser
      ? await getBookResponses(userId, bookId, { pageSize, cursor })
      : await getBookResponses(bookId, { pageSize, cursor });

    collected.push(...pageResult.responses);
    cursor = pageResult.nextCursor;
    hasMore = Boolean(pageResult.hasMore && cursor);

    if (collected.length >= MAX_EXPORT_RESPONSES && pageResult.hasMore) {
      capped = true;
      break;
    }
  }

  // Attach metadata properties so both `const { responses, capped } = await fetchAllResponses(...)`
  // and `const responses = await fetchAllResponses(...)` work seamlessly.
  Object.defineProperties(collected, {
    responses: {
      value: collected,
      enumerable: false,
    },
    capped: {
      value: capped,
      enumerable: false,
    },
    limit: {
      value: MAX_EXPORT_RESPONSES,
      enumerable: false,
    },
  });

  return collected;
}

/**
 * Draws a subtle scrapbook page frame and warm paper background on the current jsPDF page.
 */
function drawScrapbookPageFrame(doc, pageWidth, pageHeight, theme) {
  // Warm cream background
  doc.setFillColor(...PAPER_CREAM);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer notebook border
  doc.setDrawColor(...BORDER_TAN);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 3, 3, 'S');

  // Top decorative pastel strip
  doc.setFillColor(...theme.fill);
  doc.rect(10, 10, pageWidth - 20, 3.5, 'F');
}

/**
 * Draws the footer ("Slamly" on the left and "Page X of Y" on the right) on every page.
 */
function drawFootersOnAllPages(doc, pageWidth, pageHeight, marginX) {
  const totalPages = doc.getNumberOfPages();
  const footerY = pageHeight - 13;

  for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
    doc.setPage(pageNum);

    // Thin divider rule above footer
    doc.setDrawColor(...BORDER_TAN);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4.5, pageWidth - marginX, footerY - 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_SOFT);
    doc.text('Slamly', marginX, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - marginX, footerY, {
      align: 'right',
    });
  }
}

/**
 * 2. exportBookToPdf(book, responses, options)
 * Lazily imports `jspdf`, builds a scrapbook-styled A4 portrait PDF in the browser,
 * and triggers the file download (`slamly-<book-title-slug>-<YYYY-MM-DD>.pdf`).
 */
export async function exportBookToPdf(book, responses = [], options = {}) {
  if (!book) {
    throw new Error('Book details are required to generate the PDF.');
  }

  const responseList = Array.isArray(responses)
    ? responses
    : Array.isArray(responses?.responses)
    ? responses.responses
    : [];

  if (responseList.length === 0) {
    throw new Error('There are no responses in this slam book to export yet.');
  }

  // Lazy dynamic import of jsPDF so it stays out of the initial main bundle
  const jspdfModule = await import('jspdf');
  const JsPDFConstructor = jspdfModule.jsPDF || jspdfModule.default;

  const doc = new JsPDFConstructor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: options.compress !== false,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174 mm
  const topStartY = 22;
  const maxContentY = pageHeight - 22; // 275 mm (leaves room for footer)

  const themeKey = PDF_THEME_PALETTE[book.coverTheme] ? book.coverTheme : 'pink';
  const theme = PDF_THEME_PALETTE[themeKey];

  const exportDate = options.exportDate instanceof Date ? options.exportDate : new Date();
  const formattedExportDate = exportDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const safeTitle = sanitizePdfText(book.title || 'Untitled Slam Book');
  const safeDescription = sanitizePdfText(
    book.description || 'A personal digital slam book keepsake filled with friend memories.'
  );

  // =========================================================================
  // PAGE 1: SCRAPBOOK COVER PAGE
  // =========================================================================
  drawScrapbookPageFrame(doc, pageWidth, pageHeight, theme);

  // Pastel outer cover card
  const coverBoxX = marginX;
  const coverBoxY = 30;
  const coverBoxW = contentWidth;
  const coverBoxH = 220;

  doc.setFillColor(...theme.fill);
  doc.setDrawColor(...INK_DARK);
  doc.setLineWidth(0.7);
  doc.roundedRect(coverBoxX, coverBoxY, coverBoxW, coverBoxH, 5, 5, 'FD');

  // Vector Washi Tape centered at top of cover card
  const tapeW = 48;
  const tapeH = 9;
  doc.setFillColor(...PAPER_WARM);
  doc.setDrawColor(...INK_DARK);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth / 2 - tapeW / 2, coverBoxY - 4.5, tapeW, tapeH, 1.5, 1.5, 'FD');

  // Soft decorative vector corner circles (scrapbook sticker accents, no external images)
  doc.setFillColor(...PAPER_CREAM);
  doc.setDrawColor(...INK_DARK);
  doc.setLineWidth(0.4);
  doc.circle(coverBoxX + 10, coverBoxY + 10, 3.2, 'FD');
  doc.circle(coverBoxX + coverBoxW - 10, coverBoxY + 10, 3.2, 'FD');
  doc.circle(coverBoxX + 10, coverBoxY + coverBoxH - 10, 3.2, 'FD');
  doc.circle(coverBoxX + coverBoxW - 10, coverBoxY + coverBoxH - 10, 3.2, 'FD');

  // Inner cream paper label sheet on the cover
  const innerX = coverBoxX + 12;
  const innerY = coverBoxY + 20;
  const innerW = coverBoxW - 24;
  const innerH = coverBoxH - 40;

  doc.setFillColor(...PAPER_CREAM);
  doc.setDrawColor(...INK_DARK);
  doc.setLineWidth(0.6);
  doc.roundedRect(innerX, innerY, innerW, innerH, 4, 4, 'FD');

  // Brand pill badge
  let coverCursorY = innerY + 18;
  doc.setFillColor(...theme.softFill);
  doc.setDrawColor(...INK_DARK);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth / 2 - 28, coverCursorY - 6, 56, 9, 4.5, 4.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_DARK);
  doc.text(`SLAMLY KEEPSAKE EDITION`, pageWidth / 2, coverCursorY, { align: 'center' });

  // Slamly Tagline
  coverCursorY += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK_MUTED);
  doc.text('Every friend. Every memory. One little book.', pageWidth / 2, coverCursorY, {
    align: 'center',
  });

  // Divider line
  coverCursorY += 8;
  doc.setDrawColor(...BORDER_TAN);
  doc.setLineWidth(0.4);
  doc.line(innerX + 20, coverCursorY, innerX + innerW - 20, coverCursorY);

  // Book Title (wrapped cleanly)
  coverCursorY += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...INK_DARK);
  const titleLines = doc.splitTextToSize(safeTitle, innerW - 24).slice(0, 4);
  doc.text(titleLines, pageWidth / 2, coverCursorY, { align: 'center' });
  coverCursorY += titleLines.length * 9.5 + 4;

  // Book Description (wrapped cleanly)
  if (safeDescription) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...INK_MUTED);
    const descLines = doc.splitTextToSize(safeDescription, innerW - 28).slice(0, 6);
    doc.text(descLines, pageWidth / 2, coverCursorY, { align: 'center' });
    coverCursorY += descLines.length * 5.8 + 8;
  }

  // Summary Metadata Card at bottom of inner cover sheet
  const metaBoxW = innerW - 28;
  const metaBoxH = 38;
  const metaBoxX = innerX + 14;
  const metaBoxY = innerY + innerH - metaBoxH - 14;

  doc.setFillColor(...theme.softFill);
  doc.setDrawColor(...INK_DARK);
  doc.setLineWidth(0.4);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK_DARK);
  const responseCountLabel = `${responseList.length} ${
    responseList.length === 1 ? 'Friend Response' : 'Friend Responses'
  } Preserved`;
  doc.text(responseCountLabel, pageWidth / 2, metaBoxY + 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK_MUTED);
  doc.text(`Cover Theme: ${theme.label}`, pageWidth / 2, metaBoxY + 22, { align: 'center' });
  doc.text(`Exported on ${formattedExportDate}`, pageWidth / 2, metaBoxY + 30, {
    align: 'center',
  });

  // =========================================================================
  // PAGE 2+: FRIEND RESPONSES
  // =========================================================================
  doc.addPage();
  drawScrapbookPageFrame(doc, pageWidth, pageHeight, theme);
  let cursorY = topStartY;

  const startNewResponsePage = () => {
    doc.addPage();
    drawScrapbookPageFrame(doc, pageWidth, pageHeight, theme);
    cursorY = topStartY;
  };

  responseList.forEach((resp, respIdx) => {
    const safeName = sanitizePdfText(resp?.respondentName || `Friend #${respIdx + 1}`);
    const safeDate = sanitizePdfText(resp?.formattedDate || 'Recently signed');
    const answers = Array.isArray(resp?.answers) ? resp.answers : [];

    // Calculate height needed for the respondent heading banner + first question's first line
    // so we NEVER split a respondent heading from its first question/answer line.
    const headerBannerHeight = 16;
    const minFirstBlockHeight = 20;
    if (cursorY + headerBannerHeight + minFirstBlockHeight > maxContentY) {
      startNewResponsePage();
    }

    // Draw Respondent Heading Banner
    doc.setFillColor(...theme.fill);
    doc.setDrawColor(...INK_DARK);
    doc.setLineWidth(0.45);
    doc.roundedRect(marginX, cursorY, contentWidth, headerBannerHeight, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...INK_DARK);
    const headingText = `${respIdx + 1}. ${safeName}`;
    const headingLines = doc.splitTextToSize(headingText, contentWidth - 55);
    doc.text(headingLines[0] || headingText, marginX + 5, cursorY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(...INK_MUTED);
    doc.text(`Signed: ${safeDate}`, marginX + 5, cursorY + 12.8);

    cursorY += headerBannerHeight + 5;

    if (answers.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(...INK_SOFT);
      doc.text('(No question answers recorded for this entry)', marginX + 4, cursorY + 4);
      cursorY += 12;
    } else {
      answers.forEach((ansItem, qIdx) => {
        const rawQuestion = ansItem?.question || `Question #${qIdx + 1}`;
        const rawAnswer =
          ansItem?.answer && String(ansItem.answer).trim()
            ? String(ansItem.answer).trim()
            : '(No answer provided)';

        const safeQuestion = sanitizePdfText(`Q${qIdx + 1}. ${rawQuestion}`);
        const safeAnswer = sanitizePdfText(rawAnswer);

        const textInnerWidth = contentWidth - 8;
        const questionLineHeight = 5.0;
        const answerLineHeight = 5.0;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.2);
        const questionLines = doc.splitTextToSize(safeQuestion, textInnerWidth);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const answerLines = doc.splitTextToSize(safeAnswer, textInnerWidth);

        const questionBlockHeight = questionLines.length * questionLineHeight;
        // Ensure the question heading + at least 1 line of its answer fit together on the current page
        const minimumKeepTogetherHeight = questionBlockHeight + answerLineHeight + 4;
        if (cursorY + minimumKeepTogetherHeight > maxContentY) {
          startNewResponsePage();
        }

        // Render Question in bold
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.2);
        doc.setTextColor(...INK_DARK);
        questionLines.forEach((qLine) => {
          if (cursorY + questionLineHeight > maxContentY) {
            startNewResponsePage();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.2);
            doc.setTextColor(...INK_DARK);
          }
          doc.text(qLine, marginX + 4, cursorY + 4);
          cursorY += questionLineHeight;
        });

        cursorY += 1.2;

        // Render Answer lines below the question (supports very long answers across multiple pages)
        const isUnanswered = rawAnswer === '(No answer provided)';
        doc.setFont('helvetica', isUnanswered ? 'italic' : 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...(isUnanswered ? INK_SOFT : INK_MUTED));

        answerLines.forEach((aLine) => {
          if (cursorY + answerLineHeight > maxContentY) {
            startNewResponsePage();
            doc.setFont('helvetica', isUnanswered ? 'italic' : 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...(isUnanswered ? INK_SOFT : INK_MUTED));
          }
          doc.text(aLine, marginX + 4, cursorY + 4);
          cursorY += answerLineHeight;
        });

        // Subtle divider line below each Q&A pair
        cursorY += 3;
        if (cursorY + 3 <= maxContentY) {
          doc.setDrawColor(...BORDER_TAN);
          doc.setLineWidth(0.2);
          doc.line(marginX + 4, cursorY, pageWidth - marginX - 4, cursorY);
          cursorY += 4;
        }
      });
    }

    // Extra spacing between responses
    cursorY += 6;
  });

  // =========================================================================
  // FOOTERS ON EVERY PAGE ("Slamly" and "Page X of Y")
  // =========================================================================
  drawFootersOnAllPages(doc, pageWidth, pageHeight, marginX);

  const fileName = buildPdfFileName(book.title, exportDate);

  // Trigger browser download unless running in a headless/SSR test with `skipSave: true`
  if (!options.skipSave && typeof window !== 'undefined') {
    doc.save(fileName);
  }

  return {
    fileName,
    pageCount: doc.getNumberOfPages(),
    exportedCount: responseList.length,
    doc,
  };
}
