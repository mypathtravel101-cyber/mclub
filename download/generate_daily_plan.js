const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType,
} = require("docx");
const fs = require("fs");

// Palette
const P = {
  primary: "1A2330", body: "182030", secondary: "607080",
  accent: "D4875A", surface: "F8F0EB",
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
};

const c = (hex) => hex.replace("#","");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Helpers ──
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function makeDayTable(rows) {
  const t = P.table;
  const headers = ["Date", "CRM System", "Video Content", "Broker Training", "Commission Rates", "Daily Achievement"];
  const colWidths = [10, 16, 16, 18, 16, 24];

  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: t.headerBg },
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 260 },
        children: [new TextRun({ text: h, bold: true, size: 18, color: t.headerText, font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
    })),
  });

  const dataRows = rows.map((row, idx) => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: t.surface } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ spacing: { line: 260 },
        children: [new TextRun({ text: cell, size: 17, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
    },
    rows: [headerRow, ...dataRows],
  });
}

function makeSimpleTable(headers, rows, colWidths) {
  const t = P.table;
  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: t.headerBg },
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 260 },
        children: [new TextRun({ text: h, bold: true, size: 18, color: t.headerText, font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
    })),
  });
  const dataRows = rows.map((row, idx) => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: t.surface } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ spacing: { line: 260 },
        children: [new TextRun({ text: cell, size: 19, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentLine },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: t.innerLine },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ── Daily data ──
const week1 = [
  ["Mon\nJun 1",
    "Project kick-off meeting with all stakeholders; distribute requirement questionnaires",
    "Confirm video production team; schedule SME briefings for brand intro content",
    "Identify target list: 5 insurance broker firms; prepare introduction materials",
    "Distribute commission rate templates to all 10 product heads",
    "Kick-off completed; templates sent; broker target list confirmed"
  ],
  ["Tue\nJun 2",
    "Conduct requirement workshop: Distributors (2hrs); document key feature requests",
    "SME briefing: Core Business Advisory team (30min); script outline for brand video",
    "Send personalized invitations to first 3 broker firm heads for Session 1",
    "Follow up with product heads on template completion; provide margin data from finance",
    "Distributor requirements documented; brand video script started; 3 invitations sent"
  ],
  ["Wed\nJun 3",
    "Conduct requirement workshop: Internal Staff (2hrs); document workflow needs",
    "SME briefing: NPC Fund team; draft YouTube brand intro script (12 min)",
    "Follow up on invitations; confirm Session 1 date with at least 1 firm",
    "Collect draft rates from Product 01\u201303 (Core Business, Offshore Insurance, Wealth Mgmt)",
    "Staff requirements done; YouTube script drafted; 1+ Session 1 confirmed"
  ],
  ["Thu\nJun 4",
    "Conduct requirement workshop: Agents (2hrs); compile all 3 groups\u2019 requirements",
    "Film YouTube brand intro video (2hr session); draft B\u7AD9 educational script",
    "Confirm Session 1 with 2nd broker firm; prepare presentation deck",
    "Collect draft rates from Product 04\u201306 (Tax, NPC Fund, Overseas Property)",
    "All requirements compiled; brand video filmed; 2 firms confirmed for Session 1"
  ],
  ["Fri\nJun 5",
    "Finalize & prioritize requirements; resolve conflicts across user groups; obtain sign-off",
    "Edit YouTube video; film B\u7AD9 educational clip; draft Douyin 3 short clips",
    "Finalize Session 1 deck; confirm logistics (venue/catering/virtual link)",
    "Collect draft rates from Product 07\u201310 (Citizenship, Co. Secretary, Estate, Trust)",
    "Requirements signed off; Week 1 videos ready for edit; all 10 draft rates collected"
  ],
];

const week2 = [
  ["Mon\nJun 8",
    "Development sprint begins: Build authentication module & user role management",
    "Publish YouTube brand intro + B\u7AD9 educational video; draft NPC Fund video script",
    "Conduct Session 1 with Broker Firm A (90 min: 60min presentation + 30min Q&A)",
    "Compile all 10 draft rates into unified commission framework document",
    "Auth module started; first videos published; Session 1 completed with Firm A"
  ],
  ["Tue\nJun 9",
    "Continue authentication module; build user login, registration, role assignment",
    "SME briefing: NPC Fund; film YouTube NPC Fund deep-dive (2hr session)",
    "Conduct Session 1 with Broker Firm B; request internal training with team leaders",
    "Submit commission framework to Managing Director for initial review",
    "Auth module functional; NPC Fund video filmed; Session 1 with Firm B done"
  ],
  ["Wed\nJun 10",
    "Begin client management module: add/edit/search clients, interaction logging",
    "Edit NPC Fund video; draft B\u7AD9 private fund evaluation script",
    "Conduct Session 1 with Broker Firm C (if confirmed); else follow up on pending invites",
    "MD reviews rates; compile list of items requiring adjustment",
    "Client mgmt module started; NPC video editing; all Session 1s completed"
  ],
  ["Thu\nJun 11",
    "Continue client management module; build interaction history & KYC document upload",
    "Publish YouTube NPC Fund video; film B\u7AD9 evaluation clip; draft 5 Douyin clips",
    "\u26A0 HARD DEADLINE: Confirm at least 2 firms agree to Session 2; schedule dates",
    "\u26A0 HARD DEADLINE: Rate adjustments discussed with product heads & finance",
    "Client mgmt 80% done; NPC video published; Session 2 firms confirmed; rates adjusted"
  ],
  ["Fri\nJun 12",
    "Complete client management module; internal demo & bug fixes",
    "Publish B\u7AD9 video; edit & schedule Douyin NPC clips (5 videos); draft Zhihu script",
    "Send Session 2 calendar invites to team leaders from confirmed firms",
    "Final commission rate schedule prepared and circulated for sign-off",
    "Client mgmt complete; Douyin clips scheduled; Session 2 invites sent; rates circulated"
  ],
];

const week3 = [
  ["Mon\nJun 15",
    "Begin commission dashboard module: earned/pending/by-product breakdown views",
    "SME briefing: Insurance product team; draft YouTube offshore insurance script",
    "Prepare Session 2 materials: product deep-dive deck, commission handout, sales scripts",
    "\u26A0 FINAL SIGN-OFF: Official commission rate document signed by MD",
    "Commission dashboard started; insurance video scripted; Session 2 materials ready; RATES SIGNED"
  ],
  ["Tue\nJun 16",
    "Continue commission dashboard; integrate confirmed rates into display logic",
    "Film YouTube offshore insurance expert interview (2hr session)",
    "Conduct Session 2 with Firm A team leaders (120min: 90min training + 30min workshop)",
    "Distribute signed commission rates to CRM team for integration; update training handouts",
    "Dashboard rates integrated; insurance video filmed; Session 2 Firm A done"
  ],
  ["Wed\nJun 17",
    "Build lead pipeline module: stage tracking (new/qualified/proposal/negotiation/closed)",
    "Edit insurance video; draft B\u7AD9 insurance strategies script",
    "Conduct Session 2 with Firm B team leaders (120min); collect client invite commitments",
    "Integrate confirmed rates into CRM commission dashboard & agent onboarding materials",
    "Lead pipeline started; insurance video editing; Session 2 Firm B done; rates in CRM"
  ],
  ["Thu\nJun 18",
    "Continue lead pipeline; build basic reporting module (personal stats, team overview)",
    "Publish YouTube insurance video; film B\u7AD9 clip; draft 5 Douyin insurance clips",
    "Follow up with team leaders: confirm number of clients each will invite to Session 3",
    "Prepare commission rate FAQ for Session 3 client-facing materials",
    "Reporting module 70% done; insurance video published; client invite tracking started"
  ],
  ["Fri\nJun 19",
    "Full integration testing: connect all modules end-to-end; fix critical bugs",
    "Publish B\u7AD9 video; edit Douyin insurance clips; draft Xiaohongshu insurance clip",
    "Confirm Session 3 date, venue, catering; minimum 15 clients expected",
    "Finalize commission rate integration into all materials (CRM, training, marketing)",
    "Full integration tested; Douyin clips ready; Session 3 logistics confirmed"
  ],
];

const week4 = [
  ["Mon\nJun 22",
    "Deploy beta to staging environment; conduct internal QA walkthrough",
    "SME briefing: Citizenship & Property teams; draft YouTube Sao Tome script",
    "Print Session 3 materials; prepare name badges, sign-in sheets, networking setup",
    "Rates fully integrated; verify commission displays correctly in CRM beta",
    "Beta in staging; citizenship video scripted; Session 3 materials printed"
  ],
  ["Tue\nJun 23",
    "Distribute beta access to first cohort (distributors); conduct onboarding sessions",
    "Film YouTube citizenship deep-dive video (2hr session)",
    "Conduct Session 3: Client Seminar (150min: 90min presentation + 45min networking + 15min Q&A)",
    "Monitor: ensure agents can view their commission rates in beta CRM",
    "Distributors onboarded; citizenship video filmed; SESSION 3 COMPLETED"
  ],
  ["Wed\nJun 24",
    "Onboard internal staff & agents to beta; collect structured feedback forms",
    "Edit citizenship video; draft B\u7AD9 global identity script",
    "Follow up with Session 3 attendees: send thank-you + consultation booking link",
    "Review any commission rate issues flagged during Session 3 or CRM testing",
    "Staff & agents onboarded; citizenship video editing; Session 3 follow-ups sent"
  ],
  ["Thu\nJun 25",
    "Triage critical bugs from beta feedback; resolve showstopper issues (<24hr SLA)",
    "Publish YouTube citizenship video; film B\u7AD9 clip; draft Douyin citizenship clips",
    "Qualify leads from Session 3: categorize as hot/warm/cold; assign to advisors",
    "Update commission rates if any adjustments needed based on field feedback",
    "Critical bugs fixed; citizenship video published; leads qualified & assigned"
  ],
  ["Fri\nJun 26",
    "Compile beta feedback report; plan Phase 2 development roadmap for July",
    "Publish B\u7AD9 video; schedule Douyin + Xiaohongshu clips for weekend; monthly analytics review",
    "Compile broker training funnel report: firms engaged / leaders trained / leads generated",
    "Final commission rate audit: confirm all 10 products \u00D7 3 channels are accurate in all systems",
    "Beta feedback report done; monthly video analytics reviewed; funnel report compiled; rates audited"
  ],
];

const week5 = [
  ["Mon\nJun 29",
    "Begin Phase 2 planning: prioritize features from beta feedback; allocate dev resources",
    "Plan July content calendar based on June performance data; identify top-performing formats",
    "Schedule follow-up meetings with broker firms for July pipeline; send Session 3 ROI summary",
    "Prepare commission rate performance analysis: which products/channels drive most revenue",
    "Phase 2 plan drafted; July content planned; broker July pipeline started"
  ],
  ["Tue\nJun 30",
    "Month-end review: CRM beta status, user adoption metrics, bug backlog priorities",
    "Month-end review: total views, follower growth, engagement rate vs. KPIs",
    "Month-end review: total firms engaged, leaders trained, leads generated, conversion rate",
    "Month-end review: commission rate completion, CRM integration status, field feedback",
    "FULL MONTH-END REVIEW COMPLETE; July plan informed by June results"
  ],
];

const children = [];

// Title page
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 2400, after: 200, line: 600 },
  children: [new TextRun({ text: "MCLUB", bold: true, size: 72, color: c(P.accent), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200, line: 480 },
  children: [new TextRun({ text: "June 2026 Daily Action Plan", bold: true, size: 44, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
  children: [new TextRun({ text: "Day-by-Day Execution Guide", size: 28, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
}));
children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({ text: "Park Zeman Chase Family Office", size: 22, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({ text: "4 Workstreams: CRM System | Video Content | Broker Training | Commission Rates", size: 20, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({ text: "Version 1.0 | June 2026", size: 20, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// How to use this plan
children.push(heading1("How to Use This Daily Plan"));
children.push(bodyPara("This document provides a day-by-day execution guide for all four MCLUB workstreams during June 2026. Each row represents one working day and shows exactly what you need to DO (action items) and what you need to ACHIEVE (daily deliverable) across CRM System, Video Content, Broker Training, and Commission Rates. Use the 'Daily Achievement' column as your end-of-day checklist \u2014 if every item is checked off, you are on track."));
children.push(bodyPara("Key conventions used in this plan: Items marked with \u26A0 are hard deadlines that block downstream activities. For example, commission rates must be signed off by June 15 at the latest because Broker Training Session 2 cannot proceed without confirmed rates. Items without a \u26A0 are target dates with some flexibility, though consistent delays will cascade into the following week. Weekend days are not listed but may be used for video editing overflow or CRM bug fixes if needed."));

// Color legend
children.push(heading2("Priority Legend"));
children.push(makeSimpleTable(
  ["Symbol", "Meaning", "Action Required"],
  [
    ["\u26A0", "Hard Deadline / Dependency", "Must complete on this day; blocks downstream tasks if missed"],
    ["Regular", "Target Date", "Should complete on this day; minor delays are recoverable"],
    ["Daily Achievement", "End-of-Day Checklist", "Verify all items in this column are done before signing off"],
  ],
  [12, 20, 68]
));
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

// ── Week 1 ──
children.push(heading1("Week 1: June 1 \u2013 5 (Foundation & Setup)"));
children.push(bodyPara("Week 1 is the foundation week. The primary goal is to complete all setup activities: finalize CRM requirements, launch the first video content, initiate broker firm outreach, and collect all draft commission rates. By Friday, you should have signed-off requirements, published videos on YouTube and B\u7AD9, at least 2 broker firms confirmed for Session 1, and all 10 product draft commission rates collected."));
children.push(makeDayTable(week1));
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

// Week 1 checkpoint
children.push(heading2("Week 1 End-of-Week Checkpoint"));
children.push(makeSimpleTable(
  ["Checkpoint", "Criteria", "Status"],
  [
    ["CRM Requirements", "All 3 user group workshops completed; requirements document signed off", "\u25A1"],
    ["Video Launch", "YouTube brand intro + B\u7AD9 educational video published", "\u25A1"],
    ["Broker Outreach", "At least 2 firms confirmed for Session 1 next week", "\u25A1"],
    ["Commission Drafts", "All 10 product heads submitted draft commission rates", "\u25A1"],
  ],
  [20, 65, 15]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Week 2 ──
children.push(heading1("Week 2: June 8 \u2013 12 (Core Build & Session 1)"));
children.push(bodyPara("Week 2 is the most intensive week, with CRM development in full sprint, the first broker training sessions, and the critical commission rate review. The highlight is conducting Session 1 with broker firm heads and securing their agreement for Session 2. Thursday June 11 is a hard deadline for confirming Session 2 firms and completing rate adjustments. By Friday, the commission rate schedule should be circulated for final sign-off."));
children.push(makeDayTable(week2));
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

children.push(heading2("Week 2 End-of-Week Checkpoint"));
children.push(makeSimpleTable(
  ["Checkpoint", "Criteria", "Status"],
  [
    ["CRM Core Modules", "Auth + client management module functional; internal demo passed", "\u25A1"],
    ["Video Pipeline", "NPC Fund YouTube + B\u7AD9 published; Douyin clips scheduled", "\u25A1"],
    ["Session 1 Complete", "All broker firm heads briefed; 2+ firms agree to Session 2", "\u25A1"],
    ["Commission Rates", "Final schedule circulated for MD sign-off", "\u25A1"],
  ],
  [20, 65, 15]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Week 3 ──
children.push(heading1("Week 3: June 15 \u2013 19 (Advanced Features & Session 2)"));
children.push(bodyPara("Week 3 is the critical path week. Monday June 15 is the absolute deadline for commission rate sign-off \u2014 this is non-negotiable because Session 2 with team leaders requires confirmed rates to present. The CRM team builds the commission dashboard and lead pipeline, while video content shifts to the insurance product theme to align with broker training. By Friday, Session 3 logistics must be confirmed with a minimum of 15 expected clients."));
children.push(makeDayTable(week3));
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

children.push(heading2("Week 3 End-of-Week Checkpoint"));
children.push(makeSimpleTable(
  ["Checkpoint", "Criteria", "Status"],
  [
    ["CRM Integration", "Commission dashboard + lead pipeline + reports integrated; critical bugs fixed", "\u25A1"],
    ["Insurance Videos", "YouTube insurance interview + B\u7AD9 published; Douyin clips ready", "\u25A1"],
    ["Session 2 Complete", "Team leaders trained; each committed 5\u201310 clients for Session 3", "\u25A1"],
    ["Commission Sign-off", "MD signed off; rates integrated into CRM & training materials", "\u25A1"],
  ],
  [20, 65, 15]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Week 4 ──
children.push(heading1("Week 4: June 22 \u2013 26 (Beta Launch & Session 3)"));
children.push(bodyPara("Week 4 is delivery week. The CRM beta goes live, Session 3 client seminar generates qualified leads, and citizenship/property video content rounds out the monthly calendar. Tuesday June 23 is the climax of the broker training funnel with the client seminar. The rest of the week focuses on beta user onboarding, bug triage, and lead qualification. Friday is the wrap-up day with feedback reports and month-end preparation."));
children.push(makeDayTable(week4));
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

children.push(heading2("Week 4 End-of-Week Checkpoint"));
children.push(makeSimpleTable(
  ["Checkpoint", "Criteria", "Status"],
  [
    ["CRM Beta Live", "Beta deployed; 30+ users onboarded; critical bugs triaged", "\u25A1"],
    ["All Products Covered", "Citizenship + property videos published; all 10 products featured", "\u25A1"],
    ["Session 3 Complete", "15+ attendees; 5+ qualified leads; follow-up consultations booked", "\u25A1"],
    ["Commission Audit", "All 10 products \u00D7 3 channels verified in CRM & training materials", "\u25A1"],
  ],
  [20, 65, 15]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ── Week 5 ──
children.push(heading1("Week 5: June 29 \u2013 30 (Month-End Review & July Planning)"));
children.push(bodyPara("The final two days of June are dedicated to comprehensive month-end review and July planning. Each workstream lead presents their results against the KPIs set in the action plan, lessons learned are documented, and the July roadmap is drafted based on June\u2019s actual performance data. This is also the time to close any remaining open items from the month."));
children.push(makeDayTable(week5));
children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

children.push(heading2("Month-End KPI Scorecard"));
children.push(makeSimpleTable(
  ["Workstream", "KPI", "Target", "Actual", "Met?"],
  [
    ["CRM System", "Beta deployed on schedule", "June 23", "\u3010Fill\u3011", "\u25A1"],
    ["CRM System", "Beta user activation rate", "70%", "\u3010Fill\u3011", "\u25A1"],
    ["Video Content", "Total views across platforms", "50,000", "\u3010Fill\u3011", "\u25A1"],
    ["Video Content", "New follower growth", "500", "\u3010Fill\u3011", "\u25A1"],
    ["Broker Training", "Firms engaged (Session 1)", "3", "\u3010Fill\u3011", "\u25A1"],
    ["Broker Training", "Client seminar attendees", "15", "\u3010Fill\u3011", "\u25A1"],
    ["Broker Training", "Qualified leads generated", "5", "\u3010Fill\u3011", "\u25A1"],
    ["Commission Rates", "All rates confirmed by deadline", "June 15", "\u3010Fill\u3011", "\u25A1"],
    ["Commission Rates", "Rates integrated into CRM", "June 27", "\u3010Fill\u3011", "\u25A1"],
  ],
  [18, 30, 18, 18, 16]
));

// Build document
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1134, bottom: 1134, left: 1134, right: 1134 }; // tighter margins for tables

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 280, after: 120, line: 312 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "MCLUB Daily Action Plan \u2014 June 2026", size: 16, color: "808080", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "808080" })],
          })],
        }),
      },
      children: children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/MCLUB_June_2026_Daily_Action_Plan.docx", buf);
  console.log("Daily action plan generated successfully.");
});
