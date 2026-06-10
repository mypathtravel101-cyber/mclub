// PZC Client Acquisition Handbook Data
// 家族辦公室專業認可證書 — 客戶開拓手冊

export type Difficulty = '入門' | '進階' | '專家';
export type ClientCategory = '機構' | '個人';
export type ClientTypeCode = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3';

export interface ClientType {
  code: ClientTypeCode;
  name: string;
  category: ClientCategory;
  coreNeeds: string[];
  entryAngle: string;
  difficulty: Difficulty;
  profile: string;
  talkTrackExample: string;
  redFlags: string[];
}

export interface Product {
  id: number;
  name: string;
  difficulty: Difficulty;
  applicableTypes: ClientTypeCode[];
}

export interface TalkTrackByScenario {
  scenario: string;
  label: string;
  icon: string;
  script: string;
}

export interface TalkTrackByType {
  typeCode: ClientTypeCode;
  typeName: string;
  script: string;
}

export interface ObjectionHandler {
  objection: string;
  response: string;
}

// ─── Client Types ───

export const clientTypes: ClientType[] = [
  {
    code: 'A1',
    name: '擬上市企業',
    category: '機構',
    coreNeeds: ['Pre-IPO重組', '股權架構', '稅務規劃', '資產隔離', '跨境配置'],
    entryAngle: '香港上市需要全方位規劃',
    difficulty: '專家',
    profile: '正在籌備或計劃赴港上市的內地企業。上市前需要處理複雜的股權重組、稅務規劃及資產隔離，是家族辦公室服務的最高價值客戶類型。',
    talkTrackExample: '聽說貴公司正在準備香港上市，恭喜！上市前有幾個關鍵的架構決定，做對了可以省很多稅，做錯了可能影響整個上市進程。',
    redFlags: ['對專業服務費用敏感', '決策流程長，涉及多方利益', '可能已有其他服務提供商'],
  },
  {
    code: 'A2',
    name: '已上市企業',
    category: '機構',
    coreNeeds: ['資產隔離', '稅務策略', '家族信託', '股份質押融資'],
    entryAngle: '上市後的財富保護同樣重要',
    difficulty: '進階',
    profile: '已在港交所或其他交易所上市的企業。控股股東的財富高度集中在上市公司股份，需要資產隔離和財富保護方案。',
    talkTrackExample: '公司上市後，您個人最大的資產就是股份。有沒有想過，如何讓這些股份不只是帳面財富，而是真正為您和家族服務？',
    redFlags: ['可能對現有財務顧問有依賴', '股份禁售期限制', '對家族辦公室概念不熟悉'],
  },
  {
    code: 'A3',
    name: '跨境企業',
    category: '機構',
    coreNeeds: ['稅務策略', '跨境配置', 'CRS合規'],
    entryAngle: '兩地經營需要兩地保護',
    difficulty: '專家',
    profile: '在中港兩地或跨國經營的企業。面臨複雜的稅務合規要求，CRS資訊交換帶來新的挑戰，需要跨境財富架構規劃。',
    talkTrackExample: '兩地經營的企業最怕的不是業務風險，而是稅務和合規風險。最近政策變化很快，您有沒有做過最新的合規體檢？',
    redFlags: ['可能已有跨境稅務安排', '對合規問題態度消極', '政策敏感度高'],
  },
  {
    code: 'B1',
    name: '創一代',
    category: '個人',
    coreNeeds: ['財富保全', '資產隔離', '稅務策略', '遺產規劃', '跨境配置', '家族信託', '大額壽險', '保險金信託'],
    entryAngle: '辛苦打嘅江山，點樣守住？',
    difficulty: '進階',
    profile: '白手起家的企業家，是家族財富的創造者。最關心如何保護辛苦積累的財富，避免因企業風險、債務問題或繼承糾紛而損失。',
    talkTrackExample: '您用半輩子打下的江山，最怕的不是賺不到錢，而是守不住。有很多合法的方式可以讓您的資產和企業風險徹底分開。',
    redFlags: ['對個人資產情況保密性要求高', '可能不願意面對傳承問題', '習慣自己做決策'],
  },
  {
    code: 'B2',
    name: '繼承者',
    category: '個人',
    coreNeeds: ['遺產規劃', '家族信託', '大額壽險', '保險金信託', '身份規劃'],
    entryAngle: '承接財富需要承接智慧',
    difficulty: '進階',
    profile: '即將或已經繼承家族財富的第二代。面臨財富傳承過程中的稅務、法律和管理挑戰，需要專業的繼承規劃和財富管理方案。',
    talkTrackExample: '承接財富需要承接智慧。我們見過很多第二代因為沒有提前規劃，結果在繼承過程中資產大幅縮水。其實提前做好安排，這些都是可以避免的。',
    redFlags: ['可能缺乏財富管理經驗', '家族內部關係複雜', '決策可能受長輩影響'],
  },
  {
    code: 'B3',
    name: '跨境高淨值',
    category: '個人',
    coreNeeds: ['稅務策略', '跨境配置', '遺產規劃', 'CRS合規', '身份規劃'],
    entryAngle: '兩地資產需要兩地策略',
    difficulty: '進階',
    profile: '在中港兩地或海外都有資產配置的高淨值人士。面臨CRS合規、跨境稅務申報和身份規劃等複雜問題。',
    talkTrackExample: '您在兩地都有資產，但CRS之後，兩地的金融資訊已經自動交換了。如果沒有做好合規規劃，可能面臨補稅甚至罰款的風險。',
    redFlags: ['資產分散在不同司法管轄區', '可能已有海外稅務安排', '對合規風險認識不足'],
  },
];

// ─── Products ───

export const products: Product[] = [
  { id: 1, name: 'Pre-IPO重組', difficulty: '專家', applicableTypes: ['A1'] },
  { id: 2, name: '股權架構設計', difficulty: '專家', applicableTypes: ['A1'] },
  { id: 3, name: '資產隔離架構', difficulty: '進階', applicableTypes: ['A1', 'A2', 'B1'] },
  { id: 4, name: '稅務策略', difficulty: '入門', applicableTypes: ['A1', 'A2', 'A3', 'B1', 'B3'] },
  { id: 5, name: '跨境配置', difficulty: '專家', applicableTypes: ['A1', 'A3', 'B1', 'B3'] },
  { id: 6, name: '家族信託', difficulty: '進階', applicableTypes: ['A2', 'B1', 'B2'] },
  { id: 7, name: '遺產規劃', difficulty: '進階', applicableTypes: ['B1', 'B2', 'B3'] },
  { id: 8, name: '大額壽險', difficulty: '入門', applicableTypes: ['B1', 'B2'] },
  { id: 9, name: '保險金信託', difficulty: '進階', applicableTypes: ['B1', 'B2'] },
  { id: 10, name: 'CRS合規', difficulty: '入門', applicableTypes: ['A3', 'B3'] },
  { id: 11, name: '身份規劃', difficulty: '進階', applicableTypes: ['B2', 'B3'] },
  { id: 12, name: '股份質押融資', difficulty: '專家', applicableTypes: ['A2'] },
];

// ─── Talk Tracks by Scenario ───

export const talkTracksByScenario: TalkTrackByScenario[] = [
  {
    scenario: 'introduction',
    label: '介紹人引薦',
    icon: '🤝',
    script: '王總您好，我是[介紹人]推薦的[你的名字]，專注服務內地企業家在香港的財富規劃。[介紹人]提到您最近在考慮[客戶關注的事項]，我剛好幫幾位類似情況的客戶做過方案，想跟您簡單分享一下經驗，不知道方便嗎？',
  },
  {
    scenario: 'followup',
    label: '活動後跟進',
    icon: '🎯',
    script: '王總，前天在[活動名稱]上跟您聊得很開心。您提到的那個[客戶關注的問題]，我回來後整理了一份資料，裏面有幾個很實用的建議。方便的話，我發給您看看？',
  },
  {
    scenario: 'cold',
    label: '首次冷接觸',
    icon: '📞',
    script: '王總您好，我是[公司名]的[你的名字]。我注意到[具體觀察]，很多類似情況的企業家都在關注[相關議題]，我們最近剛幫一位客戶做了相關的規劃，效果很不錯。不知道您對這方面有沒有興趣了解一下？',
  },
  {
    scenario: 'referral',
    label: '轉介紹請求',
    icon: '🔗',
    script: '王總，很高興方案幫到您。其實像您這樣有遠見的企業家，身邊肯定也有朋友在考慮類似的問題。如果方便的話，您可不可以介紹一兩位讓我認識？我保證會像服務您一樣用心。',
  },
];

// ─── Talk Tracks by Client Type ───

export const talkTracksByType: TalkTrackByType[] = [
  {
    typeCode: 'A1',
    typeName: '擬上市企業',
    script: '聽說貴公司正在準備香港上市，恭喜！上市前有幾個關鍵的架構決定，做對了可以省很多稅，做錯了可能影響整個上市進程。',
  },
  {
    typeCode: 'A2',
    typeName: '已上市企業',
    script: '公司上市後，您個人最大的資產就是股份。有沒有想過，如何讓這些股份不只是帳面財富，而是真正為您和家族服務？',
  },
  {
    typeCode: 'A3',
    typeName: '跨境企業',
    script: '兩地經營的企業最怕的不是業務風險，而是稅務和合規風險。最近政策變化很快，您有沒有做過最新的合規體檢？',
  },
  {
    typeCode: 'B1',
    typeName: '創一代',
    script: '您用半輩子打下的江山，最怕的不是賺不到錢，而是守不住。有很多合法的方式可以讓您的資產和企業風險徹底分開。',
  },
  {
    typeCode: 'B2',
    typeName: '繼承者',
    script: '承接財富需要承接智慧。我們見過很多第二代因為沒有提前規劃，結果在繼承過程中資產大幅縮水。其實提前做好安排，這些都是可以避免的。',
  },
  {
    typeCode: 'B3',
    typeName: '跨境高淨值',
    script: '您在兩地都有資產，但CRS之後，兩地的金融資訊已經自動交換了。如果沒有做好合規規劃，可能面臨補稅甚至罰款的風險。',
  },
];

// ─── Objection Handlers ───

export const objectionHandlers: ObjectionHandler[] = [
  {
    objection: '我已經有理財顧問了',
    response: '完全理解，我們不是要取代您的顧問。家族辦公室的服務跟一般理財不同，專注在財富架構層面，跟現有的投資管理是互補的。',
  },
  {
    objection: '我不需要這些服務',
    response: '很多企業家一開始也這樣想。但當他們了解到資產隔離可以保護個人財產不受企業風險影響時，都覺得這是一個值得了解的選項。',
  },
  {
    objection: '讓我想想再說',
    response: '當然，這些決定確實需要時間考慮。不如我先發一份簡單的案例給您參考，您看完後我們再聊？',
  },
  {
    objection: '收費太貴了',
    response: '我理解您的顧慮。其實我們的服務不是費用，而是投資——一個好的架構規劃，通常第一年就能為您省回數倍於服務費的稅務成本。',
  },
  {
    objection: '我年紀還輕，不急',
    response: '其實越早規劃，選擇越多、成本越低。很多工具一旦錯過了設立的最佳時機，後來要補救的費用可能是現在的數倍。',
  },
  {
    objection: '我不方便透露資產情況',
    response: '完全理解，隱私保護是我們服務的底線。我們有嚴格的保密協議，所有資訊只用於為您制定方案。',
  },
];

// ─── Helper Functions ───

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case '入門': return 'bg-green-100 text-green-700 border-green-200';
    case '進階': return 'bg-amber-100 text-amber-700 border-amber-200';
    case '專家': return 'bg-red-100 text-red-700 border-red-200';
  }
}

export function getDifficultyDot(difficulty: Difficulty): string {
  switch (difficulty) {
    case '入門': return 'bg-green-500';
    case '進階': return 'bg-amber-500';
    case '專家': return 'bg-red-500';
  }
}

export function getClientTypeByCode(code: ClientTypeCode): ClientType {
  return clientTypes.find(c => c.code === code)!;
}

export function getProductsForType(code: ClientTypeCode): Product[] {
  return products.filter(p => p.applicableTypes.includes(code));
}

export function getTypeColor(code: ClientTypeCode): string {
  if (code.startsWith('A')) return 'bg-teal-100 text-teal-700 border-teal-200';
  return 'bg-indigo-100 text-indigo-700 border-indigo-200';
}
