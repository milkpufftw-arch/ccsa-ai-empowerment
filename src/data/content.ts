export const categories = [
  "行政管理與工作效率",
  "方案規劃及教材設計",
  "個案服務與專業工作輔助",
  "青少年AI生活應用",
  "AI治理與倫理",
  "創新服務與跨機構合作",
] as const;
export type Category = (typeof categories)[number];
export type PublicationStatus =
  "draft" | "submitted" | "revision_requested" | "approved" | "published";
// 公開模型不包含聯絡人；第二階段內部投稿資料應於受保護的後端另存。
export interface Showcase {
  id: string;
  title: string;
  organization: string;
  category: Category;
  context: string;
  problem: string;
  tools: string[];
  steps: string[];
  prompt: string;
  attachments: { label: string; url: string }[];
  benefit: string;
  limitations: string;
  publishedAt: string;
  status: PublicationStatus;
  isDemo: true;
  summary: string;
}
export const projects = [
  {
    title: "AI種子機構陪伴",
    en: "GROW TOGETHER",
    description:
      "連結安置機構，從日常實務出發，陪伴團隊找到適合自己的AI應用方式。",
    icon: "sprout",
    color: "green",
    link: "/seed",
  },
  {
    title: "專業人員AI培力",
    en: "EMPOWER PROFESSIONALS",
    description: "循序探索AI工具與工作方法，讓科技成為專業服務的好幫手。",
    icon: "sparkles",
    color: "blue",
    link: "/courses",
  },
  {
    title: "青少年數位培力",
    en: "EXPLORE POSSIBILITIES",
    description: "透過生活應用與創作體驗，培養數位素養、自主學習與未來能力。",
    icon: "rocket",
    color: "orange",
    link: "/courses",
  },
  {
    title: "AI應用共學與分享",
    en: "SHARE & INSPIRE",
    description: "累積可參考的實務經驗，讓一個機構的嘗試，成為更多人的起點。",
    icon: "heart",
    color: "pink",
    link: "/showcase",
  },
];
export const showcases: Showcase[] = [
  {
    id: "meeting-notes",
    title: "把會議整理時間，留給更重要的陪伴",
    organization: "示範種子機構 A",
    category: categories[0],
    context: "機構行政人員整理非個案的工作會議紀錄。",
    problem: "會議後的筆記分散，待辦事項不易追蹤。",
    tools: ["文字生成工具", "文書軟體"],
    steps: [
      "使用完全虛構的會議筆記進行練習。",
      "移除姓名、聯絡資訊與任何個案資料。",
      "請AI依議題、決議及待辦事項整理。",
      "由工作人員逐項核對原文，再完成紀錄。",
    ],
    prompt:
      "請僅依據以下虛構會議筆記，整理議題、決議與待辦清單。未提及的內容請標示「待確認」，不要自行推測。",
    attachments: [],
    benefit:
      "示範整理方式可協助建立一致的紀錄格式；實際節省時間須由各機構自行評估。",
    limitations: "不輸入敏感個資；AI可能誤解語意，所有內容需由人員核對。",
    publishedAt: "2026-11-01",
    status: "published",
    isDemo: true,
    summary: "用結構化提示詞整理會議重點，讓行政工作更有條理。",
  },
  {
    id: "lesson-design",
    title: "從一個想法，到一堂有溫度的數位課",
    organization: "示範種子機構 B",
    category: categories[1],
    context: "工作者規劃青少年數位素養工作坊。",
    problem: "活動設計需要兼顧不同學習步調與參與方式。",
    tools: ["文字生成工具", "簡報工具"],
    steps: [
      "設定虛構的課程情境與學習目標。",
      "請AI產生不同難度的活動提案。",
      "由帶領者檢視可行性與用語。",
      "調整成適合團體的教材。",
    ],
    prompt:
      "請設計一堂60分鐘的數位素養工作坊，包含暖身、分組練習與反思，提供不需個人帳號的替代活動。",
    attachments: [],
    benefit: "提供多種教材草案，作為專業人員討論及調整的起點。",
    limitations: "教材需檢查著作權、資訊正確性及適齡性。",
    publishedAt: "2026-11-02",
    status: "published",
    isDemo: true,
    summary: "把AI當作備課夥伴，設計有選擇、有參與感的學習活動。",
  },
  {
    id: "career-explore",
    title: "用AI打開生活裡的更多可能",
    organization: "示範學習團隊",
    category: categories[3],
    context: "青少年在引導下探索職涯與自主學習。",
    problem: "對未來感到陌生，不知道如何把興趣轉成行動。",
    tools: ["對話式AI", "筆記工具"],
    steps: [
      "用虛構角色描述興趣。",
      "比較三種職業的工作內容。",
      "查證AI提供的資料。",
      "規劃一週可執行的小任務。",
    ],
    prompt:
      "一位喜歡繪畫的虛構角色想了解設計相關職業，請提供三種方向、入門練習與需要查證的資訊。",
    attachments: [],
    benefit: "練習提問、查證與訂定小目標，培養自主探索能力。",
    limitations: "不提供可辨識個人資訊，AI建議不取代職涯諮詢。",
    publishedAt: "2026-11-03",
    status: "published",
    isDemo: true,
    summary: "從興趣出發，練習提問、查證與規劃自己的下一步。",
  },
  {
    id: "professional-support",
    title: "建立服務前的專業檢核清單",
    organization: "示範種子機構 C",
    category: categories[2],
    context: "專業人員準備一般性服務流程。",
    problem: "準備事項容易分散在不同文件中。",
    tools: ["文字生成工具"],
    steps: [
      "僅提供一般性公開流程。",
      "產生準備清單。",
      "由專業人員依組織規範修訂。",
    ],
    prompt:
      "請依公開的一般服務流程，整理服務前準備清單；不涉及任何真實個案或風險判斷。",
    attachments: [],
    benefit: "協助彙整一般性準備事項。",
    limitations: "不得用於自動評估個案、診斷或決策；應依專業規範執行。",
    publishedAt: "2026-11-04",
    status: "published",
    isDemo: true,
    summary: "將公開流程整理成檢核清單，保留專業判斷與人員把關。",
  },
  {
    id: "ai-safety",
    title: "團隊一起寫下AI使用的安全約定",
    organization: "示範共學小組",
    category: categories[4],
    context: "機構團隊建立AI使用基本共識。",
    problem: "團隊對個資、查證及使用界線有不同理解。",
    tools: ["文字生成工具", "共筆文件"],
    steps: [
      "列出虛構的使用情境。",
      "討論哪些資料不能輸入。",
      "建立人工審核及錯誤回報流程。",
    ],
    prompt:
      "請提供機構團隊討論AI使用界線的問題清單，涵蓋個資、查證、著作權與人工覆核。",
    attachments: [],
    benefit: "協助團隊展開對話，形成待審議的使用原則草案。",
    limitations: "示範草案不構成法律意見或正式機構政策。",
    publishedAt: "2026-11-05",
    status: "published",
    isDemo: true,
    summary: "讓個資保護、人工覆核與資訊查證成為團隊的共同語言。",
  },
  {
    id: "cross-agency",
    title: "讓好的實務經驗，跨越機構的距離",
    organization: "示範跨機構團隊",
    category: categories[5],
    context: "跨機構交流公開教材與工具經驗。",
    problem: "實務經驗缺少一致的整理格式。",
    tools: ["共筆文件", "文字生成工具"],
    steps: [
      "選擇不含個資的公開方法。",
      "依共同欄位整理經驗。",
      "由原作者檢查並確認分享範圍。",
    ],
    prompt:
      "請將以下虛構工作方法整理為問題、步驟、效益與限制，保留未確認事項。",
    attachments: [],
    benefit: "建立可比較、可討論的知識分享格式。",
    limitations: "分享前須確認授權，不公開機構內部及服務對象資訊。",
    publishedAt: "2026-11-06",
    status: "published",
    isDemo: true,
    summary: "用共同的紀錄方式，累積可以持續交流的知識資源。",
  },
];
export interface Course {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  audience: string;
  description: string;
  agenda: string[];
  color: string;
}
export const courses: Course[] = [
  {
    id: "ai-basics",
    title: "讓AI成為你的工作好夥伴",
    type: "專業人員・初階課程",
    date: "2026-12-10",
    time: "09:30–16:30",
    location: "線上課程（示範）",
    audience: "兒少安置機構專業工作者",
    description: "從基本觀念與提示詞練習出發，認識AI能提供的協助與使用界線。",
    agenda: ["AI入門與工作情境", "提示詞練習與資訊查證", "個資保護與人工覆核"],
    color: "blue",
  },
  {
    id: "ai-advanced",
    title: "從工具到流程：AI實務應用工作坊",
    type: "專業人員・進階課程",
    date: "2027-01-15",
    time: "10:00–16:00",
    location: "臺北場（示範）",
    audience: "具AI基本操作經驗的專業人員",
    description: "以非個案的行政與方案情境，練習設計可重複使用的工作流程。",
    agenda: ["工作流程拆解", "教材與方案規劃", "成果檢核與交流"],
    color: "green",
  },
  {
    id: "youth-lab",
    title: "我的AI生活實驗室",
    type: "青少年・生活應用訓練",
    date: "2027-02-06",
    time: "13:30–16:30",
    location: "臺中場（示範）",
    audience: "安置機構青少年，參與條件待公告",
    description: "從生活中的小問題出發，探索AI、練習提問，也學習判斷資訊。",
    agenda: ["認識AI與數位足跡", "生活問題探索", "查證與成果分享"],
    color: "orange",
  },
  {
    id: "creative-day",
    title: "一起創作！AI體驗教育日",
    type: "青少年・AI體驗教育",
    date: "2027-03-20",
    time: "13:30–16:30",
    location: "高雄場（示範）",
    audience: "安置機構青少年，參與條件待公告",
    description: "以團體創作與引導討論，體驗科技的可能，保留自己的想法。",
    agenda: ["創意暖身", "AI協作練習", "作品與使用界線討論"],
    color: "pink",
  },
];
export const resourceCategories = [
  "全部資源",
  "AI工具教學",
  "提示詞範例",
  "課程教材",
  "AI倫理與個資保護",
  "實務操作指引",
];
export const resources = [
  {
    id: "tool",
    title: "第一次使用AI：提問與查證入門",
    category: "AI工具教學",
    body: "先設定任務與輸出格式，再核對資訊來源。請勿輸入服務對象或機構敏感資料。",
    steps: [
      "以公開資訊或虛構情境練習。",
      "說明任務、背景與格式。",
      "逐項查證輸出內容，再由人員決定是否使用。",
    ],
  },
  {
    id: "prompt",
    title: "讓需求更清楚的提示詞練習",
    category: "提示詞範例",
    body: "範例：請依以下虛構活動構想，整理目標、流程與材料。未提供的資訊請標示待確認。",
    steps: [
      "描述希望完成的工作。",
      "加入限制條件與受眾。",
      "請AI標記不確定資訊，保留人工修改空間。",
    ],
  },
  {
    id: "lesson",
    title: "數位素養工作坊：帶領者筆記",
    category: "課程教材",
    body: "以提問、查證、反思三個步驟規劃團體練習，讓每位參與者都能選擇合適的參與方式。",
    steps: [
      "先談數位足跡與資料保護。",
      "使用虛構角色進行分組練習。",
      "討論AI回答可能有的錯誤與偏見。",
    ],
  },
  {
    id: "privacy",
    title: "輸入之前，先做一次個資檢查",
    category: "AI倫理與個資保護",
    body: "不輸入姓名、照片、聯絡資訊、可辨識的個案經歷或其他敏感資料。去除姓名不代表資料已無法辨識。",
    steps: [
      "檢查直接與間接識別資訊。",
      "改用完全虛構的情境。",
      "依機構核准的工具與資料處理規範操作。",
    ],
  },
  {
    id: "workflow",
    title: "AI協作的四步驟檢核",
    category: "實務操作指引",
    body: "釐清目的、檢查資料、人工查證、記錄限制。AI是輔助工具，最終責任與判斷由專業人員承擔。",
    steps: [
      "定義適合AI協助的任務。",
      "確認輸入資料與工具使用範圍。",
      "覆核產出、記錄限制並持續調整。",
    ],
  },
];
export function filterShowcases(
  items: Showcase[],
  category: string,
  query: string,
) {
  const q = query.trim().toLocaleLowerCase();
  return items.filter(
    (x) =>
      x.status === "published" &&
      (category === "全部成果" || x.category === category) &&
      [x.title, x.summary, x.category, x.organization, x.context, ...x.tools]
        .join(" ")
        .toLocaleLowerCase()
        .includes(q),
  );
}
