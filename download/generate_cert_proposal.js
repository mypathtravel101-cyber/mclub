const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, TableLayoutType, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Palette: GO-1 Graphite Orange (proposal/plan) ──
const P = {
  bg: "1A2330", primary: "FFFFFF", accent: "D4875A",
  body: "000000", secondary: "506070",
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
};

const c = (hex) => hex.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Helper: empty paragraph ──
function emptyPara() {
  return new Paragraph({ spacing: { after: 0, line: 276 }, children: [] });
}

// ── Helper: calcTitleLayout ──
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([...'\uFF0C\u3002\u3001\uFF1B\uFF1A\uFF01\uFF1F', ...'\u7684\u4E0E\u548C\u53CA\u4E4B\u5728\u4E8E\u4E3A', ...'-_\u2014\u2013\u00B7/', ...' \t']);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) { breakAt = charsPerLine; }
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += last;
  }
  return lines;
}

// ── Cover: R4 Top Color Block ──
function buildCoverR4(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 26);
  const titleSize = titlePt * 2;
  const UPPER_H = 7500;
  const DIVIDER_H = 60;
  const topSpacing = Math.max(UPPER_H - titleLines.length * (titlePt * 23 + 200) - 800 - 800, 400);

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: "exact" },
      children: [new TableCell({
        shading: { fill: c(P.bg) }, borders: noBorders,
        verticalAlign: "top",
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: topSpacing } }),
          ...(titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200 },
            children: [new TextRun({ text: line, size: titleSize, bold: true,
              color: c(P.cover.titleColor), font: { eastAsia: "SimHei", ascii: "Arial" } })],
          }))),
          config.subtitle ? new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: config.subtitle, size: 24, color: c(P.cover.subtitleColor),
              font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
          }) : null,
        ].filter(Boolean),
      })],
    })],
  });

  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: "exact" },
      children: [new TableCell({ borders: noBorders, shading: { fill: c(P.accent) }, children: [emptyPara()] })],
    })],
  });

  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...(config.metaLines || []).map(line => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({ text: line, size: 28, color: c(P.cover.metaColor),
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    })),
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: config.footerLeft || "", size: 22, color: "909090" }),
        new TextRun({ text: "          " }),
        new TextRun({ text: config.footerRight || "", size: 22, color: "909090" }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { fill: "FFFFFF" }, borders: noBorders,
        verticalAlign: "top",
        children: [upperBlock, divider, ...lowerContent],
      })],
    })],
  })];
}

// ── Body helpers ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}
function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body),
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

// ── Table helper ──
function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headers.map(text => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold: true, size: 21, color: c(P.table.headerText),
              font: { ascii: "Calibri", eastAsia: "SimHei" } })]
          })],
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        })),
      }),
      ...rows.map((row, idx) => new TableRow({
        cantSplit: true,
        children: row.map(text => new TableCell({
          shading: idx % 2 === 0
            ? { type: ShadingType.CLEAR, fill: c(P.table.surface) }
            : { type: ShadingType.CLEAR, fill: "FFFFFF" },
          children: [new Paragraph({
            children: [new TextRun({ text, size: 21, color: c(P.body),
              font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })]
          })],
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        })),
      })),
    ],
  });
}

// ── Build document ──
const coverChildren = buildCoverR4({
  title: "MCLUB\u5BB6\u65CF\u8FA6\u516C\u5BA4\u5C08\u696D\u8A8D\u53EF\u9AD4\u5236",
  subtitle: "\u521D\u6B65\u69CB\u601D\u5EFA\u8B70\u66F8",
  palette: P,
  metaLines: [
    "PZC Group \u2014 \u767E\u76DB\u5927\u901A\u5BB6\u65CF\u8FA6\u516C\u5BA4",
    "MCLUB Family Office | VFK Health Products",
  ],
  footerLeft: "\u5167\u5BB9\uFF1A\u521D\u6B65\u69CB\u601D\uFF0C\u4EC5\u4F9B\u5167\u90E8\u8A0E\u8AD6",
  footerRight: "2026\u5E74 6\u6708",
});

const bodyChildren = [
  h1("\u4E00\u3001\u80CC\u666F\u8207\u76EE\u7684"),
  body("PZC Group \u767E\u76DB\u5927\u901A\u5BB6\u65CF\u8FA6\u516C\u5BA4\uFF08\u4EE5\u4E0B\u7C21\u7A31\u300C\u5BB6\u65CF\u8FA6\u516C\u5BA4\u300D\uFF09\u65E8\u5728\u5EFA\u7ACB\u4E00\u500B\u5F9E\u5065\u5EB7\u7522\u54C1\u63A8\u5EE3\u5230\u8CA1\u5BCC\u7BA1\u7406\u7684\u5B8C\u6574\u751F\u614B\u5708\u3002\u7D93\u904E\u4E00\u6BB5\u6642\u9593\u7684\u696D\u52D9\u904B\u71DF\uFF0CVFK \u5065\u5EB7\u98DF\u54C1\u63A8\u5EE3\u8A08\u5283\u5DF2\u5EFA\u7ACB\u4E86\u5305\u542B\u56DB\u7A2E\u9032\u5834\u65B9\u6848\u7684\u6703\u54E1\u9AD4\u7CFB\uFF0C\u4F46\u5728\u5C08\u696D\u8A8D\u53EF\u548C\u54C1\u724C\u516C\u4FE1\u529B\u65B9\u9762\u4ECD\u7136\u6709\u63D0\u5347\u7A7A\u9593\u3002\u5728\u5BB6\u65CF\u8FA6\u516C\u5BA4\u884C\u696D\uFF0C\u5BA2\u6236\u5C0D\u65BC\u670D\u52D9\u63D0\u4F9B\u8005\u7684\u5C08\u696D\u80CC\u666F\u548C\u8A8D\u53EF\u8CC7\u683C\u6709\u8457\u5F88\u9AD8\u7684\u671F\u671B\uFF0C\u9019\u76F4\u63A5\u5F71\u97FF\u5BA2\u6236\u4FE1\u4EFB\u5EA6\u548C\u5408\u4F5C\u610F\u9858\u3002"),
  body("\u672C\u5EFA\u8B70\u66F8\u63D0\u51FA\u5EFA\u7ACB\u4E00\u500B\u5C6C\u65BC PZC Group \u81EA\u5BB6\u7684\u5C08\u696D\u8A8D\u53EF\u9AD4\u5236\uFF0C\u540D\u7A31\u521D\u6B65\u69CB\u601D\u70BA\u300CMCLUB \u5BB6\u65CF\u8FA6\u516C\u5BA4\u8A8D\u53EF\u9867\u554F\uFF08MCLUB Certified Family Office Advisor\uFF0CMCFOA\uFF09\u300D\u3002\u9019\u500B\u8A8D\u53EF\u9AD4\u5236\u5C07\u8207\u73FE\u6709\u7684 MCLUB \u6703\u54E1\u7D1A\u5225\u9AD4\u7CFB\u76F8\u7D50\u5408\uFF0C\u70BA\u5718\u968A\u6210\u54E1\u63D0\u4F9B\u4E00\u500B\u6E05\u6670\u7684\u5C08\u696D\u6210\u9577\u8DEF\u5F91\uFF0C\u540C\u6642\u63D0\u5347\u5BB6\u65CF\u8FA6\u516C\u5BA4\u670D\u52D9\u7684\u6574\u9AD4\u5C08\u696D\u5F62\u8C61\u3002"),

  h1("\u4E8C\u3001\u8A8D\u53EF\u9AD4\u5236\u6982\u89BD"),

  h2("2.1 \u8A8D\u53EF\u540D\u7A31"),
  body("\u5EFA\u8B70\u8A8D\u53EF\u540D\u7A31\u70BA\u300CMCLUB \u5BB6\u65CF\u8FA6\u516C\u5BA4\u8A8D\u53EF\u9867\u554F\u300D\uFF08\u82F1\u6587\uFF1AMCLUB Certified Family Office Advisor\uFF0CMCFOA\uFF09\u3002\u9019\u500B\u540D\u7A31\u5C07\u300CMCLUB\u300D\u54C1\u724C\u8207\u300C\u5BB6\u65CF\u8FA6\u516C\u5BA4\u8A8D\u53EF\u300D\u7684\u5C08\u696D\u5B9A\u4F4D\u76F4\u63A5\u7D50\u5408\uFF0C\u8B93\u5916\u754C\u4E00\u770B\u5C31\u77E5\u9053\u9019\u662F\u5C6C\u65BC\u5BB6\u65CF\u8FA6\u516C\u5BA4\u9818\u57DF\u7684\u5C08\u696D\u8CC7\u683C\u3002\u540C\u6642\uFF0C\u82F1\u6587\u7E2E\u5BEB MCFOA \u4EA6\u4FBF\u65BC\u570B\u969B\u5834\u666F\u7684\u4F7F\u7528\u548C\u5BA3\u50B3\u3002"),

  h2("2.2 \u8A8D\u53EF\u7D1A\u5225"),
  body("\u8A8D\u53EF\u9AD4\u5236\u8A2D\u8A08\u70BA\u4E09\u500B\u7D1A\u5225\uFF0C\u5C0D\u61C9\u4E0D\u540C\u7684\u5C08\u696D\u6DF1\u5EA6\u548C\u670D\u52D9\u7BC4\u570D\u3002\u5404\u7D1A\u5225\u7684\u8A2D\u8A08\u5145\u5206\u8003\u616E\u4E86\u73FE\u6709 MCLUB \u6703\u54E1\u9AD4\u7CFB\u7684\u7D1A\u5225\u5C0D\u61C9\u95DC\u4FC2\uFF0C\u78BA\u4FDD\u8A8D\u53EF\u9AD4\u5236\u80FD\u5920\u7121\u7E2B\u5D4C\u5165\u73FE\u6709\u696D\u52D9\u6D41\u7A0B\u4E4B\u4E2D\uFF0C\u800C\u4E0D\u662F\u53E6\u8D77\u7210\u7210\u7684\u984D\u5916\u9806\u7D1A\u3002"),

  makeTable(
    ["\u7D1A\u5225", "\u540D\u7A31", "\u5C0D\u61C9 MCLUB \u6703\u54E1\u7D1A\u5225", "\u5B9A\u4F4D"],
    [
      ["\u521D\u7D1A", "MCFOA Associate", "Plan A \u5165\u9580\u7D1A / Plan B \u9032\u968E\u7D1A", "\u57FA\u790E\u670D\u52D9\u63D0\u4F9B\u8005"],
      ["\u4E2D\u7D1A", "MCFOA Professional", "Plan B+ \u4E2D\u9AD8\u7D1A", "\u5C08\u696D\u8CA1\u5BCC\u9867\u554F"],
      ["\u9AD8\u7D1A", "MCFOA Fellow", "Plan C \u9AD8\u7AEF + \u5BB6\u65CF\u8FA6\u516C\u5BA4", "\u8CC7\u6DF1\u5BB6\u65CF\u8FA6\u516C\u5BA4\u5C08\u5BB6"],
    ]
  ),

  new Paragraph({ spacing: { before: 80 } }),

  h2("2.3 \u6838\u5FC3\u5B9A\u4F4D"),
  body("MCFOA \u8A8D\u53EF\u9AD4\u5236\u7684\u6838\u5FC3\u5B9A\u4F4D\u662F\u300C\u5065\u5EB7\u8CA1\u5BCC\u5408\u4E00\u300D\uFF0C\u9019\u662F PZC Group \u5340\u5225\u65BC\u50B3\u7D71\u5BB6\u65CF\u8FA6\u516C\u5BA4\u548C\u7406\u8CA1\u9867\u554F\u516C\u53F8\u7684\u7368\u7279\u50F9\u503C\u4E3B\u5F35\u3002\u50B3\u7D71\u7684\u7406\u8CA1\u8A8D\u53EF\u53EA\u805A\u7126\u65BC\u91D1\u878D\u7522\u54C1\u548C\u6295\u8CC7\u7D44\u5408\uFF0C\u800C MCFOA \u7684\u7368\u7279\u4E4B\u8655\u5728\u65BC\u5C07\u5065\u5EB7\u7BA1\u7406\uFF08VFK \u5065\u5EB7\u98DF\u54C1\u63A8\u5EE3\u8A08\u5283\uFF09\u3001\u5718\u968A\u904B\u71DF\u80FD\u529B\u548C\u5BB6\u65CF\u8CA1\u5BCC\u7BA1\u7406\u4E09\u8005\u7D50\u5408\uFF0C\u5F62\u6210\u4E00\u500B\u5B8C\u6574\u7684\u670D\u52D9\u751F\u614B\u5708\u3002\u9019\u500B\u5DEE\u7570\u5316\u5B9A\u4F4D\u80FD\u5920\u6709\u6548\u5730\u5C07 MCFOA \u8207\u5E02\u5834\u4E0A\u5176\u4ED6\u91D1\u878D\u8A8D\u53EF\u62C9\u958B\u8DDD\u96E2\u3002"),

  h1("\u4E09\u3001\u8AB2\u7A0B\u67B6\u69CB"),

  h2("3.1 \u521D\u7D1A\u8AB2\u7A0B\uFF08MCFOA Associate\uFF09"),
  body("\u521D\u7D1A\u8AB2\u7A0B\u65E8\u5728\u8B93\u5B78\u54E1\u638C\u63E1\u5BB6\u65CF\u8FA6\u516C\u5BA4\u7684\u57FA\u790E\u77E5\u8B58\u548C\u670D\u52D9\u6D41\u7A0B\uFF0C\u91CD\u9EDE\u653E\u5728\u7522\u54C1\u77E5\u8B58\u3001\u5BA2\u6236\u670D\u52D9\u548C\u5718\u968A\u904B\u71DF\u57FA\u790E\u3002\u9019\u500B\u7D1A\u5225\u5C0D\u61C9 Plan A \u548C Plan B \u6703\u54E1\uFF0C\u662F\u9032\u5165\u5BB6\u65CF\u8FA6\u516C\u5BA4\u751F\u614B\u7684\u7B2C\u4E00\u6B65\u3002\u8AB2\u7A0B\u5167\u5BB9\u7DCA\u5BC6\u56F4\u7E5E VFK \u5065\u5EB7\u98DF\u54C1\u63A8\u5EE3\u8A08\u5283\u548C MCLUB CRM \u5E73\u53F0\u7684\u5BE6\u969B\u904B\u4F5C\uFF0C\u78BA\u4FDD\u5B78\u54E1\u80FD\u5920\u7ACB\u5373\u5C07\u6240\u5B78\u61C9\u7528\u65BC\u65E5\u5E38\u696D\u52D9\u3002"),

  makeTable(
    ["\u6A21\u584A", "\u5167\u5BB9", "\u6642\u9577"],
    [
      ["\u5C0D\u884C\u6982\u8FF0", "\u5BB6\u65CF\u8FA6\u516C\u5BA4\u5B9A\u7FA9\u3001PZC Group \u69CB\u67B6\u3001\u670D\u52D9\u7BC4\u570D", "2 \u5C0F\u6642"],
      ["VFK \u7522\u54C1\u77E5\u8B58", "\u56DB\u7A2E\u65B9\u6848\u8A73\u89E3\u3001BV \u7A4D\u5206\u5236\u3001\u5065\u5EB7\u7406\u5FF5", "3 \u5C0F\u6642"],
      ["\u5BA2\u6236\u670D\u52D9\u57FA\u790E", "\u5BA2\u6236\u9700\u6C42\u5206\u6790\u3001CRM \u7CFB\u7D71\u64CD\u4F5C\u3001\u57FA\u672C\u793A\u7BC4", "3 \u5C0F\u6642"],
      ["\u5718\u968A\u904B\u71DF\u5165\u9580", "\u63A8\u5EE3\u7B56\u7565\u3001\u664B\u5347\u6A5F\u5236\u3001\u5408\u898F\u8981\u6C42", "2 \u5C0F\u6642"],
    ]
  ),

  new Paragraph({ spacing: { before: 80 } }),

  h2("3.2 \u4E2D\u7D1A\u8AB2\u7A0B\uFF08MCFOA Professional\uFF09"),
  body("\u4E2D\u7D1A\u8AB2\u7A0B\u91DD\u5C0D\u5DF2\u7D93\u6709\u4E00\u5B9A\u696D\u52D9\u57FA\u790E\u7684 Plan B+ \u6703\u54E1\uFF0C\u5167\u5BB9\u6DB5\u84CB\u66F4\u6DF1\u5165\u7684\u8CA1\u5BCC\u7BA1\u7406\u77E5\u8B58\u548C\u5BA2\u6236\u670D\u52D9\u80FD\u529B\u3002\u5B78\u54E1\u5C07\u5B78\u7FD2\u5916\u532F\u98A8\u96AA\u7BA1\u7406\u3001\u8CA1\u5BCC\u4FDD\u5168\u57FA\u790E\u548C\u6578\u64DA\u5206\u6790\u7B49\u5C08\u696D\u6280\u80FD\u3002\u9019\u500B\u7D1A\u5225\u7684\u7279\u9EDE\u662F\u5F15\u5165\u4E86 PZC Group \u7368\u6709\u7684 FX Risk Modelling \u5916\u532F\u98A8\u96AA\u5EFA\u6A21\u670D\u52D9\u4F5C\u70BA\u6559\u6750\uFF0C\u8B93\u5B78\u54E1\u80FD\u5920\u5B78\u7FD2\u5230\u771F\u6B63\u5728\u5E02\u5834\u4E0A\u904B\u4F5C\u7684\u98A8\u96AA\u7BA1\u7406\u5DE5\u5177\u3002"),

  makeTable(
    ["\u6A21\u584A", "\u5167\u5BB9", "\u6642\u9577"],
    [
      ["\u5916\u532F\u98A8\u96AA\u7BA1\u7406", "FX Risk Modelling \u5EFA\u6A21\u3001\u58D3\u529B\u6E2C\u8A66\u3001\u5C0D\u6C96\u7B56\u7565\u57FA\u790E", "4 \u5C0F\u6642"],
      ["\u8CA1\u5BCC\u4FDD\u5168\u57FA\u790E", "\u8CC7\u7522\u914D\u7F6E\u539F\u5247\u3001\u98A8\u96AA\u5206\u6563\u3001\u57FA\u672C\u5206\u6790", "4 \u5C0F\u6642"],
      ["\u9AD8\u7AEF\u5BA2\u6236\u670D\u52D9", "\u5BB6\u65CF\u9700\u6C42\u8A3A\u65B7\u3001\u5B9A\u5236\u5316\u65B9\u6848\u3001\u9577\u671F\u95DC\u4FC2\u7BA1\u7406", "3 \u5C0F\u6642"],
      ["\u6578\u64DA\u5206\u6790\u5BE6\u52D9", "CRM \u6578\u64DA\u89E3\u8B80\u3001\u5E02\u5834\u8D8B\u52E2\u5206\u6790\u3001\u5831\u544A\u64B0\u5BEB", "3 \u5C0F\u6642"],
    ]
  ),

  new Paragraph({ spacing: { before: 80 } }),

  h2("3.3 \u9AD8\u7D1A\u8AB2\u7A0B\uFF08MCFOA Fellow\uFF09"),
  body("\u9AD8\u7D1A\u8AB2\u7A0B\u5C08\u70BA Plan C \u9AD8\u7AEF\u6703\u54E1\u548C\u5BB6\u65CF\u8FA6\u516C\u5BA4\u6838\u5FC3\u6210\u54E1\u8A2D\u8A08\uFF0C\u5167\u5BB9\u6DB5\u84CB\u96E2\u5CB8\u8CA1\u5BCC\u67B6\u69CB\u3001\u5408\u898F\u76E3\u7BA1\u548C\u9818\u5C0E\u529B\u767C\u5C55\u3002\u9019\u500B\u7D1A\u5225\u7684\u5B78\u54E1\u5C07\u5177\u5099\u72EC\u7ACB\u70BA\u9AD8\u6DE8\u503C\u5BA2\u6236\u63D0\u4F9B\u5BB6\u65CF\u8FA6\u516C\u5BA4\u670D\u52D9\u7684\u80FD\u529B\uFF0C\u4E26\u80FD\u5920\u5E36\u9818\u5718\u968A\u904B\u71DF\u548C\u696D\u52D9\u64F4\u5C55\u3002\u9AD8\u7D1A\u8AB2\u7A0B\u7684\u4E00\u500B\u91CD\u8981\u7279\u8272\u662F\u5305\u542B\u5BE6\u969B\u6848\u4F8B\u7814\u8A0B\u548C\u5C08\u5BB6\u5C0E\u5E2B\u5236\uFF0C\u78BA\u4FDD\u5B78\u54E1\u4E0D\u50C5\u638C\u63E1\u7406\u8AD6\u77E5\u8B58\uFF0C\u66F4\u80FD\u5728\u5BE6\u969B\u5834\u666F\u4E2D\u9748\u6D3B\u904B\u7528\u3002"),

  makeTable(
    ["\u6A21\u584A", "\u5167\u5BB9", "\u6642\u9577"],
    [
      ["\u96E2\u5CB8\u8CA1\u5BCC\u67B6\u69CB", "\u4FE1\u8A17\u8A2D\u7ACB\u3001\u96E2\u5CB8\u7D50\u69CB\u3001\u7A05\u52D9\u898F\u5283\u57FA\u790E", "4 \u5C0F\u6642"],
      ["\u5408\u898F\u8207\u76E3\u7BA1", "\u9999\u6E2F SFC \u6846\u67B6\u3001AML \u53CD\u6D17\u9322\u3001\u4FDD\u96AA\u689D\u4F8B", "3 \u5C0F\u6642"],
      ["\u9818\u5C0E\u529B\u8207\u6559\u5B78", "\u5718\u968A\u5EFA\u8A2D\u3001\u57F9\u8A13\u9AD4\u7CFB\u3001\u7E3E\u6548\u7BA1\u7406", "3 \u5C0F\u6642"],
      ["\u5C08\u5BB6\u7814\u8A0B\u5C0E\u5E2B", "\u5BE6\u969B\u6848\u4F8B\u7814\u8A0B\u3001\u4E00\u5C0D\u4E00\u5C0E\u5E2B\u3001\u6210\u679C\u5C55\u793A", "6 \u5C0F\u6642"],
    ]
  ),

  new Paragraph({ spacing: { before: 80 } }),

  h1("\u56DB\u3001\u8003\u8A55\u6A5F\u5236"),

  h2("4.1 \u8003\u8A55\u65B9\u5F0F"),
  body("\u8003\u8A55\u6A5F\u5236\u8A2D\u8A08\u70BA\u7B46\u8A66\u52A0\u5BE6\u52D9\u7684\u5F62\u5F0F\uFF0C\u78BA\u4FDD\u5B78\u54E1\u4E0D\u50C5\u638C\u63E1\u7406\u8AD6\u77E5\u8B58\uFF0C\u66F4\u80FD\u5728\u5BE6\u969B\u696D\u52D9\u4E2D\u9748\u6D3B\u904B\u7528\u3002\u5404\u7D1A\u5225\u7684\u8003\u8A55\u6A19\u6E96\u548C\u65B9\u5F0F\u6839\u64DA\u5176\u5C08\u696D\u6DF1\u5EA6\u800C\u6709\u6240\u4E0D\u540C\uFF0C\u521D\u7D1A\u5074\u91CD\u57FA\u790E\u77E5\u8B58\u7684\u638C\u63E1\uFF0C\u4E2D\u7D1A\u5F37\u8ABF\u5206\u6790\u80FD\u529B\uFF0C\u9AD8\u7D1A\u5247\u8981\u6C42\u5C08\u6848\u7814\u7A76\u548C\u5BE6\u622A\u5C55\u793A\u3002"),

  makeTable(
    ["\u7D1A\u5225", "\u7B46\u8A66\u4F54\u6BD4", "\u5BE6\u52D9\u4F54\u6BD4", "\u8003\u6838\u5F62\u5F0F"],
    [
      ["\u521D\u7D1A Associate", "60%", "40%", "\u9078\u64C7\u984C + \u7C21\u7B54\u984C\uFF0C\u6559\u5B78\u60C5\u666F\u6A21\u64EC"],
      ["\u4E2D\u7D1A Professional", "50%", "50%", "\u6848\u4F8B\u5206\u6790 + \u98A8\u96AA\u5831\u544A\u64B0\u5BEB"],
      ["\u9AD8\u7D1A Fellow", "30%", "70%", "\u5C08\u984C\u7814\u7A76\u5831\u544A + \u5C0D\u5CA9\u7B54\u8FA9"],
    ]
  ),

  new Paragraph({ spacing: { before: 80 } }),

  h2("4.2 \u5347\u7D1A\u8207\u670D\u52D9"),
  body("\u8A8D\u53EF\u6709\u6548\u671F\u70BA\u4E24\u5E74\uFF0C\u5230\u671F\u5F8C\u9700\u9032\u884C\u7E8C\u671F\u8003\u6838\u3002\u7E8C\u671F\u65B9\u5F0F\u70BA\u63D0\u4EA4\u5C08\u696D\u767C\u5C55\u5831\u544A\u6216\u53C3\u52A0\u9032\u4FEE\u8AB2\u7A0B\uFF0C\u78BA\u4FDD\u8A8D\u53EF\u9867\u554F\u7684\u5C08\u696D\u77E5\u8B58\u8207\u884C\u696D\u767C\u5C55\u4FDD\u6301\u540C\u6B65\u3002\u9019\u500B\u5236\u5EA6\u7684\u8A2D\u8A08\u65E2\u80FD\u4FDD\u8B49\u8A8D\u53EF\u7684\u6642\u6548\u6027\uFF0C\u53C8\u80FD\u63A8\u52D5\u9867\u554F\u6301\u7E8C\u5B78\u7FD2\u548C\u6210\u9577\u3002\u540C\u6642\uFF0C\u7E8C\u671F\u8003\u6838\u4E5F\u662F\u4E00\u500B\u91CD\u8981\u7684\u89F8\u9EDE\uFF0C\u53EF\u4EE5\u904E\u6FFE\u7D93\u7DCA\u71DF\u904B\u72C0\u6CC1\u4E0D\u4F73\u7684\u5718\u968A\u6210\u54E1\uFF0C\u7DAD\u8B77\u6574\u9AD4\u670D\u52D9\u54C1\u8CEA\u3002"),

  h1("\u4E94\u3001\u8207\u73FE\u6709\u6703\u54E1\u9AD4\u7CFB\u7684\u6574\u5408"),

  h2("5.1 \u5C0D\u61C9\u95DC\u4FC2"),
  body("MCFOA \u8A8D\u53EF\u9AD4\u5236\u8207\u73FE\u6709 MCLUB \u6703\u54E1\u9AD4\u7CFB\u7684\u6574\u5408\u662F\u6574\u500B\u65B9\u6848\u7684\u6838\u5FC3\u512A\u52E2\u3002\u73FE\u6709\u7684 VFK \u56DB\u7A2E\u65B9\u6848\u548C MCLUB \u6703\u54E1\u7D1A\u5225\u5DF2\u7D93\u5EFA\u7ACB\u4E86\u5B8C\u5584\u7684\u5BA2\u6236\u5206\u5C64\u7D50\u69CB\uFF0CMCFOA \u8A8D\u53EF\u53EA\u662F\u5728\u9019\u500B\u7D50\u69CB\u4E4B\u4E0A\u589E\u52A0\u5C08\u696D\u8CC7\u683C\u7684\u8A8D\u53EF\u5C64\u3002\u9019\u610F\u5473\u8457\u73FE\u6709\u6703\u54E1\u4E0D\u9700\u8981\u984D\u5916\u6295\u5165\u6642\u9593\u548C\u91D1\u9322\u53BB\u53E6\u5916\u8003\u53D6\u7368\u7ACB\u7684\u8A8D\u53EF\uFF0C\u800C\u662F\u5728\u6B64\u6B65\u968E\u7D1A\u5230\u6642\u81EA\u7136\u5730\u7372\u5F97\u76F8\u61C9\u7D1A\u5225\u7684\u5C08\u696D\u8A8D\u53EF\u3002"),

  makeTable(
    ["VFK \u65B9\u6848", "\u6295\u8CC7\u91D1\u984D", "BV \u7A4D\u5206", "MCLUB \u6703\u54E1", "MCFOA \u5C0D\u61C9"],
    [
      ["\u65B9\u6848\u4E00", "$1,980", "150 BV", "Plan A \u5165\u9580\u7D1A", "\u53EF\u7533\u8ACB Associate"],
      ["\u65B9\u6848\u4E8C", "$8,800", "750 BV", "Plan B \u9032\u968E\u7D1A", "\u53EF\u7533\u8ACB Associate"],
      ["\u65B9\u6848\u4E09", "$16,800", "1,500 BV", "Plan B+ \u4E2D\u9AD8\u7D1A", "\u53EF\u7533\u8ACB Professional"],
      ["\u65B9\u6848\u56DB", "$33,800", "3,000 BV", "Plan C \u9AD8\u7AEF", "\u53EF\u7533\u8ACB Fellow"],
    ]
  ),

  new Paragraph({ spacing: { before: 80 } }),

  h2("5.2 \u8A73\u7D30\u6574\u5408\u65B9\u5F0F"),
  body("\u5728\u5BE6\u969B\u904B\u4F5C\u4E2D\uFF0C\u8A8D\u53EF\u7684\u7533\u8ACB\u548C\u5BA1\u6838\u53EF\u4EE5\u901A\u904E MCLUB CRM \u5E73\u53F0\u5BE6\u73FE\u3002\u73FE\u6709\u7684 CRM \u7CFB\u7D71\u5DF2\u7D93\u5305\u542B\u5BA2\u6236\u7BA1\u7406\u3001\u8A02\u55AE\u7BA1\u7406\u3001\u4EA7\u54C1\u7BA1\u7406\u3001\u4F63\u91D1\u7BA1\u7406\u7B49\u529F\u80FD\u6A21\u584A\uFF0C\u53EA\u9700\u5728\u73FE\u6709\u67B6\u69CB\u4E0A\u65B0\u589E\u4E00\u500B\u300C\u8A8D\u53EF\u7BA1\u7406\u300D\u6A21\u584A\uFF0C\u5373\u53EF\u5BE6\u73FE\u8A8D\u53EF\u7533\u8ACB\u3001\u5BA1\u6838\u3001\u767C\u8B49\u548C\u7E8C\u671F\u7BA1\u7406\u7684\u5168\u6D41\u7A0B\u6578\u4F4D\u5316\u3002\u9019\u6A23\u4E0D\u50C5\u80FD\u63D0\u9AD8\u904B\u71DF\u6548\u7387\uFF0C\u9084\u80FD\u901A\u904E CRM \u5E73\u53F0\u7684\u6578\u64DA\u5206\u6790\u529F\u80FD\uFF0C\u8FFD\u8E64\u8A8D\u53EF\u9867\u554F\u7684\u670D\u52D9\u8868\u73FE\u548C\u5BA2\u6236\u53CD\u994B\u3002"),

  h1("\u516D\u3001\u5BE6\u65BD\u8DEF\u5F91\u5EFA\u8B70"),

  h2("6.1 \u77ED\u671F\u884C\u52D5\uFF08\u7B2C\u4E00\u9636\u6BB5\uFF1A1\u20133 \u500B\u6708\uFF09"),
  body("\u77ED\u671F\u884C\u52D5\u7684\u91CD\u9EDE\u662F\u78BA\u7ACB\u8A8D\u53EF\u9AD4\u5236\u7684\u6838\u5FC3\u6846\u67B6\u548C\u57FA\u790E\u8AB2\u7A0B\u5167\u5BB9\u3002\u9996\u5148\u9700\u8981\u5B8C\u6210\u521D\u7D1A\u8AB2\u7A0B\u7684\u6559\u6750\u958B\u767C\uFF0C\u5305\u62EC PZC Group \u7C21\u4ECB\u3001VFK \u7522\u54C1\u77E5\u8B58\u3001\u5BA2\u6236\u670D\u52D9\u6D41\u7A0B\u548C\u5718\u968A\u904B\u71DF\u57FA\u790E\u7B49\u6A21\u584A\u3002\u540C\u6642\uFF0C\u9700\u8981\u5728 MCLUB CRM \u5E73\u53F0\u4E0A\u65B0\u589E\u8A8D\u53EF\u7BA1\u7406\u6A21\u584A\uFF0C\u5BE6\u73FE\u57FA\u672C\u7684\u7533\u8ACB\u3001\u5BA1\u6838\u548C\u767C\u8B49\u529F\u80FD\u3002\u5EFA\u8B70\u5148\u9078\u64C7\u4E00\u5C0F\u6279\u5167\u90E8\u6E2C\u8A66\u7528\u6236\u9032\u884C\u8A66\u9EDE\uFF0C\u6536\u96C6\u53CD\u994B\u5F8C\u518D\u9032\u884C\u8ABF\u6574\u548C\u512A\u5316\u3002"),

  h2("6.2 \u4E2D\u671F\u767C\u5C55\uFF08\u7B2C\u4E8C\u9636\u6BB5\uFF1A3\u20136 \u500B\u6708\uFF09"),
  body("\u4E2D\u671F\u767C\u5C55\u968E\u6BB5\u5C07\u63A8\u51FA\u4E2D\u7D1A\u548C\u9AD8\u7D1A\u8AB2\u7A0B\uFF0C\u4E26\u5EFA\u7ACB\u5B8C\u6574\u7684\u8003\u8A55\u9AD4\u7CFB\u3002\u540C\u6642\uFF0C\u53EF\u4EE5\u8003\u616E\u5C07\u8A8D\u53EF\u9AD4\u5236\u5411\u5916\u90E8\u5408\u4F5C\u4F19\u4F34\u958B\u653E\uFF0C\u4F8B\u5982\u540C\u884C\u696D\u7684\u5065\u5EB7\u7522\u54C1\u63A8\u5EE3\u5E73\u53F0\u6216\u8CA1\u5BCC\u7BA1\u7406\u670D\u52D9\u63D0\u4F9B\u8005\u3002\u9019\u500B\u968E\u6BB5\u7684\u91CD\u9EDE\u5DE5\u4F5C\u5305\u62EC\uFF1A\u958B\u767C\u4E2D\u7D1A\u6559\u6750\uFF08\u5305\u542B FX Risk Modelling \u5BE6\u52D9\u6559\u6750\uFF09\u3001\u8A2D\u8A08\u4E26\u5BE6\u65BD\u7B46\u8A66\u548C\u5BE6\u52D9\u8003\u8A55\u6D41\u7A0B\u3001\u5EFA\u7ACB\u8003\u8A66\u984C\u5EAB\u548C\u8A55\u5206\u6A19\u6E96\u3001\u5728 CRM \u5E73\u53F0\u4E0A\u5B8C\u5584\u8A8D\u53EF\u7E8C\u671F\u7BA1\u7406\u529F\u80FD\u3002"),

  h2("6.3 \u9577\u671F\u76EE\u6A19\uFF08\u7B2C\u4E09\u9636\u6BB5\uFF1A6 \u500B\u6708\u4EE5\u5F8C\uFF09"),
  body("\u9577\u671F\u76EE\u6A19\u662F\u5C07 MCFOA \u6253\u9020\u6210\u70BA\u5BB6\u65CF\u8FA6\u516C\u5BA4\u884C\u696D\u5167\u5177\u516C\u8B58\u5EA6\u7684\u5C08\u696D\u8A8D\u53EF\u54C1\u724C\u3002\u53EF\u4EE5\u8003\u616E\u5C0B\u6C42\u5B78\u8853\u6A5F\u69CB\u5408\u4F5C\uFF0C\u5982\u9999\u6E2F\u5927\u5B78\u5C08\u696D\u9032\u4FEE\u5B78\u9662\uFF08HKU SPACE\uFF09\u6216\u57CE\u5E02\u5927\u5B78\u5C08\u696D\u9032\u4FEE\u5B78\u9662\uFF0C\u5408\u4F5C\u958B\u8AEE MCFOA \u8A8D\u53EF\u8AB2\u7A0B\uFF0C\u63D0\u5347\u8A8D\u53EF\u7684\u5B78\u8853\u516C\u4FE1\u529B\u3002\u53E6\u5916\uFF0C\u4E5F\u53EF\u4EE5\u63A2\u7D22\u5340\u584A\u93C8\u8A8D\u8B49\u6280\u8853\uFF0C\u4EE5\u6578\u4F4D\u8B49\u66F8\u7684\u5F62\u5F0F\u767C\u884C MCFOA \u8A8D\u53EF\uFF0C\u63D0\u9AD8\u9A57\u8B49\u6548\u7387\u548C\u9632\u507D\u80FD\u529B\u3002"),

  h1("\u4E03\u3001\u6CE8\u610F\u4E8B\u9805"),

  h2("7.1 \u76E3\u7BA1\u5408\u898F"),
  body("\u5728\u5EFA\u7ACB\u8A8D\u53EF\u9AD4\u5236\u6642\uFF0C\u5FC5\u9808\u7279\u5225\u6CE8\u610F\u9999\u6E2F\u5C0D\u91D1\u878D\u76E3\u7BA1\u7684\u898F\u5B9A\u3002MCFOA \u8A8D\u53EF\u4E26\u4E0D\u7B49\u540C\u65BC SFC \u6301\u724C\u7684\u91D1\u878D\u670D\u52D9\uFF0C\u56E0\u6B64\u5728\u8AB2\u7A0B\u5167\u5BB9\u548C\u5BA3\u50B3\u4E2D\u5FC5\u9808\u660E\u78BA\u5283\u5B9A\u8FB9\u754C\u3002\u5177\u9AD4\u800C\u8A00\uFF0CMCFOA \u8A8D\u53EF\u9867\u554F\u4E0D\u61C9\u63D0\u4F9B\u9700\u8981 SFC \u724C\u7167\u624D\u80FD\u63D0\u4F9B\u7684\u670D\u52D9\uFF0C\u4F8B\u5982\u8B49\u5238\u6295\u8CC7\u5EFA\u8B70\u3001\u4FC3\u92B7\u96C6\u9E4A\u6295\u8CC7\u8A08\u5283\u7B49\u3002\u8AB2\u7A0B\u5167\u5BB9\u61C9\u4EE5\u77E5\u8B58\u50B3\u6388\u548C\u5C08\u696D\u6280\u80FD\u57F9\u990A\u70BA\u4E3B\uFF0C\u800C\u975E\u76F4\u63A5\u63D0\u4F9B\u6295\u8CC7\u5EFA\u8B70\u670D\u52D9\u3002\u5EFA\u8B70\u5728\u6B63\u5F0F\u63A8\u51FA\u524D\u8A73\u7D30\u8A8B\u8A62\u6CD5\u5F8B\u9867\u554F\u7684\u610F\u898B\uFF0C\u78BA\u4FDD\u6574\u500B\u8A8D\u53EF\u9AD4\u5236\u5728\u76E3\u7BA1\u5408\u898F\u7684\u5B89\u5168\u7BC4\u570D\u5167\u904B\u4F5C\u3002"),

  h2("7.2 \u54C1\u724C\u5DEE\u7570\u5316"),
  body("MCFOA \u8A8D\u53EF\u9AD4\u5236\u7684\u6210\u529F\u53D6\u6C7A\u65BC\u5176\u80FD\u5426\u8207\u5E02\u5834\u4E0A\u5176\u4ED6\u7406\u8CA1\u8A8D\u53EF\uFF08\u5982 CFP\u3001IFP\u3001RFP \u7B49\uFF09\u5F62\u6210\u660E\u78BA\u5DEE\u7570\u5316\u3002\u300C\u5065\u5EB7\u8CA1\u5BCC\u5408\u4E00\u300D\u7684\u5B9A\u4F4D\u662F\u6700\u6838\u5FC3\u7684\u5DEE\u7570\u5316\u8CC7\u7522\uFF0C\u4F46\u9084\u9700\u8981\u5728\u5BA3\u50B3\u548C\u6559\u6750\u4E2D\u4E0D\u65AD\u5F37\u5316\u9019\u500B\u6982\u5FF5\u3002\u5EFA\u8B70\u5728\u8AB2\u7A0B\u8A2D\u8A08\u4E2D\u7A81\u51FA VFK \u5065\u5EB7\u98DF\u54C1\u63A8\u5EE3\u8A08\u5283\u7684\u5BE6\u969B\u904B\u4F5C\u7D93\u9A57\u3001FX Risk Modelling \u7684\u72AC\u5BB6\u6280\u8853\u512A\u52E2\uFF0C\u4EE5\u53CA MCLUB CRM \u5E73\u53F0\u7684\u6578\u4F4D\u5316\u904B\u71DF\u80FD\u529B\uFF0C\u8B93\u5B78\u54E1\u611F\u53D7\u5230\u9019\u500B\u8A8D\u53EF\u7684\u5BE6\u7528\u50F9\u503C\u548C\u72EC\u7279\u6027\u3002"),
];

// ── Assemble document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 24, color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.body) },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.body) },
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.body) },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover (no page number)
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: coverChildren,
    },
    // Section 2: Body
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
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
      children: bodyChildren,
    },
  ],
});

// ── Export ──
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/MCLUB_Certification_Proposal.docx", buf);
  console.log("Document generated: MCLUB_Certification_Proposal.docx");
});
