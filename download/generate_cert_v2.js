const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, PageBreak, TableLayoutType,
} = require("docx");

// ── Palette: IG-1 Ink Gold (Finance / Investment) ──
const palette = {
  bg: "1A1A1A", primary: "FFFFFF", accent: "C9A84C",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "C9A84C", headerText: "1A1A1A", accentLine: "C9A84C", innerLine: "DDD5C0", surface: "F5F2E8" },
};

const c = (hex) => hex.replace("#", "");

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function calcTitleLayout(title, maxWidth, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidth / charWidth(pt));
  let pt = preferredPt;
  let lines;
  while (pt >= minPt) {
    const cpl = charsPerLine(pt);
    if (cpl < 2) { pt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    pt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = splitTitleLines(title, charsPerLine(minPt));
    pt = minPt;
  }
  return { titlePt: pt, titleLines: lines };
}

function splitTitleLines(title, cpl) {
  if (title.length <= cpl) return [title];
  const breakAfter = new Set([...'\u201c\u201d\u3002\uff0c\u3001\uff1b\uff1a\uff01\uff1f',...'的与和及之在于为','-_/\u3000',' \t']);
  const lines = [];
  let rem = title;
  while (rem.length > cpl) {
    let bi = -1;
    for (let i = cpl; i >= Math.floor(cpl * 0.6); i--) {
      if (i < rem.length && breakAfter.has(rem[i - 1])) { bi = i; break; }
    }
    if (bi === -1) bi = cpl;
    lines.push(rem.slice(0, bi).trim());
    rem = rem.slice(bi).trim();
  }
  if (rem) lines.push(rem);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(p) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle, hasEnglishLabel, metaLineCount = 0, fixedHeight = 400 } = p;
  const titleHeight = titleLineCount * titlePt * 23;
  const subH = hasSubtitle ? 500 : 0;
  const engH = hasEnglishLabel ? 400 : 0;
  const metaH = metaLineCount * 350;
  const used = titleHeight + subH + engH + metaH + fixedHeight + 800;
  const avail = 16838 - 1200;
  const remaining = Math.max(0, avail - used);
  const topFrac = 0.45;
  return { topSpacing: Math.round(remaining * topFrac), midSpacing: Math.round(remaining * 0.1), bottomSpacing: Math.round(remaining * 0.45) };
}

function buildCoverR1(config) {
  const P = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];

  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel, size: 18, color: P.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }

  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: P.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }

  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: P.subtitleColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }

  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }

  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));

  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, children })],
    })],
  })];
}

const bodyColor = "000000";
const primaryColor = "1A1A1A";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: primaryColor, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: primaryColor, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function para(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 120 },
    children: [new TextRun({ text, size: 24, color: bodyColor, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function emptyPara() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [] });
}

function makeTable(headers, rows) {
  const t = palette.table;
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h) => new TableCell({
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: t.headerBg },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 21, color: t.headerText, font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
    })),
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    cantSplit: true,
    children: row.map((cell) => new TableCell({
      width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      shading: ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: t.surface } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 21, color: bodyColor, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ── Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: bodyColor },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: primaryColor },
        paragraph: { spacing: { before: 360, after: 200, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: primaryColor },
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
    },
  },
  sections: [
    // ── Cover ──
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "PZC Group \u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8",
        englishLabel: "P R O F E S S I O N A L   C E R T I F I C A T E",
        subtitle: "\u8ab2\u7a0b\u65b9\u6848\uff08\u521d\u7a3f\uff09",
        metaLines: [
          "\u6536\u8cbb\uff1aHK$1,680 / \u5169\u5929\u8ab2\u7a0b\uff08\u6bcf\u5929 4 \u5c0f\u6642\uff09",
          "\u5b8c\u6210\u8ab2\u7a0b\u7372\u767c\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8",
          "\u65e5\u671f\uff1a2026\u5e746\u6708",
        ],
        footerLeft: "PZC Group",
        footerRight: "Confidential",
        palette: palette.cover,
      }),
    },

    // ── Body ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" })],
          })],
        }),
      },
      children: [
        // ── 一、課程概覽 ──
        h1("\u4e00\u3001\u8ab2\u7a0b\u6982\u89bd"),
        para("PZC Group \u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8\u8ab2\u7a0b\uff0c\u65e8\u5728\u70ba\u6709\u5fd7\u6295\u8eab\u5bb6\u65cf\u8fa6\u516c\u5ba4\u884c\u696d\u7684\u5f9e\u696d\u54e1\u63d0\u4f9b\u7cfb\u7d71\u6027\u7684\u5c08\u696d\u57f9\u8a13\u3002\u8ab2\u7a0b\u6db5\u84cb\u5bb6\u65cf\u8fa6\u516c\u5ba4\u57fa\u790e\u77e5\u8b58\u3001\u8ca1\u52d9\u6703\u8a08\u3001\u4e2d\u6e2f\u8cc7\u672c\u5e02\u5834 IPO \u5be6\u52d9\u3001\u53cd\u6d17\u9322\u5408\u898f\u4ee5\u53ca\u5ba2\u6236\u95dc\u4fc2\u7ba1\u7406\u7cfb\u7d71\u4e94\u5927\u6838\u5fc3\u7bc4\u7587\uff0c\u5e6b\u52a9\u5b78\u54e1\u5728\u77ed\u6642\u9593\u5167\u5efa\u7acb\u5bb6\u65cf\u8fa6\u516c\u5ba4\u884c\u696d\u7684\u57fa\u672c\u5c08\u696d\u80fd\u529b\u3002\u8ab2\u7a0b\u5b8c\u6210\u5f8c\uff0c\u5b78\u54e1\u5c07\u7372\u5f97\u7531 PZC Group \u9810\u767c\u7684\u300c\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8\u300d\uff0c\u4f5c\u70ba\u5176\u5c08\u696d\u80fd\u529b\u7684\u6b63\u5f0f\u8a8d\u53ef\u3002"),

        h2("\u8ab2\u7a0b\u8cc7\u8a0a"),
        makeTable(
          ["\u9805\u76ee", "\u8a73\u60c5"],
          [
            ["\u8ab2\u7a0b\u540d\u7a31", "PZC \u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8\u8ab2\u7a0b"],
            ["\u8ab2\u7a0b\u6642\u9577", "\u5171 2 \u5929\uff0c\u6bcf\u5929 4 \u5c0f\u6642\uff08\u7e3d\u8a08 8 \u5c0f\u6642\uff09"],
            ["\u6536\u8cbb", "HK$1,680"],
            ["\u8a8d\u8b49\u8cc7\u683c", "\u5b8c\u6210\u5168\u90e8\u8ab2\u7a0b\u5f8c\u7372\u767c\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8"],
            ["\u6388\u8ab2\u8a9e\u8a00", "\u7ca4\u8a9e\uff08\u4e3b\u8981\uff09"],
            ["\u9069\u5408\u5c0d\u8c61", "\u6709\u610f\u6295\u8eab\u5bb6\u65cf\u8fa6\u516c\u5ba4\u884c\u696d\u7684\u5f9e\u696d\u54e1"],
          ]
        ),
        emptyPara(),

        // ── 二、課程大綱 ──
        h1("\u4e8c\u3001\u8ab2\u7a0b\u5927\u7db1"),

        // Day 1
        h2("\u7b2c\u4e00\u5929\uff084 \u5c0f\u6642\uff09"),

        h2("\u6a21\u7d44\u4e00\uff1a\u57fa\u672c\u5bb6\u8fa6\u77e5\u8b58\uff081.5 \u5c0f\u6642\uff09"),
        para("\u672c\u6a21\u7d44\u5411\u5b78\u54e1\u4ecb\u7d39\u5bb6\u65cf\u8fa6\u516c\u5ba4\u7684\u57fa\u672c\u6982\u5ff5\u3001\u904b\u4f5c\u6a21\u5f0f\u53ca\u884c\u696d\u751f\u614b\u3002\u5b78\u54e1\u5c07\u4e86\u89e3\u5bb6\u65cf\u8fa6\u516c\u5ba4\u7684\u5b9a\u7fa9\u3001\u5353\u8d8a\u5bb6\u65cf\u8fa6\u516c\u5ba4\u8207\u55ae\u4e00\u5bb6\u65cf\u8fa6\u516c\u5ba4\u7684\u533a\u5225\u3001\u5168\u7403\u5bb6\u65cf\u8fa6\u516c\u5ba4\u7684\u767c\u5c55\u8da3\u52e2\uff0c\u4ee5\u53ca\u9999\u6e2f\u5728\u5176\u4e2d\u7684\u89d2\u8272\u548c\u512a\u52e2\u3002\u6b64\u5916\uff0c\u6a21\u7d44\u4e5f\u6703\u6db5\u84cb\u5bb6\u65cf\u8ca1\u5bcc\u4fdd\u5168\u3001\u907a\u7522\u898f\u5283\u3001\u7a0e\u52d9\u7b56\u7565\u7b49\u57fa\u672c\u8981\u7d20\uff0c\u8b93\u5b78\u54e1\u5c0d\u5bb6\u65cf\u8fa6\u516c\u5ba4\u670d\u52d9\u5167\u5bb9\u6709\u5168\u9762\u7684\u8a8d\u8b58\u3002"),
        para("\u4e3b\u8981\u5167\u5bb9\u5305\u62ec\uff1a\u5bb6\u65cf\u8fa6\u516c\u5ba4\u7684\u5b9a\u7fa9\u8207\u5206\u985e\u3001\u5168\u7403\u884c\u696d\u767c\u5c55\u6982\u6cc1\u3001\u9999\u6e2f\u5bb6\u65cf\u8fa6\u516c\u5ba4\u751f\u614b\u3001\u5bb6\u65cf\u8ca1\u5bcc\u7ba1\u7406\u6838\u5fc3\u670d\u52d9\u7bc4\u7587\u3001\u5bb6\u65cf\u6cbb\u7406\u57fa\u790e\u6982\u5ff5\u3001\u4fe1\u8a17\u8207\u5353\u8d8a\u670d\u52d9\u4ecb\u7d39\u3002"),

        h2("\u6a21\u7d44\u4e8c\uff1a\u8ca1\u52d9\u6703\u8a08\u57fa\u790e\uff081 \u5c0f\u6642\uff09"),
        para("\u672c\u6a21\u7d44\u5e6b\u52a9\u5b78\u54e1\u638c\u63e1\u5bb6\u65cf\u8fa6\u516c\u5ba4\u884c\u696d\u4e2d\u5fc5\u5099\u7684\u8ca1\u52d9\u6703\u8a08\u77e5\u8b58\u3002\u5b78\u54e1\u5c07\u5b78\u7fd2\u8ca1\u52d9\u5831\u8868\u7684\u57fa\u672c\u7d50\u69cb\u3001\u5982\u4f55\u8b80\u61c2\u8cc7\u7522\u8ca0\u50b5\u8868\u3001\u640d\u76ca\u8868\u53ca\u73fe\u91d1\u6d41\u91cf\u8868\u3002\u6b64\u5916\uff0c\u6a21\u7d44\u4e5f\u6db5\u84cb\u5bb6\u65cf\u8ca0\u50b5\u7ba1\u7406\u3001\u8ca0\u50b5\u8207\u6b0a\u76ca\u6bd4\u4f8b\u7684\u57fa\u672c\u6982\u5ff5\uff0c\u4ee5\u53ca\u5982\u4f55\u5229\u7528\u8ca1\u52d9\u6578\u64da\u9032\u884c\u5bb6\u65cf\u8ca0\u50b5\u8a55\u4f30\u548c\u6295\u8cc7\u6c7a\u7b56\u3002\u9019\u4e9b\u77e5\u8b58\u5c0d\u65bc\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5f9e\u696d\u54e1\u800c\u8a00\uff0c\u662f\u670d\u52d9\u9ad8\u6de8\u503c\u5ba2\u6236\u6642\u5fc5\u987b\u5177\u5099\u7684\u57fa\u672c\u529f\u3002"),
        para("\u4e3b\u8981\u5167\u5bb9\u5305\u62ec\uff1a\u8ca1\u52d9\u5831\u8868\u57fa\u790e\u8b80\u53d6\u3001\u8cc7\u7522\u8ca0\u50b5\u8868\u3001\u640d\u76ca\u8868\u8207\u73fe\u91d1\u6d41\u91cf\u8868\u89e3\u6790\u3001\u5bb6\u65cf\u8ca0\u50b5\u7ba1\u7406\u6982\u5ff5\u3001\u57fa\u672c\u8ca1\u52d9\u6bd4\u7387\u5206\u6790\u3001\u7a0e\u52d9\u57fa\u790e\u8207\u5bb6\u65cf\u7a0e\u52d9\u8003\u91cf\u3002"),

        h2("\u6a21\u7d44\u4e09\uff1a\u5167\u5730\u4f01\u696d\u9999\u6e2f\u4e3b\u677f IPO\uff081.5 \u5c0f\u6642\uff09"),
        para("\u672c\u6a21\u7d44\u805a\u7126\u5167\u5730\u4f01\u696d\u5728\u9999\u6e2f\u4e3b\u677f\u4e0a\u5e02\u7684\u5b8c\u6574\u6d41\u7a0b\uff0c\u662f\u8ab2\u7a0b\u4e2d\u6700\u5177\u5e02\u5834\u50f9\u503c\u7684\u90e8\u5206\u3002\u5b78\u54e1\u5c07\u5168\u9762\u4e86\u89e3\u5167\u5730\u4f01\u696d\u8d74\u6e2f\u4e0a\u5e02\u7684\u52d5\u6a5f\u3001\u4e3b\u677f\u4e0a\u5e02\u6761\u4ef6\u3001\u5ba1\u6838\u6d41\u7a0b\u53ca\u5173\u9375\u6642\u9593\u7bc0\u9ede\u3002\u5167\u5bb9\u6db5\u84cb\u4e3b\u677f\u4e0a\u5e02\u8981\u6c42\uff08\u76c8\u5229\u3001\u71df\u696d\u8a18\u9304\u3001\u5e02\u503c\u7b49\uff09\u3001\u4fdd\u85a6\u4eba\u8207\u5408\u683c\u5c0d\u8c61\u7684\u89d2\u8272\u3001IPO \u524d\u5f8c\u7684\u91cd\u7d44\u6d41\u7a0b\uff0c\u4ee5\u53ca\u8fd1\u5e74\u4e2d\u570b\u4f01\u696d\u8d74\u6e2f\u4e0a\u5e02\u7684\u5e38\u898b\u6a21\u5f0f\u8207\u6ce8\u610f\u4e8b\u9805\u3002\u5b78\u54e1\u5b8c\u6210\u5f8c\u5c07\u80fd\u5920\u5354\u52a9\u5167\u5730\u5bb6\u65cf\u4f01\u696d\u5ba2\u6236\u7406\u89e3\u9999\u6e2f\u8cc7\u672c\u5e02\u5834\u7684\u4e0a\u5e02\u8def\u5f91\u3002"),
        para("\u4e3b\u8981\u5167\u5bb9\u5305\u62ec\uff1a\u9999\u6e2f\u4e3b\u677f\u4e0a\u5e02\u689d\u4ef6\u6982\u89bd\u3001\u5167\u5730\u4f01\u696d\u8d74\u6e2f IPO \u5e38\u898b\u6d41\u7a0b\u3001\u4e3b\u677f\u4e0a\u5e02\u5ba1\u6838\u8981\u6c42\u3001\u4fdd\u85a6\u4eba\u8207\u5408\u683c\u5c0d\u8c61\u5236\u5ea6\u3001IPO \u524d\u5f8c\u91cd\u7d44\u6d41\u7a0b\u3001\u8fd1\u5e74\u5e38\u898b\u6848\u4f8b\u5206\u6790\u3002"),

        // Day 2
        h2("\u7b2c\u4e8c\u5929\uff084 \u5c0f\u6642\uff09"),

        h2("\u6a21\u7d44\u56db\uff1aAML \u53cd\u6d17\u9322\u5408\u898f\uff082 \u5c0f\u6642\uff09"),
        para("\u53cd\u6d17\u9322\u5408\u898f\u662f\u5bb6\u65cf\u8fa6\u516c\u5ba4\u884c\u696d\u4e2d\u4e0d\u53ef\u6216\u7f3a\u7684\u5408\u898f\u77e5\u8b58\u3002\u672c\u6a21\u7d44\u5168\u9762\u4ecb\u7d39\u9999\u6e2f\u300a\u53cd\u6d17\u9322\u53ca\u53cd\u6050\u602a\u8cc7\u91d1\u7dca\u5316\u689d\u4f8b\u300b\uff08AMLO\uff09\u7684\u6838\u5fc3\u8981\u6c42\uff0c\u5305\u62ec\u5ba2\u6236\u76e1\u8b77\u7a0b\u5e8f\uff08KYC\uff09\u3001\u5ba2\u6236\u76e1\u8b77\u5be9\u67e5\uff08CDD\uff09\u3001\u589e\u5f37\u76e1\u8b77\u5be9\u67e5\uff08EDD\uff09\u7684\u5be6\u52d9\u64cd\u4f5c\u3002\u5b78\u54e1\u5c07\u5b78\u7fd2\u5982\u4f55\u8b58\u5225\u53ef\u7591\u4ea4\u6613\u3001\u53ef\u7591\u5ba2\u6236\u7279\u5fb5\uff0c\u4ee5\u53ca\u9047\u5230\u53ef\u7591\u60c5\u6cc1\u6642\u7684\u53ef\u62a5\u544a\u8655\u7406\u6d41\u7a0b\u3002\u6b64\u6a21\u7d44\u4e5f\u6db5\u84cb\u570b\u969b\u53cd\u6d17\u9322\u6807\u6e96\u3001 FATF \u5efa\u8b70\u53ca\u5168\u7403\u53cd\u6d17\u9322\u5408\u898f\u8da3\u52e2\uff0c\u5e6b\u52a9\u5b78\u54e1\u5efa\u7acb\u5168\u7403\u5408\u898f\u8996\u91ce\u3002"),
        para("\u4e3b\u8981\u5167\u5bb9\u5305\u62ec\uff1aAMLO \u689d\u4f8b\u6838\u5fc3\u8981\u6c42\u3001KYC/CDD/EDD \u5be6\u52d9\u64cd\u4f5c\u6d41\u7a0b\u3001\u53ef\u7591\u4ea4\u6613\u8b58\u5225\u8207\u5831\u544a\u7fa9\u52d9\u3001\u53ef\u7591\u5ba2\u6236\u7279\u5fb5\u5206\u6790\u3001\u8a18\u9304\u4fdd\u5b58\u8981\u6c42\u3001\u570b\u969b\u53cd\u6d17\u9322\u6807\u6e96\u8207 FATF \u5efa\u8b70\u3001\u5be6\u969b\u6848\u4f8b\u5206\u6790\u3002"),

        h2("\u6a21\u7d44\u4e94\uff1aCRM \u5ba2\u6236\u95dc\u4fc2\u7ba1\u7406\u7cfb\u7d71\uff082 \u5c0f\u6642\uff09"),
        para("\u672c\u6a21\u7d44\u4ee5 PZC Group \u73fe\u6709\u7684 MCLUB CRM \u7cfb\u7d71\u70ba\u57fa\u790e\uff0c\u6559\u5c0e\u5b78\u54e1\u5982\u4f55\u904b\u7528\u6578\u5b57\u5316\u5de5\u5177\u7ba1\u7406\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5ba2\u6236\u95dc\u4fc2\u3002\u5b78\u54e1\u5c07\u5b78\u7fd2 CRM \u7cfb\u7d71\u7684\u57fa\u672c\u904b\u4f5c\u3001\u5ba2\u6236\u8cc7\u6599\u7ba1\u7406\u3001\u670d\u52d9\u8a18\u9304\u8ffd\u8e64\u3001\u4ea4\u6613\u6d41\u7a0b\u7ba1\u7406\uff0c\u4ee5\u53ca\u5982\u4f55\u5229\u7528\u6578\u64da\u5206\u6790\u63d0\u5347\u670d\u52d9\u8cea\u91cf\u3002\u9019\u5957\u7cfb\u7d71\u662f PZC Group \u7684\u6838\u5fc3\u904b\u71df\u5de5\u5177\uff0c\u5b78\u54e1\u638c\u63e1\u5f8c\u5c07\u80fd\u5920\u5373\u6642\u4e0a\u624b\u5be6\u969b\u5de5\u4f5c\uff0c\u9ad8\u6548\u5730\u7ba1\u7406\u5ba2\u6236\u95dc\u4fc2\u548c\u670d\u52d9\u6d41\u7a0b\u3002"),
        para("\u4e3b\u8981\u5167\u5bb9\u5305\u62ec\uff1aCRM \u7cfb\u7d71\u57fa\u790e\u6982\u5ff5\u8207 MCLUB \u5be6\u64cd\u3001\u5ba2\u6236\u8cc7\u6599\u5efa\u7acb\u8207\u7ba1\u7406\u3001\u670d\u52d9\u8a02\u55ae\u8207\u6d41\u7a0b\u8ffd\u8e64\u3001\u5ba2\u6236\u6e9d\u901a\u8207\u5b9a\u671f\u56de\u8a2a\u7b56\u7565\u3001\u6578\u64da\u5206\u6790\u8207\u5831\u8868\u7522\u751f\u3001\u5be6\u6234\u6f14\u7df4\u3002"),
        emptyPara(),

        // ── 三、課程時間表 ──
        h1("\u4e09\u3001\u8ab2\u7a0b\u6642\u9593\u8868"),
        makeTable(
          ["\u65e5\u671f", "\u6642\u9593", "\u6a21\u7d44", "\u5167\u5bb9", "\u6642\u9577"],
          [
            ["\u7b2c 1 \u5929", "\u4e0a\u5348", "\u57fa\u672c\u5bb6\u8fa6\u77e5\u8b58", "\u5bb6\u65cf\u8fa6\u516c\u5ba4\u6982\u5ff5\u3001\u884c\u696d\u751f\u614b\u3001\u670d\u52d9\u7bc4\u7587", "1.5 \u5c0f\u6642"],
            ["\u7b2c 1 \u5929", "\u4e0b\u5348\uff08\u524d\uff09", "\u8ca1\u52d9\u6703\u8a08\u57fa\u790e", "\u8ca0\u50b5\u7ba1\u7406\u3001\u5831\u8868\u89e3\u8b80\u3001\u8ca1\u52d9\u6bd4\u7387", "1 \u5c0f\u6642"],
            ["\u7b2c 1 \u5929", "\u4e0b\u5348\uff08\u5f8c\uff09", "\u5167\u5730\u4f01\u696d\u9999\u6e2f\u4e3b\u677f IPO", "\u4e0a\u5e02\u689d\u4ef6\u3001\u5be9\u6838\u6d41\u7a0b\u3001\u6848\u4f8b\u5206\u6790", "1.5 \u5c0f\u6642"],
            ["\u7b2c 2 \u5929", "\u4e0a\u5348", "AML \u53cd\u6d17\u9322\u5408\u898f", "KYC/CDD/EDD\u3001\u53ef\u7591\u4ea4\u6613\u3001\u5be6\u969b\u6848\u4f8b", "2 \u5c0f\u6642"],
            ["\u7b2c 2 \u5929", "\u4e0b\u5348", "CRM \u5ba2\u6236\u95dc\u4fc2\u7ba1\u7406", "MCLUB \u7cfb\u7d71\u3001\u5ba2\u6236\u7ba1\u7406\u3001\u6578\u64da\u5206\u6790", "2 \u5c0f\u6642"],
          ]
        ),
        emptyPara(),

        // ── 四、證書頒發 ──
        h1("\u56db\u3001\u8b49\u66f8\u9810\u767c"),
        para("\u5b78\u54e1\u5b8c\u6210\u5168\u90e8\u5169\u5929\u8ab2\u7a0b\u5f8c\uff0c\u5c07\u7372\u5f97\u7531 PZC Group \u9810\u767c\u7684\u300c\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8\u300d\u3002\u8b49\u66f8\u5c07\u5728 MCLUB CRM \u7cfb\u7d71\u4e2d\u9032\u884c\u6578\u4f4d\u5316\u7ba1\u7406\u548c\u5b58\u6a94\u8a18\u9304\uff0c\u78ba\u4fdd\u6bcf\u5f35\u8b49\u66f8\u7686\u53ef\u8ffd\u6eaf\u3002\u8b49\u66f8\u7684\u767c\u51fa\u4ee3\u8868\u5b78\u54e1\u5df2\u7d93\u638c\u63e1\u5bb6\u65cf\u8fa6\u516c\u5ba4\u884c\u696d\u7684\u57fa\u672c\u5c08\u696d\u77e5\u8b58\uff0c\u5305\u62ec\u5bb6\u8fa6\u6982\u5ff5\u3001\u8ca1\u52d9\u6703\u8a08\u3001IPO \u5be6\u52d9\u3001\u53cd\u6d17\u9322\u5408\u898f\u53ca\u5ba2\u6236\u7ba1\u7406\u7b49\u4e94\u5927\u7bc4\u7587\uff0c\u53ef\u4ee5\u5373\u6642\u5e94\u7528\u65bc\u5be6\u969b\u5de5\u4f5c\u4e2d\u3002"),
        makeTable(
          ["\u9805\u76ee", "\u8aaa\u660e"],
          [
            ["\u8b49\u66f8\u540d\u7a31", "PZC Family Office Professional Certificate"],
            ["\u9810\u767c\u6a5f\u69cb", "PZC Group"],
            ["\u9810\u767c\u689d\u4ef6", "\u5b8c\u6210\u5168\u90e8 8 \u5c0f\u6642\u8ab2\u7a0b"],
            ["\u8a18\u9304\u5e73\u53f0", "MCLUB CRM \u7cfb\u7d71"],
            ["\u8b49\u66f8\u6a23\u5f0f", "\u7d19\u8cea\u8b49\u66f8 + \u6578\u4f4d\u7248\u672c"],
          ]
        ),
        emptyPara(),

        // ── 五、報名資訊 ──
        h1("\u4e94\u3001\u5831\u540d\u8cc7\u8a0a"),
        para("\u672c\u8ab2\u7a0b\u6b63\u5728籌\u5099\u968e\u6bb5\uff0c\u6b63\u5f0f\u958b\u8ab2\u65e5\u671f\u5c07\u53e6\u884c\u516c\u4f48\u3002\u6b64\u65b9\u6848\u70ba\u521d\u6b65\u69cb\u601d\uff0c\u8ab2\u7a0b\u5167\u5bb9\u53ca\u5b89\u6392\u53ef\u80fd\u6839\u64da\u5be6\u969b\u60c5\u6cc1\u4f5c\u51fa\u8abf\u6574\u3002\u5982\u6709\u4efb\u4f55\u7591\u554f\uff0c\u6b61\u8fce\u901a\u904e PZC Group \u5ba2\u6236\u670d\u52d9\u5c08\u54e1\u67e5\u8a62\u3002"),
        makeTable(
          ["\u9805\u76ee", "\u8a73\u60c5"],
          [
            ["\u5831\u540d\u65b9\u5f0f", "\u901a\u904e PZC Group \u5ba2\u6236\u670d\u52d9\u5c08\u54e1"],
            ["\u8ab2\u7a0b\u8cbb\u7528", "HK$1,680"],
            ["\u4e0a\u8ab2\u5f62\u5f0f", "\u5c0f\u7d44\u5be6\u9ad4\u8ab2\uff08\u5c11\u6578\u5c0e\u5e2b\u5e36\u9886\uff09"],
            ["\u8a73\u60c5\u67e5\u8a62", "PZC Group \u5ba2\u6236\u670d\u52d9"],
          ]
        ),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/PZC_Group_\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8.docx", buf);
  console.log("Document generated successfully!");
});
