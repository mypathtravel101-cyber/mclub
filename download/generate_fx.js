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
const noBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function hdr(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: accent },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 22, color: "1A1A1A", font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
  });
}

function cell(text, w, bg) {
  return new TableCell({
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: bg },
    borders: noBorders,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [new Paragraph({ spacing: { line: 280 }, children: [new TextRun({ text, size: 20, color: body, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
  });
}

function nameCell(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: accent },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20, color: "1A1A1A", font: { eastAsia: "Microsoft YaHei" } })] })],
  });
}

const items = [
  {
    name: "Stress Testing\n\u538b\u529b\u6d4b\u8bd5",
    desc: "\u6a21\u62df\u6781\u7aef\u5e02\u573a\u60c5\u51b5\uff08\u5982\u5e01\u503c\u6025\u8dcc 10%-20%\u3001\u5229\u7387\u5267\u53d8\u3001\u5730\u7f18\u653f\u6cbb\u4e8b\u4ef6\uff09\uff0c\u6d4b\u8bd5\u5ba2\u6237\u7684\u5916\u6c47\u8d44\u4ea7\u7ec4\u5408\u5728\u5404\u79cd\u60c5\u5883\u4e0b\u7684\u635f\u5931\u98ce\u9669\u3002\u5e2e\u52a9\u5ba2\u6237\u63d0\u524d\u77e5\u6653\u6700\u574f\u60c5\u51b5\u4e0b\u7684\u6f5c\u5728\u5f71\u54cd\uff0c\u5e76\u5236\u5b9a\u5e94\u5bf9\u65b9\u6848\u3002",
    target: "\u6709\u5927\u91cf\u5916\u6c47\u8d1f\u503a\u7684\u5bb6\u65cf\u5ba2\u6237",
    output: "\u538b\u529b\u6d4b\u8bd5\u62a5\u544a\uff08\u5305\u542b\u60c5\u666f\u5206\u6790\u3001\u635f\u5931\u4f30\u7b97\u3001\u5efa\u8bae\uff09",
  },
  {
    name: "Multi-Currency\nDashboard\n\u591a\u5e01\u79cd\u4eea\u8868\u677f",
    desc: "\u5b9e\u65f6\u591a\u5e01\u79cd\u5206\u6790\u5e73\u53f0\uff0c\u6574\u5408\u5a01\u5229\u6307\u5b9a\u4ef7\u3001\u5e01\u503c\u8d70\u52bf\u3001\u5916\u6c47\u6562\u53e3\u6570\u636e\u3002\u5ba2\u6237\u53ef\u4e00\u7f51\u76ef\u63a7\u5168\u7403\u5e01\u79cd\u8d70\u52bf\u548c\u81ea\u5df1\u7684\u5916\u6c47\u98ce\u9669\u654f\u611f\u5ea6\uff0c\u5373\u65f6\u8ffd\u8e2a\u5e01\u503c\u6ce2\u52a8\u5bf9\u8d1f\u503a\u7684\u5b9e\u9645\u5f71\u54cd\u3002",
    target: "\u4f1a\u7ecf\u5e38\u8981\u8fdb\u884c\u591a\u5e01\u79cd\u4ea4\u6613\u7684\u5ba2\u6237",
    output: "\u5b9e\u65f6\u4eea\u8868\u677f\uff08\u5e01\u503c\u8d70\u52bf\u3001\u6562\u53e3\u5206\u6790\u3001\u98ce\u9669\u6307\u6807\uff09",
  },
  {
    name: "Hedging\nStrategies\n\u5bf9\u51b2\u7b56\u7565",
    desc: "\u6839\u636e\u5ba2\u6237\u7684\u5916\u6c47\u6562\u53e3\u548c\u98ce\u9669\u5b9e\u9645\u5ea6\uff0c\u8bbe\u8ba1\u4e2a\u6027\u5316\u7684\u5bf9\u51b2\u65b9\u6848\u3002\u5305\u62ec\u8d77\u8fdc\u671f\u5408\u7ea6\u3001\u671f\u6743\u7b56\u7565\u3001\u5929\u7136\u5bf9\u51b2\u7b49\u591a\u79cd\u5de5\u5177\u7ec4\u5408\uff0c\u6700\u5927\u9650\u5ea6\u964d\u4f4e\u6c47\u7387\u6ce2\u52a8\u5bf9\u5bb6\u65cf\u8d44\u4ea7\u7684\u4fb5\u8680\u3002",
    target: "\u5e0c\u671b\u4e3b\u52a8\u7ba1\u7406\u6c47\u7387\u98ce\u9669\u7684\u5ba2\u6237",
    output: "\u5bf9\u51b2\u65b9\u6848\u5efa\u8bae\u4e66\uff08\u5305\u542b\u6210\u672c\u6548\u76ca\u5206\u6790\uff09",
  },
  {
    name: "Value at Risk\n(VaR)\n\u98ce\u9669\u4f30\u503c",
    desc: "\u5229\u7528\u7edf\u8ba1\u6a21\u578b\u8ba1\u7b97\u5ba2\u6237\u5916\u6c47\u7ec4\u5408\u5728\u7279\u5b9a\u7f6e\u4fe1\u6c34\u5e73\u4e0b\u7684\u6700\u5927\u9884\u671f\u635f\u5931\u3002\u4f8b\u5982\u300c95% VaR \u4e3a HK$500\u4e07\u300d\u610f\u5473\u5728\u6b63\u5e38\u5e02\u573a\u6761\u4ef6\u4e0b\uff0c\u6709 95% \u673a\u4f1a\u5355\u65e5\u635f\u5931\u4e0d\u4f1a\u8d85\u8fc7 HK$500\u4e07\u3002\u4e3a\u5ba2\u6237\u63d0\u4f9b\u7b80\u6d01\u660e\u4e86\u7684\u98ce\u9669\u91cf\u5316\u6307\u6807\u3002",
    target: "\u9700\u8981\u5b9a\u671f\u62a5\u544a\u5916\u6c47\u98ce\u9669\u6562\u53e3\u7684\u5ba2\u6237",
    output: "VaR \u62a5\u544a\uff08\u5305\u542b\u7f6e\u4fe1\u5ea6\u3001\u98ce\u9669\u503c\u3001\u8d70\u52bf\u56fe\uff09",
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
        margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "PZC Group ", size: 16, color: "999999", font: { ascii: "Calibri" } }),
            new TextRun({ text: "|  FX Risk Modelling \u670d\u52a1\u7b80\u4ecb", size: 16, color: "999999", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
          ],
        })],
      }),
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: accent, space: 10 } },
        children: [new TextRun({ text: "FX Risk Modelling \u670d\u52a1\u7b80\u4ecb", bold: true, size: 32, color: dark, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
      }),
      // Subtitle
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: "\u5168\u9762\u5916\u6c47\u98ce\u9669\u7ba1\u7406\u89e3\u51b3\u65b9\u6848  |  \u670d\u52a1\u5bb6\u65cf\u5ba2\u6237\u5916\u6c47\u8d44\u4ea7\u4fdd\u503c", size: 20, color: "666666", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      }),
      // Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              hdr("\u670d\u52a1\u9879\u76ee", 15),
              hdr("\u7b80\u4ecb", 38),
              hdr("\u670d\u52a1\u5bf9\u8c61", 22),
              hdr("\u4ea4\u4ed8\u6210\u679c", 25),
            ],
          }),
          ...items.map((p, i) => new TableRow({
            children: [
              nameCell(p.name, 15),
              cell(p.desc, 38, i % 2 === 0 ? "FFFFFF" : surface),
              cell(p.target, 22, i % 2 === 0 ? "FFFFFF" : surface),
              cell(p.output, 25, i % 2 === 0 ? "FFFFFF" : surface),
            ],
          })),
        ],
      }),
      // Bottom
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 250 },
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "E0E0E0", space: 10 } },
        children: [new TextRun({ text: "PZC Group  |  FX Risk Modelling  |  \u4e13\u4e1a\u5916\u6c47\u98ce\u9669\u7ba1\u7406\u670d\u52a1", size: 18, color: "999999", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/PZC_Group_FX_Risk_Modelling_\u670d\u52a1\u7b80\u4ecb.docx", buf);
  console.log("Done!");
});
