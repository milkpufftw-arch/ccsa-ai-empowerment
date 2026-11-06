# 共創未來｜CCSA AI培力計畫

第一階段可運作展示網站。React 19、TypeScript、Vite 6、Tailwind CSS 4、Lucide、React Router；本地 TypeScript 示範資料，無後端、無個資蒐集與 API 金鑰。

## 本機啟動與測試

使用 Node.js 24（至少22），於專案根目錄執行：

```sh
npm ci
npm run dev
```

終端機顯示開發網址。正式建置與驗證：

```sh
npm run build
npm test
npm run test:e2e
npm run preview
```

端對端測試會啟動正式版本預覽伺服器，驗證手機、平板與桌機路由、搜尋、分類、課程及資源互動。若電腦沒有系統 Chromium，先執行 `npx playwright install chromium`。雲端環境已有 `/usr/bin/chromium`，不需另外下載。測試不會發送報名或寫入真實服務資料。

## 專案架構

- `src/pages/Home.tsx`：首頁。
- `src/pages/Content.tsx`：計畫、種子機構、課程與詳細頁、成果庫與詳細頁、資源、404。
- `src/components/`：導覽頁尾、共用卡片、原創 SVG 情境插畫與品牌圖檔位置。
- `src/data/content.ts`：公開資料型別、六類成果、四種課程、五類學習資源。
- `src/data/content.test.ts`：公開搜尋與發布狀態測試。
- `src/styles.css`：品牌設計與響應式樣式；Tailwind 由 Vite plugin 載入。
- `tests/site.spec.ts`：瀏覽器驗收。
- `netlify.toml`：建置、SPA 路由回退與基本安全標頭。
- `vercel.json`：Vercel 的 Vite 建置、SPA 路由回退與基本安全標頭。

字體由 npm 的 Noto Sans TC 套件隨站提供，不連線 Google Fonts。首頁 SVG 為原創示意，不是真實服務照片。成果圖形為情境示意，非工具截圖。

## Vercel 部署

1. 登入 [Vercel](https://vercel.com/new)，連接有權限讀取本儲存庫的 GitHub 帳號。
2. 匯入 `milkpufftw-arch/ccsa-ai-empowerment`，正式分支選擇 `main`，Root Directory 保留專案根目錄。
3. Framework Preset 選擇 **Vite**。設定已由 `vercel.json` 提供：安裝 `npm ci`、建置 `npm run build`、輸出 `dist`。Node.js 選擇 **24.x**，網站本身不需要環境變數或 API 金鑰。
4. 點選 **Deploy**，完成後使用 Vercel 實際提供的網址，確認首頁、`/courses/ai-basics` 及 `/showcase/meeting-notes` 可直接開啟與重新整理，並測試成果搜尋及手機選單。
5. Git 整合完成後，後續推送至 `main` 會依 Vercel 專案設定自動部署。

目前已準備 Vercel 設定並驗證本機建置；尚未取得 Vercel 帳號授權，未宣稱已完成遠端發布。`vercel.json` 的 rewrite 讓 React Router 深層連結可載入，未知路徑會顯示站內 404（HTTP 仍為 200）。Netlify 專用的 `_redirects`、`_headers` 不負責 Vercel 路由，Vercel 使用 `vercel.json`。

## Netlify 部署

1. 將本專案原始碼與 `package-lock.json` 提交至 Git 儲存庫。
2. 在 Netlify 匯入該儲存庫，分支選擇預計發布的分支。
3. 根目錄為本專案，建置指令 `npm run build`，發布目錄 `dist`；Node 24，無需環境變數或密鑰。
4. 建議先用 Deploy Preview 測試六大頁面、手機選單、篩選及成果深層連結重新整理。
5. 確認正式 Logo、文案與活動資料後再正式發布。本站尚未從本工作區部署到 Netlify；本機 production preview 不等於遠端部署驗證。

`netlify.toml` 的 SPA fallback 支援直接開啟詳細頁。未知網址由 React 404 頁處理，HTTP 仍為 200（SPA soft 404）；若正式 SEO 要求 HTTP 404、各頁預渲染 OG 與爬蟲內容，建議加入預渲染或 SSR。

## 已完成

- 首頁與六大主要頁面導覽、四大子案內容、響應式版型。
- 課程對象篩選、四種示範課程與詳細頁；明確顯示尚未開放報名。
- 六類成果、分類與關鍵字交叉搜尋、空結果、清除篩選、詳細頁與網址狀態保留。
- 完整公開成果欄位與未來發布狀態型別；搜尋僅展示 published 項目。
- 五類資源、分類與可展開操作指引。
- 404、繁中語言標記、描述與頁面標題、語意結構、鍵盤焦點、跳至內容、選單 ARIA 與結果通知。
- 本機字體、原創插畫、示範標記與個資提醒。
- Netlify 與 Vercel 設定、單元與瀏覽器測試。

## 上線前尚待完成

- **正式 CCSA Logo 檔案**：已看到對話圖像，但該圖像未以可讀取檔案掛載至工作區。請將原始 PNG 放入 `public/branding/ccsa-logo.png`，網站即會保留比例顯示；在此之前顯示 CCSA 文字，未重製 Logo。UBS 目前亦為文字名稱識別。
- 四大子案名稱為依 PRD 工作方向整理的網站用語，需主辦確認正式名稱。
- 招募、活動日期地點及合作機構均未當作正式公告；請主辦核定後更新資料。
- 尚未進行真實 Netlify／Vercel 遠端部署、網域與正式內容核定，也未宣稱通過完整無障礙稽核。

## 第二階段建議

1. 先確認報名、投稿、審核、退修及授權流程與個資保存期限。
2. 將內部投稿資料與公開成果分開建模，在後端做權限、欄位白名單、稽核與資料驗證。前端 status 篩選不是安全界線。
3. 導入機構帳號與管理權限，再串接正式資料庫與檔案儲存；聯絡人資料不得放進前端公開資料或 bundle。
4. 增加附件授權、去識別化檢核、人工審核與發布紀錄。AI不執行個案風險決策。
5. 經流程核定後才加入報名表單、通知與 Google Sheets 等外部服務；憑證置於受保護的後端。
6. 依實際成果增補網站搜尋、SEO 預渲染、無障礙人工稽核與成效指標，避免將示範效益當作實證。
