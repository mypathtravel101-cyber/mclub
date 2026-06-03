const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, LevelFormat, SectionType,
} = require("docx");
const fs = require("fs");

// ── Palette: GO-1 Graphite Orange (proposal / plan) ──
const P = {
  primary: "1A2330",
  body: "182030",
  secondary: "607080",
  accent: "D4875A",
  surface: "F8F0EB",
  cover: {
    titleColor: "FFFFFF",
    subtitleColor: "B0B8C0",
    metaColor: "90989F",
    footerColor: "687078",
  },
  table: {
    headerBg: "D4875A",
    headerText: "FFFFFF",
    accentLine: "D4875A",
    innerLine: "DDD0C8",
    surface: "F8F0EB",
  },
};

const c = (hex) => hex.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Cover helpers ──
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
  const breakAfter = new Set([..."\u2014\u3001\uFF0C\u3002\uFF1B\uFF1A\uFF01\uFF1F\u2018\u2019\u201C\u201D", "...' -_/&"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, metaLineCount = 0, fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0 } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY - fixedHeight;
  const titleBlockHeight = titleLineCount * Math.ceil(titlePt * 23);
  const subtitleHeight = hasSubtitle ? 400 : 0;
  const metaHeight = metaLineCount * 350;
  const contentHeight = titleBlockHeight + subtitleHeight + metaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const topSpacing = Math.max(Math.floor(remainingSpace * 0.45), 800);
  const midSpacing = hasSubtitle ? Math.max(Math.floor(remainingSpace * 0.1), 100) : 0;
  const bottomSpacing = Math.max(Math.floor(remainingSpace * 0.15), 200);
  return { topSpacing, midSpacing, bottomSpacing };
}

function buildCoverR4(config) {
  const P = config.palette;
  const maxWidthTwips = 11906 - 0 - 0 - 1200; // page width - margins - padding
  const { titlePt, titleLines } = calcTitleLayout(config.title, maxWidthTwips, 40, 24);
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length,
    titlePt,
    hasSubtitle: !!config.subtitle,
    metaLineCount: config.metaLines ? config.metaLines.length : 0,
    fixedHeight: 2600,
  });

  const children = [];

  // Top color block row
  const colorBlockHeight = 5200;
  const colorBlockChildren = [];

  // Top spacer
  colorBlockChildren.push(new Paragraph({ spacing: { before: spacing.topSpacing }, children: [] }));

  // Title lines
  for (const line of titleLines) {
    colorBlockChildren.push(new Paragraph({
      spacing: { line: Math.ceil(titlePt * 23), lineRule: "atLeast", after: 80 },
      children: [new TextRun({
        text: line,
        bold: true,
        size: titlePt * 2,
        color: P.cover.titleColor,
        font: { ascii: "Calibri", eastAsia: "SimHei" },
      })],
    }));
  }

  // Subtitle
  if (config.subtitle) {
    colorBlockChildren.push(new Paragraph({
      spacing: { before: spacing.midSpacing + 100, line: 400, lineRule: "atLeast" },
      children: [new TextRun({
        text: config.subtitle,
        size: 24,
        color: P.cover.subtitleColor,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      })],
    }));
  }

  // Accent line
  colorBlockChildren.push(new Paragraph({
    indent: { left: 400, right: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 20 } },
    spacing: { before: 300, after: 200 },
    children: [],
  }));

  // Build the color block as a full-width table with dark background
  const colorBlockTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: colorBlockHeight, rule: "exact" },
      children: [new TableCell({
        verticalAlign: "top",
        shading: { type: ShadingType.CLEAR, fill: P.primary },
        margins: { left: 600, right: 600 },
        children: colorBlockChildren,
      })],
    })],
  });

  children.push(colorBlockTable);

  // Bottom section with meta info on white background
  const metaChildren = [];
  metaChildren.push(new Paragraph({ spacing: { before: 600 }, children: [] }));

  if (config.metaLines) {
    for (const line of config.metaLines) {
      metaChildren.push(new Paragraph({
        spacing: { after: 80, line: 360 },
        children: [new TextRun({
          text: line,
          size: 20,
          color: P.cover.metaColor,
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
        })],
      }));
    }
  }

  // Footer text
  metaChildren.push(new Paragraph({
    spacing: { before: 400 },
    children: [new TextRun({
      text: "MCLUB \u00B7 Park Zeman Chase Family Office",
      size: 18,
      color: P.cover.footerColor,
      font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
    })],
  }));

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838 - colorBlockHeight, rule: "exact" },
      children: [new TableCell({
        verticalAlign: "top",
        margins: { left: 600, right: 600 },
        children: metaChildren,
      })],
    })],
  });

  children.push(metaTable);
  return children;
}

// ── Content helpers ──
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
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
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

function bodyParaBold(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function makeTable(headers, rows) {
  const t = P.table;
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(h => new TableCell({
      shading: { type: ShadingType.CLEAR, fill: t.headerBg },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 21, color: t.headerText, font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
    })),
  });

  const dataRows = rows.map((row, idx) => new TableRow({
    cantSplit: true,
    children: row.map(cell => new TableCell({
      shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: t.surface } : { type: ShadingType.CLEAR, fill: "FFFFFF" },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 21, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
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

// ── Document content ──
const coverChildren = buildCoverR4({
  title: "MCLUB June 2026 Action Plan",
  subtitle: "Monthly Execution Roadmap for CRM, Video Marketing, Broker Training & Commission Framework",
  metaLines: [
    "Organization: MCLUB \u2014 Park Zeman Chase Family Office",
    "Period: June 2026 (Week 1 \u2013 Week 4)",
    "Version: 1.0",
    "Date: June 2, 2026",
  ],
  palette: P,
});

// TOC section children
const tocChildren = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  }),
  new TableOfContents("Table of Contents", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
      italics: true, size: 18, color: "888888",
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// Body content
const bodyChildren = [

  // ── Executive Summary ──
  heading1("Executive Summary"),
  bodyPara("This action plan outlines the strategic initiatives and execution roadmap for MCLUB (Park Zeman Chase Family Office) during June 2026. The plan encompasses four critical workstreams that collectively aim to strengthen MCLUB\u2019s operational infrastructure, expand market reach through digital content, build productive partnerships with insurance broker networks, and establish a transparent commission framework that incentivizes all distribution channels. Each workstream is designed with specific milestones, dependencies, and deliverables that align with MCLUB\u2019s broader mission of delivering premium wealth management and family office services to high-net-worth clients across Asia."),
  bodyPara("The four core initiatives are: (1) the development and beta launch of a CRM mobile system tailored for distributors, internal staff, and agents; (2) a structured short video content schedule across five major platforms\u2014YouTube, B\u7AD9, \u6296\u97F3, \u77E5\u4E4E, and \u5C0F\u7EA2\u4E66\u2014connecting with different product and service partners within the MCLUB ecosystem; (3) a three-session internal training funnel with insurance brokers, progressing from leadership introduction to team leader engagement and culminating in client-facing seminars; and (4) the confirmation and documentation of commission rates across all ten MCLUB products for self, agent, and distributor channels."),
  bodyPara("The plan follows a phased approach across four weeks, with carefully sequenced dependencies. For instance, commission rate confirmation must precede the second broker training session, as team leaders need concrete financial incentives to present to their clients. Similarly, the CRM system beta must be operational before agents can be onboarded for field testing. This document serves as both a strategic guide and an operational checklist, ensuring that all stakeholders understand their roles, deadlines, and interdependencies throughout the month."),

  // ── Task 1: Beta CRM Mobile System ──
  heading1("Task 1: Beta CRM Mobile System"),

  heading2("1.1 Objective & Scope"),
  bodyPara("The primary objective of this initiative is to deliver a functional beta version of a mobile CRM system that serves three distinct user groups: distributors who sell MCLUB products in the field, internal staff who manage client relationships and track performance metrics, and agents who operate as independent intermediaries connecting MCLUB with potential clients. The CRM system will serve as the digital backbone of MCLUB\u2019s distribution network, enabling real-time client data access, product information retrieval, commission tracking, and performance analytics from any mobile device."),
  bodyPara("The scope of the beta release includes core modules for client management (contact details, interaction history, KYC documents), product catalog access with real-time pricing and availability, a commission dashboard showing earned and pending commissions by product, a lead management pipeline with status tracking, and basic reporting capabilities for personal and team performance. The beta will not include advanced features such as AI-driven lead scoring, automated compliance checking, or integration with external financial platforms\u2014these are planned for Phase 2 in subsequent months."),

  heading2("1.2 Weekly Execution Plan"),
  heading3("Week 1 (June 2\u20136): Requirements & Design Finalization"),
  bodyPara("The first week focuses on consolidating all requirements from the three user groups and finalizing the technical design. This includes conducting focused requirement workshops with representative distributors, internal staff, and agents to validate feature priorities and workflow assumptions. The UX/UI design team will produce high-fidelity wireframes for all primary screens, and the technical architecture will be reviewed and approved. Key deliverables for this week include a signed-off requirements document, approved wireframes for at least 80% of screens, and a confirmed technology stack and development environment setup."),
  bulletItem("Monday: Kick-off meeting with all stakeholders; distribute requirement questionnaires"),
  bulletItem("Tuesday\u2013Wednesday: Conduct 3 separate requirement workshops (distributors, staff, agents)"),
  bulletItem("Thursday: Compile and prioritize requirements; resolve conflicting needs across user groups"),
  bulletItem("Friday: Finalize wireframes and technical architecture; obtain sign-off from project sponsor"),

  heading3("Week 2 (June 9\u201313): Core Development Sprint"),
  bodyPara("The second week is dedicated to intensive development of the core CRM modules. The development team will work in daily sprint cycles, building the client management module, product catalog, and authentication system. Backend API development runs in parallel with frontend mobile implementation. Daily stand-up meetings at 9:00 AM ensure blockers are identified and resolved quickly. By end of week, the team should have a working prototype that supports user login, client search, and product browsing."),
  bulletItem("Monday\u2013Tuesday: Build authentication module and user role management (distributor/staff/agent)"),
  bulletItem("Wednesday\u2013Thursday: Develop client management module (add/edit/search clients, interaction logging)"),
  bulletItem("Friday: Implement product catalog module with real-time data integration; internal demo"),

  heading3("Week 3 (June 16\u201320): Advanced Features & Integration"),
  bodyPara("Week three focuses on building the commission dashboard, lead pipeline, and reporting features. This is also the integration week where all modules are connected and end-to-end workflows are tested. The commission dashboard is particularly critical because it directly impacts agent and distributor motivation\u2014they need to see their earnings in real-time. The lead pipeline module will support the broker training funnel by tracking leads from initial broker contact through to client conversion."),
  bulletItem("Monday\u2013Tuesday: Build commission dashboard (earned/pending/by-product breakdown)"),
  bulletItem("Wednesday: Develop lead pipeline module with stage tracking (new/qualified/proposal/negotiation/closed)"),
  bulletItem("Thursday: Build basic reporting module (personal stats, team overview)"),
  bulletItem("Friday: Full integration testing; fix critical bugs; prepare beta deployment package"),

  heading3("Week 4 (June 23\u201327): Beta Testing & Onboarding"),
  bodyPara("The final week is dedicated to deploying the beta version, onboarding the first cohort of users, and collecting feedback. A soft launch with 10\u201315 selected users from each group (distributors, staff, agents) ensures controlled testing. Each user receives a 30-minute onboarding session and a feedback form. A dedicated Slack channel or WhatsApp group provides real-time support. Critical bugs identified during beta testing are triaged daily, with showstopper issues resolved within 24 hours."),
  bulletItem("Monday: Deploy beta to staging environment; conduct internal QA walkthrough"),
  bulletItem("Tuesday: Distribute beta access to first cohort; conduct onboarding sessions for distributors"),
  bulletItem("Wednesday: Onboard internal staff and agents; begin collecting structured feedback"),
  bulletItem("Thursday\u2013Friday: Triage and resolve critical bugs; compile beta feedback report; plan Phase 2 roadmap"),

  heading2("1.3 Key Milestones & Deliverables"),

  makeTable(
    ["Week", "Milestone", "Deliverable", "Owner"],
    [
      ["Week 1", "Requirements & Design Signed Off", "Requirements doc + Approved wireframes", "Project Manager"],
      ["Week 2", "Core Prototype Ready", "Working login + client mgmt + product catalog", "Tech Lead"],
      ["Week 3", "Full Feature Integration", "Commission dashboard + lead pipeline + reports", "Tech Lead"],
      ["Week 4", "Beta Live & Feedback Report", "Deployed beta + user feedback summary", "QA Lead"],
    ]
  ),

  // ── Task 2: Short Video Content Schedule ──
  heading1("Task 2: Short Video Content Schedule"),

  heading2("2.1 Strategy Overview"),
  bodyPara("Short video content has emerged as the most effective channel for reaching and engaging high-net-worth individuals and their trusted advisors in the Chinese and global markets. MCLUB\u2019s video strategy is built on a dual-track approach: B2C content that directly educates and attracts potential clients, and B2B2C content that equips intermediaries (insurance brokers, financial advisors, tax consultants) with shareable knowledge assets. The strategy leverages five platforms, each serving a distinct audience segment and content format preference."),
  bodyPara("The content calendar for June is structured around MCLUB\u2019s ten product categories, ensuring that each product receives at least one dedicated video feature during the month. Additionally, cross-product thematic videos (such as \u201Cwhy family office services matter\u201D or \u201Chow to diversify wealth internationally\u201D) provide broader brand awareness. Each video is produced in a primary format and then adapted (re-edited, re-captioned, or reformatted) for distribution across all five platforms, maximizing reach while minimizing production overhead."),

  heading2("2.2 Platform Strategy"),

  makeTable(
    ["Platform", "Target Audience", "Content Format", "Posting Frequency", "Best Posting Time"],
    [
      ["YouTube", "Global HNWIs, overseas Chinese, institutional partners", "Long-form (8\u201315 min), product deep-dives, expert interviews", "2 videos/week", "Tue & Thu 6:00 PM HKT"],
      ["B\u7AD9 (Bilibili)", "Young professionals, finance enthusiasts, tech-savvy HNWIs", "Mid-form (5\u201310 min), educational series, data visualization", "2 videos/week", "Wed & Sat 7:00 PM HKT"],
      ["\u6296\u97F3 (Douyin)", "Mass affluent, lifestyle-oriented audience, quick decision-makers", "Short-form (30\u201390 sec), key messages, testimonials, trending hooks", "5 videos/week", "Daily 12:00 PM & 8:00 PM HKT"],
      ["\u77E5\u4E4E (Zhihu)", "Analytical professionals, lawyers, accountants, consultants", "Mid-form (3\u20137 min), thought leadership, regulatory analysis", "1 video/week", "Mon 9:00 AM HKT"],
      ["\u5C0F\u7EA2\u4E66 (Xiaohongshu)", "UHNW lifestyle, family office aspirational, women HNWIs", "Short-form (30\u201390 sec), lifestyle integration, success stories", "3 videos/week", "Mon/Wed/Fri 10:00 AM HKT"],
    ]
  ),

  heading2("2.3 June Content Calendar"),

  heading3("Week 1 (June 2\u20136): Brand Introduction & Core Business"),
  bodyPara("The opening week establishes MCLUB\u2019s brand positioning and introduces the core family office concept. The content focuses on answering the fundamental question: \u201CWhat is a family office and why do HNWIs need one?\u201D This week also features the first product spotlight on MCLUB\u2019s core business advisory services. The goal is to generate initial awareness and establish credibility across all platforms simultaneously."),
  bulletItem("YouTube: \u201CMCLUB Family Office: Who We Are\u201D (brand intro, 12 min)"),
  bulletItem("B\u7AD9: \u201C5 Things Your Family Office Should Do for You\u201D (educational, 8 min)"),
  bulletItem("\u6296\u97F3: 3 short clips \u2014 \u201CWhat is a family office?\u201D / \u201C1 reason you need one\u201D / \u201CMCLUB client story\u201D"),
  bulletItem("\u77E5\u4E4E: \u201CFamily Office vs Private Bank: Key Differences\u201D (analysis, 5 min)"),
  bulletItem("\u5C0F\u7EA2\u4E66: \u201CA day in the life of a family office client\u201D (lifestyle, 60 sec)"),

  heading3("Week 2 (June 9\u201313): Investment & Fund Products"),
  bodyPara("Week two shifts focus to MCLUB\u2019s investment and fund products, particularly the NPC Fund. Content is designed to explain the unique value proposition of the NPC Fund\u2019s member funnel strategy (Plan A \u2192 Plan B \u2192 Plan C) in an accessible format. This week also introduces the company secretary service as a value-add for SME clients who are part of MCLUB\u2019s broader ecosystem. The broker training sessions (Task 3) begin this week, so video content is coordinated to reinforce the training narrative."),
  bulletItem("YouTube: \u201CNPC Fund Explained: From Membership to Investment\u201D (product deep-dive, 10 min)"),
  bulletItem("B\u7AD9: \u201CHow to Evaluate a Private Fund: A Practical Guide\u201D (educational, 7 min)"),
  bulletItem("\u6296\u97F3: 5 short clips \u2014 NPC Fund highlights, investment minimums, returns overview, FAQ, client testimonial"),
  bulletItem("\u77E5\u4E4E: \u201CRegulatory Framework for Private Funds in Hong Kong\u201D (analysis, 6 min)"),
  bulletItem("\u5C0F\u7EA2\u4E66: \u201CInvesting in NPC Fund: What to expect\u201D (aspirational, 45 sec)"),

  heading3("Week 3 (June 16\u201320): Insurance & Protection Products"),
  bodyPara("Week three highlights MCLUB\u2019s insurance and protection product suite. This timing is strategically aligned with the broker training Session 2 (team leader engagement), as video content can be shared by team leaders with their networks to prime client interest before Session 3. The content covers offshore insurance structures, tax-efficient protection strategies, and the role of insurance in comprehensive wealth planning. Collaboration with insurance broker partners for co-branded content increases distribution reach."),
  bulletItem("YouTube: \u201COffshore Insurance: A Complete Guide for HNWIs\u201D (expert interview, 14 min)"),
  bulletItem("B\u7AD9: \u201C3 Insurance Strategies Every Family Office Uses\u201D (educational, 9 min)"),
  bulletItem("\u6296\u97F3: 5 short clips \u2014 insurance myths, tax benefits, offshore vs onshore, protection planning, real case"),
  bulletItem("\u77E5\u4E4E: \u201CHong Kong Insurance Regulation: What Advisors Must Know\u201D (analysis, 5 min)"),
  bulletItem("\u5C0F\u7EA2\u4E66: \u201CProtecting generational wealth with insurance\u201D (lifestyle, 50 sec)"),

  heading3("Week 4 (June 23\u201327): Citizenship, Property & Holistic Planning"),
  bodyPara("The final week covers MCLUB\u2019s remaining product lines\u2014citizenship-by-investment programs (S\u00E3o Tom\u00E9), overseas property, and company secretary services\u2014before closing with a holistic planning video that ties all products together. This week also serves as the lead-in to the client seminars (Session 3 of the broker training funnel), so content includes calls-to-action directing viewers to register for upcoming seminars. The week concludes with a monthly performance review of all video content metrics."),
  bulletItem("YouTube: \u201CCitizenship by Investment: S\u00E3o Tom\u00E9 Program Deep-Dive\u201D (product, 11 min)"),
  bulletItem("B\u7AD9: \u201CBuilding a Global Identity Portfolio\u201D (educational, 8 min)"),
  bulletItem("\u6296\u97F3: 5 short clips \u2014 citizenship benefits, property hotspot, company secretary FAQ, holistic plan, seminar invitation"),
  bulletItem("\u77E5\u4E4E: \u201CComparing Citizenship-by-Investment Programs in 2026\u201D (analysis, 6 min)"),
  bulletItem("\u5C0F\u7EA2\u4E66: \u201CYour second passport: Why and How\u201D (aspirational, 55 sec)"),

  heading2("2.4 Production & Coordination"),
  bodyPara("Each product/service partner within MCLUB is assigned as the subject matter expert (SME) for their respective video content. The content team conducts a 30-minute briefing with each SME before scripting, reviews scripts for accuracy, and schedules a 2-hour filming session per long-form video. Short-form content is batch-filmed in half-day sessions. All videos are reviewed by compliance before publication. The content coordinator maintains a master spreadsheet tracking script status, filming dates, editing progress, approval status, and publication dates for each piece of content across all platforms."),

  // ── Task 3: Internal Training with Insurance Brokers ──
  heading1("Task 3: Internal Training Events with Insurance Brokers"),

  heading2("3.1 Training Funnel Overview"),
  bodyPara("The broker training program follows a carefully designed three-session funnel that progressively deepens engagement and expands the audience at each stage. This approach recognizes that insurance broker organizations operate in hierarchical structures\u2014broker firm principals make strategic decisions, team leaders manage day-to-day client relationships, and end clients are the ultimate revenue source. By structuring the training as a funnel, MCLUB builds buy-in at the top first, then leverages that endorsement to gain access to team leaders, and finally converts that access into direct client engagement opportunities."),
  bodyPara("The funnel design is critical because it transforms a one-off presentation into a sustainable business development channel. Session 1 is an investment in relationship-building with decision-makers. Session 2 converts that relationship into operational activation by equipping team leaders with product knowledge and financial incentives. Session 3 is the revenue-generating stage where MCLUB\u2019s value proposition is presented directly to qualified prospects. Each session has specific success criteria that must be met before advancing to the next stage."),

  heading2("3.2 Session 1: Leadership Introduction"),

  makeTable(
    ["Element", "Details"],
    [
      ["Timing", "Week 1\u20132 (June 2\u201313)"],
      ["Audience", "Heads of broker firms / Senior partners (3\u20135 firms)"],
      ["Duration", "90 minutes (60 min presentation + 30 min Q&A)"],
      ["Format", "Private meeting or executive lunch"],
      ["Objective", "Secure leadership endorsement and permission for internal team training"],
      ["Key Content", "MCLUB overview, product portfolio (10 products), market opportunity, partnership model"],
      ["Success Criteria", "At least 2 firms agree to Schedule Session 2 with their team leaders"],
    ]
  ),

  bodyPara("Session 1 is designed as a high-level strategic briefing that positions MCLUB as a premium partner rather than just another product provider. The presentation emphasizes the breadth of MCLUB\u2019s product portfolio (wealth management, insurance, citizenship, property, company secretary services) and how this diversity creates multiple touchpoints for broker firms to generate revenue. The key ask at the end of the session is permission to conduct a more detailed training session with the firm\u2019s team leaders. This top-down approach ensures that when team leaders attend Session 2, they already have their leadership\u2019s endorsement, which significantly increases engagement and participation quality."),

  heading2("3.3 Session 2: Team Leader Engagement"),

  makeTable(
    ["Element", "Details"],
    [
      ["Timing", "Week 3 (June 16\u201320) \u2014 CRITICAL: After commission rates are confirmed"],
      ["Audience", "Team leaders and senior advisors from participating broker firms"],
      ["Duration", "120 minutes (90 min training + 30 min workshop)"],
      ["Format", "Interactive workshop with product demos and case studies"],
      ["Objective", "Equip team leaders to identify suitable clients and present MCLUB products"],
      ["Key Content", "Product deep-dive, commission structure, sales scripts, client profiling, objection handling"],
      ["Success Criteria", "Team leaders commit to inviting 5\u201310 clients each to Session 3"],
      ["DEPENDENCY", "\u26A0\uFE0F Commission rates MUST be confirmed before this session"],
    ]
  ),

  bodyPara("Session 2 is the pivotal stage of the funnel because it transitions from awareness to action. Team leaders need two things to become effective advocates for MCLUB: deep product knowledge and clear financial incentives. The product knowledge component covers each of MCLUB\u2019s ten products in detail, including target client profiles, key selling points, common objections, and suggested conversation starters. The commission structure presentation is equally important\u2014team leaders must understand exactly how much they and their agents will earn for each product sold, as this directly impacts their willingness to invest time and social capital in promoting MCLUB to their clients."),
  bodyPara("This is why the commission rate confirmation (Task 4) is a hard prerequisite for Session 2. Presenting tentative or unconfirmed commission rates would undermine MCLUB\u2019s credibility and give team leaders reason to delay their commitment. By ensuring rates are finalized and documented before Session 2, MCLUB demonstrates professionalism and reliability\u2014qualities that resonate strongly in the relationship-driven insurance industry. The session concludes with a workshop where team leaders practice identifying clients from their existing book who would benefit from MCLUB products, and each leader commits to inviting a specific number of clients to Session 3."),

  heading2("3.4 Session 3: Client Seminar"),

  makeTable(
    ["Element", "Details"],
    [
      ["Timing", "Week 4 (June 23\u201327)"],
      ["Audience", "Qualified clients invited by team leaders (HNWIs and UHNWIs)"],
      ["Duration", "150 minutes (90 min presentation + 45 min networking + 15 min Q&A)"],
      ["Format", "Premium seminar with catering and networking"],
      ["Objective", "Generate qualified leads and initiate client onboarding"],
      ["Key Content", "Wealth planning overview, product showcase, client testimonials, exclusive offers"],
      ["Success Criteria", "Minimum 15 attendees; at least 5 express interest in follow-up consultation"],
    ]
  ),

  bodyPara("Session 3 is the culmination of the funnel and the primary lead-generation event. The format is designed to reflect MCLUB\u2019s premium positioning\u2014the venue, catering, and presentation quality must convey the same level of exclusivity and sophistication that clients expect from a family office. The presentation is client-facing rather than technical: it focuses on outcomes (wealth preservation, tax efficiency, global mobility, legacy planning) rather than product mechanics. Real client testimonials and case studies provide social proof, while exclusive offers (such as waived setup fees or priority access to NPC Fund) create urgency for immediate action. The networking segment is carefully facilitated\u2014MCLUB advisors and broker team leaders are strategically positioned to engage specific clients identified during Session 2 as high-potential prospects."),

  heading2("3.5 Funnel Timeline & Dependencies"),

  makeTable(
    ["Week", "Activity", "Dependencies", "Risk Mitigation"],
    [
      ["Week 1", "Identify & contact 3\u20135 broker firm heads", "None", "Prepare backup list of 2 additional firms"],
      ["Week 1\u20132", "Conduct Session 1 (leadership)", "None", "Offer virtual option for busy executives"],
      ["Week 2\u20133", "Schedule Session 2 (team leaders)", "Session 1 approval + Commission rates confirmed", "Confirm rates by June 13 at latest"],
      ["Week 3\u20134", "Schedule Session 3 (client seminar)", "Session 2 commitments from team leaders", "Set minimum 2 firms participating to proceed"],
      ["Week 4", "Conduct Session 3 and follow up", "Venue booked, materials printed, catering confirmed", "Prepare virtual backup format"],
    ]
  ),

  // ── Task 4: Commission Rate Confirmation ──
  heading1("Task 4: Commission Rate Confirmation"),

  heading2("4.1 Importance & Urgency"),
  bodyPara("Confirming commission rates across all MCLUB products is not merely an administrative task\u2014it is a strategic enabler that directly impacts the success of the broker training funnel (Task 3, Session 2), the agent onboarding process for the CRM system (Task 1), and the overall credibility of MCLUB\u2019s distribution network. Without confirmed commission rates, MCLUB cannot effectively recruit or retain agents and distributors, nor can it provide the financial transparency that insurance broker partners demand before committing their client relationships to MCLUB products."),
  bodyPara("The urgency of this task is underscored by its position as a hard dependency for Session 2 of the broker training program. If commission rates are not confirmed by June 13 (end of Week 2), the entire broker training funnel timeline is at risk. Team leaders cannot be expected to commit to promoting products with undefined compensation structures, and delaying Session 2 would cascade into postponing Session 3, potentially pushing the client seminar into July and losing the momentum built during the first half of the month."),

  heading2("4.2 Product Commission Framework"),
  bodyPara("MCLUB\u2019s commission structure operates across three distribution channels, each with distinct economics reflecting the level of involvement, client relationship ownership, and ongoing service obligations. The \u201CSelf\u201D channel refers to MCLUB\u2019s own advisory team selling directly to clients. The \u201CAgent\u201D channel covers independent agents who refer clients to MCLUB but do not manage the ongoing relationship. The \u201CDistributor\u201D channel encompasses larger distribution partners (such as insurance broker firms) who maintain the primary client relationship and deliver ongoing service."),

  makeTable(
    ["Product #", "Product Name", "Self Rate", "Agent Rate", "Distributor Rate", "Status"],
    [
      ["01", "Core Business Advisory", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["02", "Offshore Insurance", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["03", "Wealth Management", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["04", "Tax Planning", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["05", "NPC Fund", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["06", "Overseas Property", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["07", "S\u00E3o Tom\u00E9 Citizenship", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["08", "Company Secretary", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["09", "Estate Planning", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
      ["10", "Family Trust", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "\u3010Confirm\u3011", "Pending"],
    ]
  ),

  bodyPara("The table above uses standardized placeholders for the commission rate percentages. These must be filled in through internal discussions with MCLUB\u2019s product heads, finance team, and distribution leadership. Each product may have a different commission model (percentage of AUM, flat fee per transaction, trailing commission, or hybrid), and the rates across channels typically follow a tiered structure where distributors receive the highest rate due to their greater service obligations, agents receive an intermediate rate, and the self channel retains the full margin but bears all delivery costs."),

  heading2("4.3 Confirmation Process"),

  heading3("Week 1 (June 2\u20136): Rate Drafting"),
  bodyPara("The product heads for each of the ten MCLUB products prepare draft commission rate proposals for all three channels. These drafts should include the proposed rate, the rationale (market benchmarking, competitive positioning, margin analysis), and any volume-based tiering or performance bonuses. The finance team provides margin analysis to ensure all proposed rates are financially viable. By end of Week 1, all draft proposals must be compiled into a single commission rate document for executive review."),
  bulletItem("Monday: Distribute commission rate templates to all 10 product heads"),
  bulletItem("Tuesday\u2013Wednesday: Product heads prepare draft rates; finance provides margin analysis"),
  bulletItem("Thursday: Compile all draft rates into unified commission framework document"),
  bulletItem("Friday: Submit to Managing Director for initial review and feedback"),

  heading3("Week 2 (June 9\u201313): Executive Review & Finalization"),
  bodyPara("Week two is dedicated to executive review, negotiation, and final sign-off. The Managing Director reviews each product\u2019s commission rates, comparing them against market benchmarks and MCLUB\u2019s strategic priorities. Any adjustments are discussed with the relevant product head and finance team. The final commission rate schedule is approved and documented by end of Week 2. This deadline is non-negotiable because Session 2 of the broker training funnel requires confirmed rates."),
  bulletItem("Monday\u2013Tuesday: Managing Director reviews draft rates; identifies items requiring adjustment"),
  bulletItem("Wednesday: Rate adjustment discussions with product heads and finance"),
  bulletItem("Thursday: Final commission rate schedule prepared and circulated for sign-off"),
  bulletItem("Friday: Official sign-off; commission rate document distributed to relevant stakeholders"),

  heading2("4.4 Commission Rate Principles"),
  bodyPara("To ensure consistency and fairness across the commission framework, the following principles guide rate-setting decisions. First, the Distributor channel should receive the highest commission rate because distributors bear the greatest service obligation and client relationship management costs. Second, Agent rates should be set at a level that is competitive with market benchmarks for similar financial products, ensuring MCLUB can attract quality agents. Third, the Self channel margin should be sufficient to cover MCLUB\u2019s internal delivery costs while maintaining competitive client pricing. Fourth, all rates should include a trailing component where appropriate, aligning the interests of all channels with long-term client retention rather than one-time sales. Fifth, volume-based tiering should reward high-performing channels, creating an incentive for increased production without eroding base-level profitability."),

  // ── Consolidated Monthly Timeline ──
  heading1("Consolidated Monthly Timeline"),

  heading2("5.1 Week-by-Week Master Schedule"),
  bodyPara("The following master schedule provides a consolidated view of all four workstreams across June 2026, highlighting key dependencies and critical path items. This schedule should be reviewed in the Monday morning coordination meeting each week, with adjustments made based on actual progress and any emerging risks or opportunities."),

  makeTable(
    ["Week", "CRM System", "Video Content", "Broker Training", "Commission Rates"],
    [
      ["Week 1\n(Jun 2\u20136)", "Requirements & design finalization", "Brand intro & core business content", "Contact broker firm heads; schedule Session 1", "Product heads draft commission rates"],
      ["Week 2\n(Jun 9\u201313)", "Core development sprint", "Investment & fund product content", "Conduct Session 1 (leadership)", "Executive review & final sign-off"],
      ["Week 3\n(Jun 16\u201320)", "Advanced features & integration", "Insurance & protection content", "Conduct Session 2 (team leaders) \u26A0 Dependency: rates confirmed", "Rates confirmed & distributed"],
      ["Week 4\n(Jun 23\u201327)", "Beta testing & onboarding", "Citizenship, property & holistic content", "Conduct Session 3 (client seminar)", "Rates integrated into CRM & training materials"],
    ]
  ),

  heading2("5.2 Critical Path & Dependencies"),
  bodyPara("The critical path through June\u2019s action plan runs through the commission rate confirmation (Task 4) into the broker training Session 2 (Task 3). If commission rates are not confirmed by June 13, Session 2 cannot proceed as planned, which delays Session 3 and reduces the overall effectiveness of the broker training funnel. The CRM system development (Task 1) runs on a parallel track but shares a dependency with commission rates in Week 4, when confirmed rates must be integrated into the commission dashboard module."),
  bodyPara("The video content schedule (Task 2) is the most independent workstream, with minimal dependencies on the other three tasks. However, it is coordinated with the broker training schedule to ensure that video content reinforces the training narrative\u2014for example, insurance product videos are published during Week 3 when broker team leaders are being trained on those same products, enabling them to share the videos with their networks as supporting material. This cross-workstream coordination amplifies the impact of both the video content and the broker training."),

  // ── Risk Analysis ──
  heading1("Risk Analysis & Mitigation"),

  bodyPara("Every initiative in this action plan carries execution risks that must be proactively managed. The following analysis identifies the most significant risks, assesses their potential impact, and outlines specific mitigation strategies. Risk management is an ongoing process\u2014the project lead should review this risk register weekly and escalate any risks that materialize or increase in severity."),

  makeTable(
    ["Risk", "Likelihood", "Impact", "Mitigation Strategy"],
    [
      ["Commission rate delays beyond Week 2", "Medium", "High \u2014 blocks Session 2", "Set hard deadline June 13; escalate to MD if not signed by June 11"],
      ["CRM beta critical bugs delay deployment", "Medium", "Medium \u2014 delays agent onboarding", "Allocate 2 dedicated QA resources in Week 3; maintain bug triage daily"],
      ["Low broker firm attendance at Session 1", "Low\u2013Medium", "High \u2014 reduces funnel pipeline", "Prepare backup list of 2 additional firms; offer virtual attendance option"],
      ["Video content production delays", "Medium", "Low \u2013Medium \u2014 reduces content volume", "Batch-film content; maintain 1-week buffer in production schedule"],
      ["Team leaders fail to invite sufficient clients", "Medium", "High \u2014 undermines Session 3", "Provide pre-written invitation templates; offer incentive for client attendance"],
      ["Platform algorithm changes reduce video reach", "Low", "Medium \u2014 reduces content ROI", "Diversify across 5 platforms; monitor analytics daily and adjust strategy"],
    ]
  ),

  // ── Success Metrics ──
  heading1("Success Metrics & KPIs"),

  bodyPara("Measuring the success of June\u2019s action plan requires clear, quantifiable KPIs for each workstream. These metrics serve two purposes: they provide early warning signals if a workstream is falling behind, and they enable objective evaluation of the month\u2019s overall performance at the end of June. Each KPI has a target (the minimum acceptable outcome) and a stretch goal (the aspirational outcome that would indicate exceptional performance)."),

  makeTable(
    ["Workstream", "KPI", "Target", "Stretch Goal"],
    [
      ["CRM System", "Beta deployed on schedule", "June 23 deployment", "June 20 deployment"],
      ["CRM System", "Beta user activation rate", "70% of invited users", "85% of invited users"],
      ["CRM System", "Critical bug resolution time", "< 48 hours", "< 24 hours"],
      ["Video Content", "Total video views across platforms", "50,000 views", "100,000 views"],
      ["Video Content", "New follower/subscriber growth", "500 new followers", "1,000 new followers"],
      ["Video Content", "Engagement rate (likes + comments / views)", "> 3%", "> 5%"],
      ["Broker Training", "Broker firms engaged in Session 1", "3 firms", "5 firms"],
      ["Broker Training", "Team leaders attending Session 2", "10 leaders", "15 leaders"],
      ["Broker Training", "Client seminar attendance (Session 3)", "15 attendees", "25 attendees"],
      ["Broker Training", "Qualified leads from Session 3", "5 leads", "10 leads"],
      ["Commission Rates", "All 10 product rates confirmed", "By June 13", "By June 11"],
      ["Commission Rates", "Rates integrated into CRM", "By June 27", "By June 25"],
    ]
  ),

  bodyPara("These KPIs will be tracked in a shared dashboard accessible to all project leads. Weekly progress reports are due every Friday by 5:00 PM HKT, summarizing actual results against targets, highlighting any deviations, and proposing corrective actions. A formal month-end review will be conducted on June 30 to assess overall performance, capture lessons learned, and inform the July 2026 action plan."),

  // ── Conclusion ──
  heading1("Next Steps & Recommendations"),

  bodyPara("Upon approval of this action plan, the following immediate actions should be taken to ensure a smooth start on June 2. First, the project manager should schedule a kick-off meeting for all workstream leads on Monday morning, June 2, to align on priorities, confirm resource availability, and establish communication protocols. Second, the commission rate templates should be distributed to all product heads by end of day June 2, with a clear deadline of June 5 for draft submissions. Third, the video production team should confirm the filming schedule for Week 1 content and ensure all subject matter experts are available for their briefings. Fourth, the broker firm outreach should commence immediately, with personalized invitations sent to at least five firm heads by June 3."),
  bodyPara("Looking beyond June, the successful execution of this plan creates a strong foundation for MCLUB\u2019s growth trajectory in Q3 and Q4 2026. The CRM system will scale from beta to full production, the video content engine will have established a consistent publishing rhythm, the broker training funnel will have generated a pipeline of qualified leads, and the commission framework will provide the financial clarity needed to attract and retain top-performing distribution partners. Each of these outcomes compounds over time\u2014the earlier they are established, the greater their cumulative impact on MCLUB\u2019s market position and revenue growth."),
];

// ── Build the document ──
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

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
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover
    {
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: coverChildren,
    },
    // Section 2: TOC
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })],
          })],
        }),
      },
      children: tocChildren,
    },
    // Section 3: Body
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "MCLUB June 2026 Action Plan", size: 18, color: "808080", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })],
          })],
        }),
      },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/MCLUB_June_2026_Action_Plan.docx", buf);
  console.log("Document generated successfully.");
});
