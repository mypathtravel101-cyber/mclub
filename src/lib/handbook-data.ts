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
  needsDetail: NeedDetail[];
  dualNeedHint?: string;
}

export interface NeedDetail {
  need: string;
  products: string;
  talkingPoint: string;
}

export interface Product {
  id: number;
  name: string;
  difficulty: Difficulty;
  applicableTypes: ClientTypeCode[];
  description: string;
  graduateGuide: string;
}

export interface TalkTrackByScenario {
  scenario: string;
  label: string;
  icon: string;
  script: string;
  tip: string;
}

export interface TalkTrackByType {
  typeCode: ClientTypeCode;
  typeName: string;
  script: string;
  tip: string;
}

export interface ObjectionHandler {
  objection: string;
  hiddenConcern: string;
  response: string;
}

export interface RedFlagItem {
  category: string;
  signal: string;
  action: string;
  icon: string;
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
    needsDetail: [
      { need: '股權架構', products: '上市前股權重組、離岸架構搭建、控股公司設計', talkingPoint: '提供專業的股權架構建議，連接法律和稅務團隊' },
      { need: '稅務規劃', products: '上市過程中的稅務成本優化、跨境稅務合規', talkingPoint: '幫助客戶預估稅務影響，推薦合規的稅務優化方案' },
      { need: '資產隔離', products: '將個人資產與企業風險隔離、家族信託設立', talkingPoint: '解釋資產隔離的重要性，推薦信託和保險架構方案' },
      { need: '跨境資金', products: 'IPO募集資金的跨境回流、外匯管理合規', talkingPoint: '協調跨境金融服務，提供資金通道解決方案' },
    ],
    dualNeedHint: 'A1 客戶的創始人往往同時是 B1 創一代，建議在解決 IPO 架構後，自然過渡到個人資產隔離話題。',
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
    needsDetail: [
      { need: '股份管理', products: '鎖定期規劃、減持策略、分紅安排', talkingPoint: '制定系統的上市後財富管理計劃' },
      { need: '資產隔離', products: '家族信託、保險架構', talkingPoint: '將股份財富與個人風險隔離' },
      { need: '流動資金', products: '股份質押融資方案', talkingPoint: '在不減持的情況下獲得流動資金' },
    ],
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
    needsDetail: [
      { need: '跨境稅務', products: '兩地稅務規劃、避免雙重徵稅', talkingPoint: '幫助客戶優化跨境稅務結構' },
      { need: '資金流動', products: '跨境資金通道、外匯管理合規', talkingPoint: '提供合法高效的資金流動方案' },
      { need: '企業重組', products: '跨境實體重組、雙幣種對沖', talkingPoint: '優化企業跨境架構' },
    ],
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
    needsDetail: [
      { need: '財富保全', products: '大額壽險、資產隔離架構、離岸信託', talkingPoint: '強調「守住」比「增值」更重要' },
      { need: '資產隔離', products: '家族信託、保險金信託、離岸公司', talkingPoint: '強調個人資產與企業風險分離的必要性' },
      { need: '稅務策略', products: '跨境稅務規劃、CRS合規方案', talkingPoint: '強調合規前提下的稅務優化' },
      { need: '遺產規劃', products: '遺囑+信託組合、保險受益人安排', talkingPoint: '強調有序傳承避免家族糾紛' },
      { need: '跨境配置', products: '離岸資產配置、多幣種投資', talkingPoint: '強調分散風險和匯率對沖' },
    ],
    dualNeedHint: 'B1 創一代往往同時是 A1 擬上市企業的控股股東，一個客戶可能帶來兩條業務線機會！',
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
    needsDetail: [
      { need: '遺產規劃', products: '遺囑+信託組合、繼承稅務優化', talkingPoint: '強調提前規劃避免繼承糾紛和資產縮水' },
      { need: '財產保護', products: '婚前協議保障、家族信託', talkingPoint: '保護個人資產不受婚姻變化影響' },
      { need: '身份規劃', products: '海外身份配置、稅務居民規劃', talkingPoint: '通過身份規劃優化稅務和資產佈局' },
    ],
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
    needsDetail: [
      { need: 'CRS合規', products: '合規體檢、資訊申報輔導', talkingPoint: '確保跨境資產申報合規，避免罰款風險' },
      { need: '稅務策略', products: '雙重徵稅規避、跨境稅務規劃', talkingPoint: '在合規前提下優化跨境稅務負擔' },
      { need: '身份規劃', products: '稅務居民身份優化、多護照配置', talkingPoint: '通過身份規劃實現稅務和資產保護目標' },
    ],
  },
];

// ─── Products ───

export const products: Product[] = [
  { id: 1, name: 'Pre-IPO重組', difficulty: '專家', applicableTypes: ['A1'], description: '上市前股權重組和架構調整，確保上市流程順暢', graduateGuide: '需導師陪同或轉介——門檻高但回報大' },
  { id: 2, name: '股權架構設計', difficulty: '專家', applicableTypes: ['A1'], description: '設計最優的控股架構，保護控股權和稅務效率', graduateGuide: '需導師陪同或轉介——門檻高但回報大' },
  { id: 3, name: '資產隔離架構', difficulty: '進階', applicableTypes: ['A1', 'A2', 'B1'], description: '將個人資產與企業風險隔離，保護家族財富', graduateGuide: '累積一定經驗後推薦——需要更深入的需求分析能力' },
  { id: 4, name: '稅務策略', difficulty: '入門', applicableTypes: ['A1', 'A2', 'A3', 'B1', 'B3'], description: '合規的稅務優化方案，跨境稅務規劃', graduateGuide: '新畢業生首3個月可獨立推薦——需求明確、容易開口、成交相對快' },
  { id: 5, name: '跨境配置', difficulty: '專家', applicableTypes: ['A1', 'A3', 'B1', 'B3'], description: '離岸資產配置、多幣種投資、匯率對沖', graduateGuide: '需導師陪同或轉介——門檻高但回報大' },
  { id: 6, name: '家族信託', difficulty: '進階', applicableTypes: ['A2', 'B1', 'B2'], description: '設立家族信託，實現財富傳承和資產保護', graduateGuide: '累積一定經驗後推薦——需要更深入的需求分析能力' },
  { id: 7, name: '遺產規劃', difficulty: '進階', applicableTypes: ['B1', 'B2', 'B3'], description: '遺囑+信託組合方案，有序傳承避免糾紛', graduateGuide: '累積一定經驗後推薦——需要更深入的需求分析能力' },
  { id: 8, name: '大額壽險', difficulty: '入門', applicableTypes: ['B1', 'B2'], description: '財富保全的基礎工具，保障與傳承兼備', graduateGuide: '新畢業生首3個月可獨立推薦——需求明確、容易開口、成交相對快' },
  { id: 9, name: '保險金信託', difficulty: '進階', applicableTypes: ['B1', 'B2'], description: '保險與信託的結合，實現更靈活的財富傳承', graduateGuide: '累積一定經驗後推薦——需要更深入的需求分析能力' },
  { id: 10, name: 'CRS合規', difficulty: '入門', applicableTypes: ['A3', 'B3'], description: '共同申報準則合規體檢和申報輔導', graduateGuide: '新畢業生首3個月可獨立推薦——需求明確、容易開口、成交相對快' },
  { id: 11, name: '身份規劃', difficulty: '進階', applicableTypes: ['B2', 'B3'], description: '海外身份配置、稅務居民規劃', graduateGuide: '累積一定經驗後推薦——需要更深入的需求分析能力' },
  { id: 12, name: '股份質押融資', difficulty: '專家', applicableTypes: ['A2'], description: '以上市公司股份作質押獲取流動資金', graduateGuide: '需導師陪同或轉介——門檻高但回報大' },
];

// ─── Talk Tracks by Scenario ───

export const talkTracksByScenario: TalkTrackByScenario[] = [
  {
    scenario: 'introduction',
    label: '介紹人引薦',
    icon: '🤝',
    script: '王總您好，我是[介紹人]推薦的[你的名字]，專注服務內地企業家在香港的財富規劃。[介紹人]提到您最近在考慮[客戶關注的事項]，我剛好幫幾位類似情況的客戶做過方案，想跟您簡單分享一下經驗，不知道方便嗎？',
    tip: '迅速建立專業形象，同時尊重介紹人的面子',
  },
  {
    scenario: 'followup',
    label: '活動後跟進',
    icon: '🎯',
    script: '王總，前天在[活動名稱]上跟您聊得很開心。您提到的那個[客戶關注的問題]，我回來後整理了一份資料，裏面有幾個很實用的建議。方便的話，我發給您看看？',
    tip: '喚起客戶對活動的記憶，迅速過渡到你能提供的價值',
  },
  {
    scenario: 'cold',
    label: '首次冷接觸',
    icon: '📞',
    script: '王總您好，我是[公司名]的[你的名字]。我注意到[具體觀察]，很多類似情況的企業家都在關注[相關議題]，我們最近剛幫一位客戶做了相關的規劃，效果很不錯。不知道您對這方面有沒有興趣了解一下？',
    tip: '30秒內讓對方覺得「這個人可能對我有用」，不要推銷產品',
  },
  {
    scenario: 'referral',
    label: '轉介紹請求',
    icon: '🔗',
    script: '王總，很高興方案幫到您。其實像您這樣有遠見的企業家，身邊肯定也有朋友在考慮類似的問題。如果方便的話，您可不可以介紹一兩位讓我認識？我保證會像服務您一樣用心。',
    tip: '每次成功服務後都是最佳時機，話術要自然不要讓客戶感到壓力',
  },
];

// ─── Talk Tracks by Client Type ───

export const talkTracksByType: TalkTrackByType[] = [
  {
    typeCode: 'A1',
    typeName: '擬上市企業',
    script: '聽說貴公司正在準備香港上市，恭喜！上市前有幾個關鍵的架構決定，做對了可以省很多稅，做錯了可能影響整個上市進程。',
    tip: '聚焦「上市前」的緊迫性，客戶會感到時間壓力而願意聆聽',
  },
  {
    typeCode: 'A2',
    typeName: '已上市企業',
    script: '公司上市後，您個人最大的資產就是股份。有沒有想過，如何讓這些股份不只是帳面財富，而是真正為您和家族服務？',
    tip: '聚焦「帳面財富 vs 實際掌控」的落差',
  },
  {
    typeCode: 'A3',
    typeName: '跨境企業',
    script: '兩地經營的企業最怕的不是業務風險，而是稅務和合規風險。最近政策變化很快，您有沒有做過最新的合規體檢？',
    tip: '聚焦「政策變化」製造即時性',
  },
  {
    typeCode: 'B1',
    typeName: '創一代',
    script: '您用半輩子打下的江山，最怕的不是賺不到錢，而是守不住。有很多合法的方式可以讓您的資產和企業風險徹底分開。',
    tip: '聚焦「守住」的焦慮，情感共鳴',
  },
  {
    typeCode: 'B2',
    typeName: '繼承者',
    script: '承接財富需要承接智慧。我們見過很多第二代因為沒有提前規劃，結果在繼承過程中資產大幅縮水。其實提前做好安排，這些都是可以避免的。',
    tip: '聚焦「縮水風險」，理性但不失溫度',
  },
  {
    typeCode: 'B3',
    typeName: '跨境高淨值',
    script: '您在兩地都有資產，但CRS之後，兩地的金融資訊已經自動交換了。如果沒有做好合規規劃，可能面臨補稅甚至罰款的風險。',
    tip: '聚焦「CRS合規」的急迫性',
  },
];

// ─── Objection Handlers ───

export const objectionHandlers: ObjectionHandler[] = [
  {
    objection: '我已經有理財顧問了',
    hiddenConcern: '不想破壞現有關係；不覺得你有額外價值',
    response: '完全理解，我們不是要取代您的顧問。家族辦公室的服務跟一般理財不同，專注在財富架構層面，跟現有的投資管理是互補的。',
  },
  {
    objection: '我不需要這些服務',
    hiddenConcern: '不了解家族辦公室的價值；覺得自己目前的安排已經夠好',
    response: '很多企業家一開始也這樣想。但當他們了解到資產隔離可以保護個人財產不受企業風險影響時，都覺得這是一個值得了解的選項。',
  },
  {
    objection: '讓我想想再說',
    hiddenConcern: '猶豫不決；需要更多時間消化資訊；可能還有未表達的疑慮',
    response: '當然，這些決定確實需要時間考慮。不如我先發一份簡單的案例給您參考，您看完後我們再聊？這樣您做決定時也有更多依據。',
  },
  {
    objection: '收費太貴了',
    hiddenConcern: '不確定價值是否匹配價格；可能在比較其他供應商',
    response: '我理解您的顧慮。其實我們的服務不是費用，而是投資——一個好的架構規劃，通常第一年就能為您省回數倍於服務費的稅務成本。',
  },
  {
    objection: '我年紀還輕，不急',
    hiddenConcern: '覺得傳承規劃是老年人的事；不了解提前規劃的複利效應',
    response: '其實越早規劃，選擇越多、成本越低。很多工具一旦錯過了設立的最佳時機，後來要補救的費用可能是現在的數倍。',
  },
  {
    objection: '我不方便透露資產情況',
    hiddenConcern: '擔心隱私洩露；對你還不夠信任',
    response: '完全理解，隱私保護是我們服務的底線。我們有嚴格的保密協議，所有資訊只用於為您制定方案。第一次溝通不需要提供具體數字，我們可以從大方向聊起。',
  },
];

// ─── Red Flags ───

export const redFlags: RedFlagItem[] = [
  {
    category: '合規風險',
    signal: '客戶要求不合法的操作；涉及洗錢或資金來源不明的情況',
    action: '立即停止，報告合規團隊',
    icon: '🚨',
  },
  {
    category: '利益衝突',
    signal: '你個人與客戶有利益關係；你同時服務有競爭關係的客戶',
    action: '向主管披露，尋求指導',
    icon: '⚖️',
  },
  {
    category: '超範圍承諾',
    signal: '客戶要求你提供法律或稅務建議；你對產品不夠了解卻被追問',
    action: '誠實說明專業範圍，轉介專業團隊',
    icon: '⚠️',
  },
  {
    category: '客戶壓力',
    signal: '客戶催促快速成交；客戶不願意提供必要的合規文件',
    action: '放慢節奏，堅持合規流程',
    icon: '⏰',
  },
  {
    category: '情緒困擾',
    signal: '客戶在情緒不穩定時做重大決定；家族內部有明顯衝突',
    action: '建議客戶冷靜期，不要趁人之危',
    icon: '💭',
  },
];

// ─── Objection Handling Principles ───

export const objectionPrinciples = [
  { principle: '永遠不要與客戶對抗', detail: '先認可感受（「我理解您的顧慮」），再提供你的視角' },
  { principle: '用問題代替陳述', detail: '「您最主要的擔心是甚麼？是成本方面，還是對服務效果不確定？」' },
  { principle: '用具體案例代替抽象承諾', detail: '「我們上個月幫一位深圳的製造業客戶，第一年就省了約八百萬的稅」' },
  { principle: '知道何時停止', detail: '客戶連續三次表示不感興趣，尊重決定，3-6個月後軟性重新接觸' },
];

// ─── Dual Need Detection ───

export const dualNeedPairs = [
  {
    primary: 'A1',
    secondary: 'B1',
    reason: '擬上市企業的創始人往往同時有個人財富隔離需求',
    strategy: '先幫客戶解決 IPO 的股權架構問題，再在合適的時機提出個人資產隔離的建議',
  },
  {
    primary: 'B1',
    secondary: 'A1',
    reason: '創一代若仍在經營企業，可能同時有企業上市或融資需求',
    strategy: '從個人財富保全入手，建立信任後再探討企業層面的規劃',
  },
  {
    primary: 'B1',
    secondary: 'A3',
    reason: '創一代的企業可能涉及跨境經營，需要跨境稅務規劃',
    strategy: '先處理個人資產隔離，再延伸到企業跨境架構優化',
  },
];

// ─── Helper Functions ───

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case '入門': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case '進階': return 'bg-amber-100 text-amber-700 border-amber-200';
    case '專家': return 'bg-red-100 text-red-700 border-red-200';
  }
}

export function getDifficultyDot(difficulty: Difficulty): string {
  switch (difficulty) {
    case '入門': return 'bg-emerald-500';
    case '進階': return 'bg-amber-500';
    case '專家': return 'bg-red-500';
  }
}

export function getDifficultyBg(difficulty: Difficulty): string {
  switch (difficulty) {
    case '入門': return 'bg-emerald-500';
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
  return 'bg-violet-100 text-violet-700 border-violet-200';
}

export function getTypeSolidBg(code: ClientTypeCode): string {
  if (code.startsWith('A')) return 'bg-teal-600 text-white';
  return 'bg-violet-600 text-white';
}

export function getDualNeeds(code: ClientTypeCode) {
  return dualNeedPairs.filter(d => d.primary === code || d.secondary === code);
}
