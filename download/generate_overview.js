const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Footer, PageNumber, AlignmentType, WidthType, BorderStyle, ShadingType,
} = require("docx");

const accent = "C9A84C";
const dark = "1A1A1A";
const body = "000000";
const surface = "F5F2E8";

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: accent },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 22, color: "1A1A1A", font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
  });
}

function dataCell(text, width, bg) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: bg },
    borders: { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [new Paragraph({ spacing: { line: 280 }, children: [new TextRun({ text, size: 20, color: body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
  });
}

const products = [
  {
    name: "VFK \u5065\u5eb7\u98df\u54c1",
    role: "\u5165\u9580\u7522\u54c1",
    desc: "\u5065\u5eb7\u98df\u54c1\u4fc3\u9032\u65b9\u6848\uff0c\u6db5\u84cb 4 \u5957\u65b9\u6848\uff08A/B/B+/C\uff09\uff0c\u6536\u8cbb HK$1,980 - $33,800\u3002\u5171 7 \u7d1a\u4fc3\u9032\u6a5f\u5236\u3001BV \u9ede\u6578\u5236\u5ea6\uff0c\u8b93\u5718\u968a\u901a\u904e\u5065\u5eb7\u7522\u54c1\u5165\u9580\u4e26\u5be6\u73fe\u6536\u5165\u3002",
    target: "\u5e0c\u671b\u901a\u904e\u5065\u5eb7\u7522\u54c1\u5275\u696d\u7684\u5ba2\u6236",
  },
  {
    name: "MCLUB \u6703\u54e1\u7ba1\u7406",
    role: "\u904b\u71df\u5de5\u5177",
    desc: "\u6578\u5b57\u5316\u6703\u54e1\u7ba1\u7406\u7cfb\u7d71\uff0c\u529f\u80fd\u5305\u62ec\u5ba2\u6236\u7ba1\u7406\u3001\u8a02\u55ae\u8ffd\u8e64\u3001\u5718\u968a\u7e3e\u6548\u5206\u6790\u3001\u591a\u5e63\u7a2e\u5100\u8868\u677f\u3002\u652f\u63f4\u4e0b\u7dda\u63a8\u5ee3\u88c2\u8b8a\uff0c\u7528\u6578\u64da\u9a57\u52d5\u5718\u968a\u904b\u71df\u3002",
    target: "\u5718\u968a\u7ba1\u7406\u4eba\u54e1\u53ca\u5168\u9ad4\u5718\u968a\u6210\u54e1",
  },
  {
    name: "FX Risk Modelling",
    role: "\u5c08\u696d\u670d\u52d9",
    desc: "\u5916\u5706\u98a8\u96aa\u5efa\u6a21\u670d\u52d9\uff0c\u63d0\u4f9b\u58d3\u529b\u6e2c\u8a66\u3001\u591a\u5e63\u7a2e\u5c0d\u8861\u5206\u6790\u3001\u5e63\u503c\u6ce2\u52d5\u5f71\u97ff\u8a55\u4f30\u53ca\u57fa\u672c\u5c0d\u6d96\u7b56\u7565\u3002\u5e6b\u52a9\u5ba2\u6236\u7ba1\u7406\u5703\u7387\u98a8\u96aa\uff0c\u63d0\u5347\u8ca0\u50b5\u7ba1\u7406\u80fd\u529b\u3002",
    target: "\u6709\u5916\u5706\u98a8\u96aa\u9700\u6c42\u7684\u5bb6\u65cf\u5ba2\u6236",
  },
  {
    name: "\u5bb6\u65cf\u8fa6\u516c\u5ba4\u8ca1\u5bcc\u7ba1\u7406",
    role: "\u7d42\u6975\u76ee\u6a19",
    desc: "\u7d09\u5408\u5168\u90e8\u670d\u52d9\u7684\u6700\u9ad8\u5c64\u6b21\u89e3\u6c7a\u65b9\u6848\uff0c\u5305\u62ec\u5bb6\u65cf\u8ca1\u5bcc\u898f\u5283\u3001\u8de8\u570b\u8cc7\u7522\u914d\u7f6e\u3001\u5167\u5730\u4f01\u696d\u9999\u6e2f IPO \u8f14\u5c0e\u3001\u53cd\u6d17\u9322\u5408\u898f\u7b49\u5168\u65b9\u4f4d\u5bb6\u65cf\u8fa6\u516c\u5ba4\u670d\u52d9\u3002",
    target: "\u9ad8\u6de8\u503c\u5bb6\u65cf\u53ca\u4f01\u696d\u5bb6\u5ba2\u6236",
  },
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 20, color: body },
        paragraph: { spacing: { line: 280 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "PZC Group ", size: 16, color: "999999", font: { ascii: "Calibri" } }),
            new TextRun({ text: "|  \u4e1a\u52a1\u7ba1\u7406\u7167", size: 16, color: "999999", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
            new TextRun({ text: "  ", size: 16 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }),
          ],
        })],
      }),
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: accent, space: 10 } },
        children: [new TextRun({ text: "PZC Group \u6838\u5fc3\u696d\u52d1\u7ba1\u7406\u7167", bold: true, size: 32, color: dark, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
      }),
      // Subtitle
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: "\u5f9e\u5065\u5eb7\u5165\u9580\u5230\u5bb6\u65cf\u8fa6\u516c\u5ba4 \u2014 \u4e00\u6b65\u4e00\u6b65\u5efa\u7acb\u5c08\u696d\u57fa\u790e", size: 20, color: "666666", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      }),
      // Flow arrow
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({ text: "VFK \u5065\u5eb7\u7522\u54c1", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: "  \u2192  ", size: 20, color: "999999" }),
          new TextRun({ text: "MCLUB \u5718\u968a\u904b\u71df", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: "  \u2192  ", size: 20, color: "999999" }),
          new TextRun({ text: "FX Risk \u5c08\u696d\u670d\u52d9", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: "  \u2192  ", size: 20, color: "999999" }),
          new TextRun({ text: "\u5bb6\u65cf\u8fa6\u516c\u5ba4", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
        ],
      }),
      // Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [headerCell("\u7522\u54c1", 18), headerCell("\u5b9a\u4f4d", 12), headerCell("\u4ec0\u9ebc\u662f\u5b83\uff1f", 45), headerCell("\u670d\u52d9\u5c0d\u8c61", 25)],
          }),
          ...products.map((p, i) => new TableRow({
            children: [
              new TableCell({
                width: { size: 18, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: accent },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.name, bold: true, size: 20, color: "1A1A1A", font: { eastAsia: "Microsoft YaHei" } })] })],
              }),
              new TableCell({
                width: { size: 12, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: surface },
                borders: { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.role, bold: true, size: 20, color: dark, font: { eastAsia: "Microsoft YaHei" } })] })],
              }),
              dataCell(p.desc, 45, i % 2 === 0 ? "FFFFFF" : surface),
              dataCell(p.target, 25, i % 2 === 0 ? "FFFFFF" : surface),
            ],
          })),
        ],
      }),
      // Bottom note
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300 },
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "E0E0E0", space: 10 } },
        children: [new TextRun({ text: "\u5168\u7403\u696d\u52d1\u7ba1\u7406\u96c6\u5718  |  \u5065\u5eb7\u30fb\u8ca1\u5bcc\u30fb\u5c08\u696d", size: 18, color: "999999", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/PZC_Group_\u6838\u5fc3\u696d\u52d9\u7ba1\u7406\u7167.docx", buf);
  console.log("Done!");
});
