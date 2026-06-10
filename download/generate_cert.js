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

// ── No-border helpers ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── calcTitleLayout (simplified) ──
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

// ── calcCoverSpacing (simplified) ──
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

// ── Cover R1 ──
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

// ── Body helpers ──
const bodyColor = "000000";
const primaryColor = "1A1A1A";
const accentHex = palette.accent;

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

// Table helper — Horizontal-Only style
function makeTable(headers, rows) {
  const t = palette.table;
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
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

// ── Document Assembly ──
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
    // ── Section 1: Cover ──
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "PZC Group \u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u9ad4\u5236",
        englishLabel: "P R O F E S S I O N A L   C E R T I F I C A T I O N",
        subtitle: "\u521d\u6b65\u69cb\u601d\u65b9\u6848",
        metaLines: [
          "\u7248\u672c\uff1aV1.0\uff08\u521d\u7a3f\uff09",
          "\u65e5\u671f\uff1a2026\u5e746\u6708",
          "\u6a5f\u5bc6\u7b49\u7d1a\uff1a\u5167\u90e8\u53c3\u8003",
        ],
        footerLeft: "PZC Group",
        footerRight: "Confidential",
        palette: palette.cover,
      }),
    },

    // ── Section 2: Body ──
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
        // ── 一、背景與目的 ──
        h1("\u4e00\u3001\u80cc\u666f\u8207\u76ee\u7684"),
        para("PZC Group \u4ee5\u5065\u5eb7\u7522\u54c1\u63a8\u5ee3\u3001MCLUB \u6703\u54e1\u7ba1\u7406\u7cfb\u7d71\u53ca\u5916\u5706\u98a8\u96aa\u5efa\u6a21\u670d\u52d9\u70ba\u6838\u5fc3\u696d\u52d9\uff0c\u9010\u6b65\u5411\u5bb6\u65cf\u8fa6\u516c\u5ba4\u8ca1\u5bcc\u7ba1\u7406\u65b9\u5411\u767c\u5c55\u3002\u70ba\u4e86\u5728\u5e02\u5834\u4e0a\u5efa\u7acb\u5c08\u696d\u5f62\u8c61\u4e26\u63d0\u5347\u5ba2\u6236\u4fe1\u4efb\u5ea6\uff0c\u6211\u5011\u5e0c\u671b\u5efa\u7acb\u4e00\u5957\u81ea\u5efa\u7684\u5c08\u696d\u8a8d\u53ef\u9ad4\u5236\uff0c\u4ee5\u78ba\u4fdd\u5718\u968a\u6210\u54e1\u5177\u5099\u7d71\u4e00\u7684\u5c08\u696d\u77e5\u8b58\u548c\u670d\u52d9\u6a19\u6e96\u3002"),
        para("\u672c\u65b9\u6848\u5c6c\u65bc\u521d\u6b65\u69cb\u601d\uff0c\u65e8\u5728\u5b9a\u7fa9\u8a8d\u53ef\u9ad4\u5236\u7684\u57fa\u672c\u6846\u67b6\u3001\u8a8d\u53ef\u7d1a\u5225\u3001\u8ab2\u7a0b\u5167\u5bb9\u53ca\u8a55\u6838\u6a5f\u5236\u3002\u5728\u5f8c\u7e8c\u968e\u6bb5\u5c07\u6839\u64da\u5be6\u969b\u904b\u4f5c\u60c5\u6cc1\u9032\u884c\u5faa\u74b0\u6539\u9032\uff0c\u9010\u6b65\u5b8c\u5584\u5404\u9805\u7d30\u7bc0\u3002\u8a8d\u53ef\u9ad4\u5236\u5c07\u4ee5 PZC Group \u7684\u5be6\u969b\u696d\u52d9\u5834\u666f\u70ba\u57fa\u790e\uff0c\u7d50\u5408\u5065\u5eb7\u8ca1\u5bcc\u3001\u5916\u5706\u98a8\u96aa\u7ba1\u7406\u53ca\u5718\u968a\u904b\u71df\u7b49\u6838\u5fc3\u80fd\u529b\uff0c\u6253\u9020\u5177\u6709\u5dee\u7570\u5316\u7684\u5c08\u696d\u8cc7\u683c\u8a8d\u8b49\u3002"),

        // ── 二、認可級別架構 ──
        h1("\u4e8c\u3001\u8a8d\u53ef\u7d1a\u5225\u67b6\u69cb"),
        para("\u8a8d\u53ef\u9ad4\u5236\u8a2d\u8a08\u70ba\u4e09\u500b\u7d1a\u5225\uff0c\u5c0d\u61c9\u4e0d\u540c\u7684\u5c08\u696d\u6df1\u5ea6\u548c\u670d\u52d9\u7bc4\u570d\u3002\u6bcf\u500b\u7d1a\u5225\u5747\u8981\u6c42\u5b8c\u6210\u76f8\u61c9\u7684\u8ab2\u7a0b\u5b78\u7fd2\u548c\u8a55\u6838\uff0c\u78ba\u4fdd\u5718\u968a\u6210\u54e1\u7684\u80fd\u529b\u9032\u968e\u5f0f\u63d0\u5347\u3002\u7d1a\u5225\u4e4b\u9593\u5177\u6709\u660e\u78ba\u7684\u6642\u9593\u548c\u6210\u7e3e\u8981\u6c42\uff0c\u907f\u514d\u964d\u7d1a\u8a8d\u53ef\u7684\u5c08\u696d\u6027\u88ab\u8cea\u7591\u3002\u4e09\u500b\u7d1a\u5225\u5206\u5225\u662f\u57fa\u790e\u7d1a\u3001\u9032\u968e\u7d1a\u548c\u5c08\u5bb6\u7d1a\uff0c\u5176\u5b9a\u4f4d\u5982\u4e0b\u8868\u6240\u793a\u3002"),
        makeTable(
          ["\u7d1a\u5225", "\u540d\u79f0", "\u5b9a\u4f4d\u8aaa\u660e", "\u5b78\u7fd2\u6642\u9577", "\u9069\u7528\u5c0d\u8c61"],
          [
            ["Level 1", "\u57fa\u790e\u8a8d\u53ef", "\u57fa\u672c\u696d\u52d9\u77e5\u8b58\u8207\u670d\u52d9\u6a19\u6e96", "2-4 \u9031", "\u65b0\u52a0\u5165\u5718\u968a\u6210\u54e1"],
            ["Level 2", "\u9032\u968e\u8a8d\u53ef", "\u5c08\u696d\u6df1\u5ea6\u77e5\u8b58\u8207\u5be6\u6230\u80fd\u529b", "3-6 \u500b\u6708", "\u6838\u5fc3\u5718\u968a\u6210\u54e1\u53ca\u4e3b\u7ba1"],
            ["Level 3", "\u5c08\u5bb6\u8a8d\u53ef", "\u7d09\u5408\u7ba1\u7406\u8207\u6230\u7565\u6c7a\u7b56\u80fd\u529b", "6-12 \u500b\u6708", "\u9ad8\u7d1a\u7ba1\u7406\u5c64\u53ca\u5c0e\u5e2b"],
          ]
        ),
        emptyPara(),

        // ── 三、核心課程模組 ──
        h1("\u4e09\u3001\u6838\u5fc3\u8ab2\u7a0b\u6a21\u7d44"),
        para("\u8ab2\u7a0b\u5167\u5bb9\u7d50\u5408 PZC Group \u73fe\u6709\u696d\u52d9\u751f\u614b\uff0c\u5206\u70ba\u56db\u5927\u6838\u5fc3\u6a21\u7d44\u3002\u6bcf\u500b\u6a21\u7d44\u5c0d\u61c9\u5bb6\u65cf\u8fa6\u516c\u5ba4\u670d\u52d9\u93c8\u4e2d\u7684\u4e00\u500b\u95dc\u9375\u74b0\u7bc0\uff0c\u78ba\u4fdd\u5718\u968a\u6210\u54e1\u80fd\u5920\u5728\u5be6\u969b\u5de5\u4f5c\u4e2d\u5c07\u6240\u5b78\u77e5\u8b58\u8f49\u5316\u70ba\u670d\u52d9\u50f9\u503c\u3002\u8ab2\u7a0b\u8a2d\u8a08\u5f37\u8abf\u5be6\u64b0\u6027\uff0c\u907f\u514d\u904e\u591a\u7406\u8ad6\u5167\u5bb9\uff0c\u4ee5\u6848\u4f8b\u5206\u6790\u548c\u5834\u666f\u6a21\u64ec\u70ba\u4e3b\u3002"),

        h2("3.1 MCLUB \u7522\u54c1\u7d44\u5408\u77e5\u8b58"),
        para("\u672c\u6a21\u7d44\u4ee5 MCLUB \u5168\u7cfb\u7522\u54c1\u7d44\u5408\u70ba\u6838\u5fc3\uff0c\u6db5\u84cb\u65e5\u672c\u7269\u696d\u6295\u8cc7\u3001\u8056\u591a\u7f8e\u516c\u6c11\u8a08\u5283\u3001NPC \u57fa\u91d1\u3001\u5bb6\u65cf\u4fe1\u8a17\u3001\u516c\u53f8\u79d8\u66f8\u670d\u52d9\u3001MyPath AI\u3001\u9999\u6e2f\u6cd5\u5f8b\u670d\u52d9\u7b49\u591a\u5143\u7522\u54c1\u7d44\u5408\u3002\u5718\u968a\u6210\u54e1\u9700\u8981\u6df1\u5165\u7406\u89e3\u5404\u7522\u54c1\u7684\u5dee\u7570\u5316\u50f9\u503c\uff0c\u4ee5\u53ca\u5982\u4f55\u6839\u64da\u5ba2\u6236\u9700\u6c42\u9032\u884c\u7cbe\u6e96\u5339\u914d\u3002\u8ab2\u7a0b\u5167\u5bb9\u5305\u62ec\u7522\u54c1\u6210\u5206\u89e3\u6790\u3001\u5ba2\u6236\u670d\u52d9\u6d41\u7a0b\u3001\u5ba2\u6236\u904e\u6ffe\u8a71\u8853\u53ca\u56de\u61c9\u7570\u8b70\u7684\u5c08\u696d\u65b9\u6cd5\u3002"),

        h2("3.2 \u5916\u5706\u98a8\u96aa\u7ba1\u7406"),
        para("\u672c\u6a21\u7d44\u57fa\u65bc FX Risk Modelling \u670d\u52d9\uff0c\u6559\u5c0e\u5718\u968a\u6210\u54e1\u57fa\u672c\u7684\u5916\u5706\u77e5\u8b58\u3001\u58d3\u529b\u6e2c\u8a66\u65b9\u6cd5\u3001\u591a\u5e63\u7a2e\u5100\u8868\u677f\u64cd\u4f5c\u53ca\u5c0d\u6d96\u7b56\u7565\u3002\u5718\u968a\u6210\u54e1\u5c07\u5b78\u6703\u5982\u4f55\u5e6b\u52a9\u5ba2\u6236\u8a55\u4f30\u5703\u7387\u98a8\u96aa\u654f\u611f\u5ea6\uff0c\u4e26\u63d0\u4f9b\u57fa\u672c\u7684\u98a8\u96aa\u7ba1\u7406\u5efa\u8b70\u3002\u8ab2\u7a0b\u5305\u62ec\u5916\u5706\u57fa\u790e\u6982\u5ff5\u3001\u591a\u5e63\u7a2e\u5c0d\u8861\u5206\u6790\u3001\u5e63\u503c\u6ce2\u52d5\u5f71\u97ff\u56e0\u7d20\u53ca\u57fa\u672c\u5c0d\u6d96\u5de5\u5177\u7684\u4f7f\u7528\u3002"),

        h2("3.3 \u5718\u968a\u904b\u71df\u8207 MCLUB \u7cfb\u7d71"),
        para("\u672c\u6a21\u7d44\u4ecb\u7d39 MCLUB CRM \u7cfb\u7d71\u7684\u5be6\u969b\u904b\u4f5c\uff0c\u5305\u62ec\u6703\u54e1\u7ba1\u7406\u3001\u4e0b\u7dda\u63a8\u5ee3\u5b89\u6392\u3001\u5718\u968a\u6210\u9577\u8ecc\u8ff5\u8ffd\u8e64\u53ca\u6578\u64da\u5206\u6790\u3002\u5718\u968a\u6210\u54e1\u9700\u8981\u638c\u63e1\u5982\u4f55\u904b\u7528\u6578\u5b57\u5316\u5de5\u5177\u63d0\u5347\u7ba1\u7406\u6548\u7387\uff0c\u4e26\u57f9\u990a\u6578\u64da\u9a45\u52d5\u7684\u6c7a\u7b56\u7fd2\u6163\u3002\u8ab2\u7a0b\u5305\u62ec CRM \u7cfb\u7d71\u64cd\u4f5c\u5be6\u6234\u3001\u5718\u968a\u7e3e\u6548\u5206\u6790\u65b9\u6cd5\u3001\u4e0b\u7dda\u4fc3\u9032\u6d3b\u52d5\u7684\u7b56\u5283\u6280\u5de7\u53ca\u5ba2\u6236\u95dc\u4fc2\u7ba1\u7406\u7b56\u7565\u3002"),

        h2("3.4 \u5bb6\u65cf\u8fa6\u516c\u5ba4\u7d09\u5408\u670d\u52d9"),
        para("\u672c\u6a21\u7d44\u70ba Level 3 \u5c08\u5bb6\u8a8d\u53ef\u7684\u5c08\u5c6c\u5167\u5bb9\uff0c\u5167\u5bb9\u6db5\u84cb\u5bb6\u65cf\u8ca1\u5bcc\u898f\u5283\u3001\u8de8\u570b\u8cc7\u7522\u914d\u7f6e\u3001\u7a0e\u52d9\u7b56\u7565\u57fa\u790e\u53ca\u5bb6\u65cf\u6cbb\u7406\u4ecb\u7d39\u3002\u5718\u968a\u6210\u54e1\u5c07\u5b78\u7fd2\u5982\u4f55\u5c07\u5065\u5eb7\u3001\u5916\u5706\u98a8\u96aa\u7ba1\u7406\u53ca\u5718\u968a\u904b\u71df\u7b49\u80fd\u529b\u6574\u5408\u70ba\u5bb6\u65cf\u8fa6\u516c\u5ba4\u7684\u7d09\u5408\u670d\u52d9\u65b9\u6848\uff0c\u70ba\u9ad8\u6de8\u503c\u5ba2\u6236\u63d0\u4f9b\u5168\u65b9\u4f4d\u7684\u8ca1\u5bcc\u7ba1\u7406\u89e3\u6c7a\u65b9\u6848\u3002\u6b64\u6a21\u7d44\u5c07\u5728\u7b2c\u4e8c\u968e\u6bb5\u5b8c\u5584\u5f8c\u624d\u6703\u958b\u653e\uff0c\u5f85\u524d\u5169\u500b\u7d1a\u5225\u904b\u4f5c\u6210\u719f\u5f8c\u518d\u884c\u63a8\u51fa\u3002"),

        emptyPara(),

        // ── 四、評核與認證機制 ──
        h1("\u56db\u3001\u8a55\u6838\u8207\u8a8d\u8b49\u6a5f\u5236"),
        para("\u8a55\u6838\u65b9\u5f0f\u8a2d\u8a08\u70ba\u4e09\u500b\u968e\u6bb5\uff0c\u5206\u5225\u5c0d\u61c9\u4e0d\u540c\u7684\u5b78\u7fd2\u76ee\u6a19\u548c\u5c08\u696d\u8981\u6c42\u3002\u6574\u500b\u8a55\u6838\u904e\u7a0b\u5f37\u8abf\u5be6\u969b\u61c9\u7528\u80fd\u529b\uff0c\u800c\u975e\u55ae\u7d14\u7684\u8a18\u61b6\u6e2c\u8a66\u3002\u6bcf\u500b\u7d1a\u5225\u7684\u8a55\u6838\u6a19\u6e96\u5747\u8981\u6c42\u5718\u968a\u6210\u54e1\u5728\u5be6\u969b\u5de5\u4f5c\u5834\u666f\u4e2d\u5c55\u793a\u5176\u6240\u5b78\uff0c\u78ba\u4fdd\u8a8d\u53ef\u8cc7\u683c\u7684\u5be6\u969b\u50f9\u503c\u3002\u8a55\u6838\u7531\u5167\u90e8\u8cc7\u6df1\u5c0e\u5e2b\u8ca0\u8cac\u57f7\u884c\uff0c\u4e26\u8a18\u9304\u5728 MCLUB \u7cfb\u7d71\u4e2d\u4ee5\u4fbf\u8ffd\u8e64\u3002"),
        makeTable(
          ["\u968e\u6bb5", "\u5f62\u5f0f", "\u5167\u5bb9\u8aaa\u660e", "\u6bd4\u91cd"],
          [
            ["\u77e5\u8b58\u6e2c\u8a66", "\u7dda\u4e0a\u7b54\u984c", "\u57fa\u672c\u6982\u5ff5\u3001\u7522\u54c1\u77e5\u8b58\u3001\u6d41\u7a0b\u898f\u7bc4", "30%"],
            ["\u5be6\u6230\u6f14\u7df4", "\u60c5\u666f\u6a21\u64ec", "\u5ba2\u6236\u904e\u6ffe\u3001\u65b9\u6848\u63a8\u4ecb\u3001\u7570\u8b70\u8655\u7406", "40%"],
            ["\u5c0d\u5c0e\u8a55\u4f30", "\u5c0e\u5e2b\u9762\u8a66", "\u7d9c\u5408\u80fd\u529b\u8a55\u4f30\u3001\u670d\u52d9\u614b\u5ea6\u3001\u5c08\u696d\u5224\u65b7", "30%"],
          ]
        ),
        emptyPara(),

        // ── 五、證書頒發與管理 ──
        h1("\u4e94\u3001\u8b49\u66f8\u9810\u767c\u8207\u7ba1\u7406"),
        para("\u901a\u904e\u8a55\u6838\u5f8c\uff0c\u5718\u968a\u6210\u54e1\u5c07\u7372\u5f97\u7531 PZC Group \u9810\u767c\u7684\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8\u3002\u8b49\u66f8\u5c07\u5728 MCLUB \u7cfb\u7d71\u4e2d\u8a18\u9304\u5b58\u6a94\uff0c\u4e26\u9032\u884c\u6578\u4f4d\u5316\u7ba1\u7406\u3002\u8b49\u66f8\u7ba1\u7406\u6a5f\u5236\u5305\u62ec\u6709\u6548\u671f\u5236\u5ea6\u3001\u7e8c\u671f\u8981\u6c42\u53ca\u6263\u6d88\u689d\u4ef6\u3002\u6bcf\u5f35\u8b49\u66f8\u6709\u6548\u671f\u70ba\u5169\u5e74\uff0c\u5230\u671f\u524d\u9700\u5b8c\u6210\u7e8c\u671f\u5b78\u7fd2\u4e26\u901a\u904e\u7c21\u5316\u5fa9\u6838\u3002\u9019\u5957\u6a5f\u5236\u78ba\u4fdd\u5718\u968a\u6210\u54e1\u6301\u7e8c\u4fdd\u6301\u5c08\u696d\u6c34\u6e96\uff0c\u540c\u6642\u4e5f\u5f37\u5316\u4e86 PZC Group \u8a8d\u53ef\u9ad4\u5236\u7684\u5c08\u696d\u6027\u548c\u6b0a\u5a01\u6027\u3002"),
        makeTable(
          ["\u9805\u76ee", "\u8aaa\u660e"],
          [
            ["\u8b49\u66f8\u540d\u7a31", "PZC Family Office Professional Certification"],
            ["\u767c\u884c\u6a5f\u69cb", "PZC Group \u5167\u90e8\u8a8d\u53ef\u59d4\u54e1\u6703"],
            ["\u6709\u6548\u671f", "\u5169\u5e74\uff08\u53ef\u7e8c\u671f\uff09"],
            ["\u7e8c\u671f\u8981\u6c42", "\u6bcf\u5e74\u5b8c\u6210 20 \u5c0f\u6642\u7e8c\u671f\u5b78\u7fd2 + \u7c21\u5316\u5fa9\u6838"],
            ["\u8a18\u9304\u5e73\u53f0", "MCLUB CRM \u7cfb\u7d71"],
            ["\u6263\u6d88\u689d\u4ef6", "\u9055\u53cd\u8077\u696d\u884c\u70ba\u6e96\u5247\u6216\u670d\u52d9\u6295\u8a34\u67e5\u5be6"],
          ]
        ),
        emptyPara(),

        // ── 六、實施計劃 ──
        h1("\u516d\u3001\u5be6\u65bd\u8a08\u5283"),
        para("\u5be6\u65bd\u8a08\u5283\u5206\u70ba\u4e09\u500b\u968e\u6bb5\uff0c\u63a1\u53d6\u6f38\u9032\u5f0f\u63a8\u884c\u7b56\u7565\uff0c\u78ba\u4fdd\u6bcf\u500b\u968e\u6bb5\u90fd\u6709\u5145\u5206\u7684\u6e2c\u8a66\u548c\u8abf\u6574\u6642\u9593\u3002\u7b2c\u4e00\u968e\u6bb5\u5c07\u9650\u65bc\u5167\u90e8\u6e2c\u8a66\uff0c\u7b2c\u4e8c\u968e\u6bb5\u64f4\u5c55\u5230\u5168\u9762\u63a8\u884c\uff0c\u7b2c\u4e09\u968e\u6bb5\u5247\u5c0b\u6c42\u5916\u90e8\u5408\u4f5c\u8a8d\u53ef\u3002\u6574\u500b\u5be6\u65bd\u904e\u7a0b\u5c07\u904b\u7528 MCLUB \u7cfb\u7d71\u9032\u884c\u6578\u64da\u8ffd\u8e64\u548c\u6548\u679c\u8a55\u4f30\uff0c\u4ee5\u6578\u64da\u9a45\u52d5\u6301\u7e8c\u512a\u5316\u3002"),
        makeTable(
          ["\u968e\u6bb5", "\u6642\u9593", "\u91cd\u9ede\u5de5\u4f5c"],
          [
            ["\u7b2c\u4e00\u968e\u6bb5\uff1a\u5167\u6e2c\u8a66", "\u7b2c 1-3 \u500b\u6708", "\u5b8c\u5584 Level 1 \u8ab2\u7a0b\u3001\u8a55\u6838\u6d41\u7a0b\u3001\u8b49\u66f8\u6a23\u672c"],
            ["\u7b2c\u4e8c\u968e\u6bb5\uff1a\u6b63\u5f0f\u63a8\u884c", "\u7b2c 4-6 \u500b\u6708", "\u5168\u9762\u63a8\u51fa Level 1-2\u3001\u5efa\u7acb\u5c0e\u5e2b\u5718\u968a\u3001\u7cfb\u7d71\u6574\u5408"],
            ["\u7b2c\u4e09\u968e\u6bb5\uff1a\u512a\u5316\u64f4\u5c55", "\u7b2c 7-12 \u500b\u6708", "\u63a8\u51fa Level 3\u3001\u5c0b\u6c42\u5916\u90e8\u8a8d\u53ef\u5408\u4f5c\u3001\u5efa\u7acb\u54c1\u724c"],
          ]
        ),
      ],
    },
  ],
});

// ── Generate ──
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/PZC_Group_\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u9ad4\u5236.docx", buf);
  console.log("Document generated successfully!");
});
