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
    name: "\u65e5\u672c\u7269\u696d\u6295\u8cc7",
    role: "\u6295\u8cc7\u670d\u52d9",
    desc: "\u70ba\u5ba2\u6236\u63d0\u4f9b\u65e5\u672c\u512a\u8cea\u7269\u696d\u6295\u8cc7\u6a5f\u6703\uff0c\u6db5\u84cb\u6771\u4eac\u3001\u5927\u962a\u7b49\u4e3b\u8981\u57ce\u5e02\u4f4f\u5b85\u53ca\u5546\u696d\u7269\u696d\u3002\u5c08\u696d\u5718\u968a\u63d0\u4f9b\u9078\u5740\u5206\u6790\u3001\u8cb8\u6b3e\u5b89\u6392\u3001\u7269\u696d\u7ba1\u7406\u4e00\u7ad9\u5f0f\u670d\u52d9\u3002",
    target: "\u6709\u65e5\u672c\u7269\u696d\u6295\u8cc7\u9700\u6c42\u7684\u5ba2\u6236",
  },
  {
    name: "\u8056\u591a\u7f8e\u516c\u6c11\u8a08\u5283",
    role: "\u79fb\u6c11\u670d\u52d9",
    desc: "\u900f\u904e\u8056\u591a\u7f8e\u53ca\u666e\u6797\u897f\u6bd4\u6295\u8cc7\u5165\u7c4d\u8a08\u5283\uff0c\u70ba\u5ba2\u6236\u63d0\u4f9b\u7b2c\u4e8c\u8b77\u7167\u89e3\u6c7a\u65b9\u6848\u3002\u5feb\u901f\u5be9\u6279\u3001\u514d\u7c3d\u591a\u570b\uff0c\u52a9\u529b\u5168\u7403\u8cc7\u7522\u914d\u7f6e\u53ca\u51fa\u884c\u4fbf\u5229\u3002",
    target: "\u5e0c\u671b\u7372\u5f97\u7b2c\u4e8c\u8b77\u7167\u7684\u5ba2\u6236",
  },
  {
    name: "NPC \u57fa\u91d1",
    role: "\u57fa\u91d1\u6295\u8cc7",
    desc: "NPC \u57fa\u91d1\u5c08\u6ce8\u65bc\u65b0\u8208\u5e02\u5834\u53ca\u53e6\u985e\u6295\u8cc7\uff0c\u70ba\u6295\u8cc7\u8005\u63d0\u4f9b\u591a\u5143\u5316\u8cc7\u7522\u914d\u7f6e\u65b9\u6848\u3002\u7531\u5c08\u696d\u57fa\u91d1\u7d93\u7406\u7ba1\u7406\uff0c\u8ffd\u6c42\u7a69\u5065\u56de\u5831\u3002",
    target: "\u5c0b\u6c42\u591a\u5143\u5316\u6295\u8cc7\u7684\u5ba2\u6236",
  },
  {
    name: "\u5bb6\u65cf\u4fe1\u8a17",
    role: "\u4fe1\u8a17\u670d\u52d9",
    desc: "\u70ba\u9ad8\u6de8\u503c\u5bb6\u65cf\u8a2d\u7acb\u4fe1\u8a17\u67b6\u69cb\uff0c\u5be6\u73fe\u8cc7\u7522\u4fdd\u8b77\u3001\u8ca1\u5bcc\u50b3\u627f\u53ca\u7a05\u52d9\u512a\u5316\u3002\u6db5\u84cb\u96e2\u5cb8\u4fe1\u8a17\u3001\u76ee\u7684\u4fe1\u8a17\u7b49\u591a\u7a2e\u65b9\u6848\u3002",
    target: "\u9ad8\u6de8\u503c\u5bb6\u65cf\u53ca\u4f01\u696d\u5bb6\u5ba2\u6236",
  },
  {
    name: "\u516c\u53f8\u79d8\u66f8\u670d\u52d9",
    role: "\u4f01\u696d\u670d\u52d9",
    desc: "\u63d0\u4f9b\u5c08\u696d\u516c\u53f8\u79d8\u66f8\u53ca\u5408\u898f\u670d\u52d9\uff0c\u5305\u62ec\u516c\u53f8\u8a3b\u518a\u3001\u5e74\u5be9\u3001\u6703\u8a08\u8a18\u5e33\u3001\u7a05\u52d9\u7533\u5831\u7b49\u3002\u78ba\u4fdd\u4f01\u696d\u6301\u7e8c\u5408\u898f\u71df\u904b\u3002",
    target: "\u9700\u8981\u5c08\u696d\u4f01\u696d\u670d\u52d9\u7684\u5ba2\u6236",
  },
  {
    name: "MyPath AI",
    role: "\u79d1\u6280\u670d\u52d9",
    desc: "AI \u9a45\u52d5\u7684\u667a\u80fd\u8ca1\u5bcc\u7ba1\u7406\u5e73\u53f0\uff0c\u70ba\u5ba2\u6236\u63d0\u4f9b\u500b\u6027\u5316\u6295\u8cc7\u5efa\u8b70\u3001\u98a8\u96aa\u8a55\u4f30\u53ca\u8cc7\u7522\u8ffd\u8e64\u3002\u5229\u7528\u5927\u6578\u64da\u5206\u6790\uff0c\u7cbe\u6e96\u5339\u914d\u6295\u8cc7\u6a5f\u6703\u3002",
    target: "\u8ffd\u6c42\u667a\u80fd\u5316\u8ca1\u5bcc\u7ba1\u7406\u7684\u5ba2\u6236",
  },
  {
    name: "\u9999\u6e2f\u6cd5\u5f8b\u670d\u52d9",
    role: "\u6cd5\u5f8b\u670d\u52d9",
    desc: "\u63d0\u4f9b\u5168\u65b9\u4f4d\u9999\u6e2f\u6cd5\u5f8b\u670d\u52d9\uff0c\u5305\u62ec\u5546\u696d\u8a34\u8a1f\u3001\u4f01\u696d\u4f75\u8cfc\u6cd5\u5f8b\u9867\u554f\u3001\u5408\u7d04\u8d77\u8349\u53ca\u5be9\u95b1\u3001\u77e5\u8b58\u7522\u6b0a\u4fdd\u8b77\u3001\u79fb\u6c11\u6cd5\u5f8b\u652f\u63f4\u7b49\u3002",
    target: "\u6709\u9999\u6e2f\u6cd5\u5f8b\u670d\u52d9\u9700\u6c42\u7684\u5ba2\u6236",
  },
  {
    name: "\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5c08\u696d\u8a8d\u53ef\u8b49\u66f8\u8ab2\u7a0b",
    role: "\u6559\u80b2\u57f9\u8a13",
    desc: "\u5c08\u70ba\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5f9e\u696d\u4eba\u54e1\u8a2d\u8a08\u7684\u5c08\u696d\u8a8d\u53ef\u8ab2\u7a0b\uff0c\u6db5\u84cb\u5bb6\u65cf\u8ca1\u5bcc\u7ba1\u7406\u3001\u6295\u8cc7\u7b56\u7565\u3001\u7a05\u52d9\u898f\u5283\u3001\u7e7c\u627f\u5b89\u6392\u7b49\u6838\u5fc3\u6a21\u7d44\u3002",
    target: "\u5bb6\u65cf\u8fa6\u516c\u5ba4\u5f9e\u696d\u4eba\u54e1\u53ca\u5c08\u696d\u4eba\u58eb",
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
        children: [new TextRun({ text: "PZC Group \u6838\u5fc3\u696d\u52a1\u7ba1\u7406\u7167", bold: true, size: 32, color: dark, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
      }),
      // Subtitle
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: "\u5168\u65b9\u4f4d\u4e13\u4e1a\u670d\u52a1 \u2014 \u6295\u8d44\u00b7\u79fb\u6c11\u00b7\u6cd5\u5f8b\u00b7\u6559\u80b2\u00b7\u79d1\u6280", size: 20, color: "666666", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      }),
      // Flow arrow
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({ text: "\u65e5\u672c\u7269\u696d\u6295\u8d44", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: "  \u2192  ", size: 20, color: "999999" }),
          new TextRun({ text: "\u8056\u591a\u7f8e\u516c\u6c11\u8ba1\u5212", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: "  \u2192  ", size: 20, color: "999999" }),
          new TextRun({ text: "NPC \u57fa\u91d1", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
          new TextRun({ text: "  \u2192  ", size: 20, color: "999999" }),
          new TextRun({ text: "\u5bb6\u65cf\u4fe1\u6258", bold: true, size: 20, color: accent, font: { eastAsia: "Microsoft YaHei" } }),
        ],
      }),
      // Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [headerCell("\u4ea7\u54c1", 18), headerCell("\u5b9a\u4f4d", 12), headerCell("\u4ec0\u4e48\u662f\u5b83\uff1f", 45), headerCell("\u670d\u52a1\u5bf9\u8c61", 25)],
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
        children: [new TextRun({ text: "\u5168\u7403\u4e1a\u52a1\u7ba1\u7406\u96c6\u56e2  |  \u6295\u8d44\u30fb\u79fb\u6c11\u30fb\u6cd5\u5f8b\u30fb\u6559\u80b2", size: 18, color: "999999", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/PZC_Group_\u6838\u5fc3\u4e1a\u52a1\u7ba1\u7406\u7167.docx", buf);
  console.log("Done!");
});
