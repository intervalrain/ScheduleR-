### **Phase 1: Sprint 與任務核心功能 (CRUD)**

此階段的目標是建立專案的基礎，包括資料模型、核心 UI 元件，以及 Sprint 和任務的基本建立、讀取、更新、刪除功能，並完成 Kanban 和 Calendar 模組的初步版本。

**1.1: 資料模型與資料庫設定**

*   **任務**: 根據 `@dev.md` 的 ERD，更新 `prisma/schema.prisma` 檔案，定義 `User`, `Team`, `Sprint`, `Task`, `Dependency`, `SubTask`, `Note`, `CalendarEvent` 等模型。
*   **執行**:
    1.  修改 `prisma/schema.prisma`。
    2.  執行 `npx prisma migrate dev --name init-models` 來建立資料庫遷移檔案並同步資料庫結構。

**1.2: UI 元件庫整合 (shadcn/ui)**

*   **任務**: 初始化並設定 `shadcn/ui`，為後續的 UI 開發做準備。
*   **執行**:
    1.  執行 `npx shadcn-ui@latest init` 指令，並依提示完成設定。
    2.  根據需要，加入常用的元件，例如 `button`, `dialog`, `input`, `select`, `datepicker`。

**1.3: Sprint 管理功能**

*   **任務**: 實作 Sprint 的選擇、切換與新增功能。
*   **前端**:
    1.  在 `src/components/Header.tsx` 中，建立一個下拉選單 (`Select`) 來顯示與切換 Sprints。
    2.  建立一個「新增 Sprint」的對話框 (`Dialog`)，包含名稱、起訖日期 (`DatePicker`) 等欄位。
*   **後端**: 使用已建立的 `GET /api/sprints` 和 `POST /api/sprints` API。

**1.4: 任務管理功能**

*   **任務**: 實作任務的新增與編輯功能。
*   **前端**:
    1.  在 `Header` 中新增一個「新增任務」按鈕。
    2.  建立一個對話框表單，讓使用者可以輸入任務的各項屬性。
*   **後端**: 使用已建立的 `POST /api/tasks` 和 `PUT /api/tasks/:id` API。

**1.5: Kanban 模組**

*   **任務**: 建立一個基本的 Kanban 看板，支援任務狀態的拖拉變更。
*   **前端**:
    1.  建立 `src/app/kanban/page.tsx` 路由。
    2.  安裝 `react-beautiful-dnd` 或類似的拖拉套件。
    3.  根據任務的 `status` 欄位，將任務顯示在對應的欄位中（Pending, Ongoing, Done）。
    4.  實作拖拉任務以更新其 `status` 的功能。
*   **後端**: 使用 `GET /api/tasks?sprintId=` 取得任務，並在拖拉時呼叫 `PUT /api/tasks/:id`。

**1.6: Calendar 模組**

*   **任務**: 建立一個基本的日曆視圖，用於顯示與建立事件。
*   **前端**:
    1.  建立 `src/app/calendar/page.tsx` 路由。
    2.  安裝 `react-big-calendar` 或類似的日曆套件。
    3.  在日曆上顯示 `CalendarEvent`。
    4.  提供新增事件的功能。
*   **後端**: 建立 `GET /api/calendar` 和 `POST /api/calendar` 的 API。

---

### **Phase 2: Workspace 功能 + Sidebar 串接**

此階段的目標是開發核心的 Workspace 模組，用於顯示任務詳情和相關操作，並將 Sidebar 與其串接。

**2.1: Workspace 模組**

*   **任務**: 建立任務詳情頁面，顯示任務內容，並支援子任務和筆記功能。
*   **前端**:
    1.  建立 `src/app/workspace/[taskId]/page.tsx` 路由。
    2.  根據 `taskId` 顯示任務的詳細內容（名稱、描述、預估工時、優先級、標籤、狀態等）。
    3.  實作子任務/檢查項目的建立、完成狀態切換功能。
    4.  實作 Markdown 筆記的建立和編輯功能。
*   **後端**: 建立 `GET /api/workspace/task/{id}` API，並擴充 `PUT /api/tasks/{id}` 以支援子任務和筆記的更新。

**2.2: Sidebar 模組**

*   **任務**: 實作 Sidebar 顯示當前 Sprint 中的 Ongoing 任務清單，並支援排序和跳轉。
*   **前端**:
    1.  在 `src/components/Sidebar.tsx` 中，從後端獲取並顯示當前 Sprint 中狀態為 "Ongoing" 的任務清單。
    2.  實作任務清單的上下拖曳排序功能（同步 Kanban 順序）。
    3.  點擊 Sidebar 中的任務項目，可以跳轉到對應的 Workspace 模組 (`/workspace/:taskId`)。
*   **後端**: 擴充 `GET /api/tasks?sprintId=` 以支援過濾 "Ongoing" 狀態的任務，並提供更新任務順序的 API (例如 `PUT /api/tasks/reorder`)。

---

### **Phase 3: Gantt 與 Dashboard 初版**

此階段的目標是開發 Gantt 圖和 Dashboard 模組的初步版本，提供專案進度和效能的視覺化。

**3.1: Gantt 模組**

*   **任務**: 建立 Gantt 圖頁面，顯示任務時間軸、依賴關係，並支援調整。
*   **前端**:
    1.  建立 `src/app/gantt/page.tsx` 路由。
    2.  整合 Gantt 圖表庫（例如 `react-gantt-chart` 或自定義實現）。
    3.  根據任務的 `startDate`、`endDate` 和 `estimateHours` 在 Gantt 圖上顯示任務。
    4.  實作拖拉任務條以調整任務時長和日期。
    5.  視覺化任務之間的依賴關係。
    6.  標示里程碑和關鍵路徑。
*   **後端**: 擴充 `GET /api/tasks` 以包含時間和依賴關係數據，並提供更新任務時間和依賴關係的 API。

**3.2: Dashboard 模組**

*   **任務**: 建立可自定義的 Dashboard 頁面，包含多種專案指標的 Widget。
*   **前端**:
    1.  建立 `src/app/dashboard/page.tsx` 路由。
    2.  實作一個可拖曳的 Widget 系統（例如 `react-grid-layout` 或自定義實現）。
    3.  建立預設 Widget：燃盡圖 (Burn Down Chart)、Sprint 完成率、總可用工時、已耗工時、進度條。
    4.  將使用者的 Dashboard 佈局儲存到 `localStorage`。
*   **後端**: 建立 `GET /api/dashboard/summary` API，提供各 Widget 所需的數據。

---

### **Phase 4: OAuth 登入與 User Profile 模組**

此階段的目標是實作使用者認證功能，並管理使用者個人資料和團隊。

**4.1: Google OAuth 登入**

*   **任務**: 實作 Google OAuth 認證，讓使用者可以透過 Google 帳號登入。
*   **前端**:
    1.  建立 `src/app/login/page.tsx` 登入頁面。
    2.  在登入頁面提供 Google 登入按鈕。
*   **後端**:
    1.  安裝 `next-auth` 套件。
    2.  建立 `src/app/api/auth/[...nextauth]/route.ts` 檔案，配置 NextAuth.js。
    3.  配置 Google Provider，並設定 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 環境變數。
    4.  實作 `POST /auth/google` API 端點，處理 OAuth 回調。

**4.2: User Profile 管理**

*   **任務**: 實作使用者個人資料的建立、更新，以及團隊的建立和加入功能。
*   **前端**:
    1.  建立使用者個人資料設定頁面。
    2.  提供表單讓使用者可以編輯名稱、頭像等。
    3.  提供建立和加入團隊的介面。
*   **後端**:
    1.  更新 `prisma/schema.prisma` 中的 `User` 和 `Team` 模型，確保包含所有必要的欄位。
    2.  建立 API 端點來處理使用者個人資料的建立、更新，以及團隊的建立、加入和管理。

---

### **Phase 5: 全鍵盤控制與外部依賴視覺化支援**

此階段的目標是提升使用者操作效率，並提供更全面的專案依賴關係視覺化。

**5.1: 全鍵盤操作支援**

*   **任務**: 實作常用功能的快捷鍵，並提供命令面板。
*   **前端**:
    1.  定義並實作常用操作的鍵盤快捷鍵（hotkeys）。
    2.  建立一個可透過快捷鍵呼叫的命令面板 (Command Palette)，讓使用者可以快速搜尋和執行功能。
    3.  （未來擴充）研究並支援 Vim 模式/Emacs 風格操作。

**5.2: 外部依賴視覺化支援**

*   **任務**: 實作全局任務依賴關係的視覺化，例如泳道圖。
*   **前端**:
    1.  建立一個新的頁面或模組，用於顯示全局任務依賴關係圖。
    2.  選擇合適的圖表庫或自定義實現來繪製依賴關係圖（例如，基於 D3.js 或類似的圖形庫）。
    3.  視覺化跨團隊任務依賴（如果已實作團隊管理）。
*   **後端**: 建立 API 端點來獲取所有任務及其依賴關係數據。

**5.3: Plugin 機制與 API 擴充**

*   **任務**: 設計並實作基本的 Plugin 機制，允許擴充功能。
*   **後端**:
    1.  定義 Plugin 的註冊和載入機制。
    2.  暴露核心 API 供 Plugin 開發者使用。

**5.4: Assignees 功能 (已完成)**

*   **任務**: 實作任務指派給使用者的功能。 ✅
*   **前端**:
    1.  在任務編輯表單中，新增指派給使用者的欄位（例如，下拉選單）。 ✅
    2.  在 Kanban 看板顯示指派用戶的頭像和資訊。 ✅
*   **後端**:
    1.  更新 `Task` 模型，新增 `assigneeId` 欄位，並與 `User` 模型建立關聯。 ✅
    2.  修改 `POST /api/tasks` 和 `PUT /api/tasks/{id}` API，以支援任務指派。 ✅

---

### **Phase 6: 核心模組完善與 UX 優化**

此階段的目標是完善現有核心功能，提升使用者體驗，並實作泳道圖等進階視覺化工具。

**6.1: Workspace 模組完整實作**

*   **任務**: 建立功能完整的任務詳情頁面，支援複雜的任務管理操作。
*   **前端**:
    1.  建立 `src/app/workspace/[taskId]/page.tsx` 路由的完整實作。
    2.  任務詳情頁面包含：
        *   任務基本資訊編輯（標題、描述、狀態、優先級）
        *   時間追蹤和工時記錄
        *   子任務管理系統（新增、編輯、排序、完成狀態）
        *   Markdown 筆記編輯器（支援即時預覽）
        *   任務歷史和活動記錄
        *   檔案附件上傳和管理
    3.  實作任務關聯功能（依賴關係、相關任務）。
    4.  任務狀態變更的視覺化回饋。
*   **後端**:
    1.  建立 `GET /api/workspace/task/{id}` API，提供完整任務資訊。
    2.  實作子任務 CRUD API：`POST /api/tasks/{id}/subtasks`、`PUT /api/subtasks/{id}`。
    3.  實作筆記管理 API：`POST /api/tasks/{id}/notes`、`PUT /api/notes/{id}`。
    4.  實作活動記錄 API，追蹤任務變更歷史。

**6.2: Sidebar 與導航優化**

*   **任務**: 完善 Sidebar 功能，提供更好的任務導航和管理體驗。
*   **前端**:
    1.  優化 `src/components/Sidebar.tsx`，支援：
        *   當前 Sprint 任務清單的即時更新
        *   任務狀態的視覺化指示
        *   拖拽排序任務優先級
        *   任務過濾和搜尋功能
    2.  實作任務清單與 Workspace 的無縫跳轉。
    3.  新增「我的任務」、「已指派給我」、「我建立的」等篩選器。
    4.  支援任務快速操作（標記完成、更改狀態）。
*   **後端**:
    1.  擴充 `GET /api/tasks` API，支援複雜的過濾條件。
    2.  實作任務排序 API：`PUT /api/tasks/reorder`。

**6.3: 泳道圖 (Swimlane Diagram) 實作**

*   **任務**: 實作泳道圖，提供跨團隊任務流程的視覺化。
*   **前端**:
    1.  建立 `src/app/swimlane/page.tsx` 路由。
    2.  實作泳道圖組件：
        *   按團隊或使用者分組的水平泳道
        *   任務在不同階段之間的流動顯示
        *   任務狀態和瓶頸的視覺化識別
        *   支援拖拽移動任務到不同泳道
    3.  整合時間軸顯示，展示任務的時間進度。
    4.  提供泳道自定義設定（按團隊、使用者、專案分組）。
*   **後端**:
    1.  建立 `GET /api/swimlane/data` API，提供泳道圖所需的資料結構。
    2.  實作跨團隊任務流程分析功能。

---

### **Phase 7: Dashboard Widget 系統與分析工具**

此階段的目標是建立功能強大的 Dashboard 系統，提供豐富的專案分析和監控工具。

**7.1: Dashboard Widget 架構**

*   **任務**: 建立可擴展的 Widget 系統架構。
*   **前端**:
    1.  重構 `src/app/dashboard/page.tsx`，實作可拖拽的 Widget 系統。
    2.  使用 `react-grid-layout` 實作：
        *   Widget 的拖拽和調整大小
        *   Layout 的保存和恢復
        *   響應式設計支援
    3.  建立 Widget 基礎組件架構：
        *   Widget 容器組件
        *   Widget 配置面板
        *   Widget 資料刷新機制
*   **後端**:
    1.  建立 `GET /api/dashboard/layout` 和 `POST /api/dashboard/layout` API。
    2.  實作 Widget 配置的資料庫儲存。

**7.2: 核心 Dashboard Widget 實作**

*   **任務**: 實作常用的專案管理 Widget。
*   **前端**:
    1.  燃盡圖 (Burn Down Chart) Widget：
        *   顯示 Sprint 進度和剩餘工作量
        *   理想進度線和實際進度對比
        *   支援不同時間範圍
    2.  Sprint 完成率 Widget：
        *   任務完成百分比
        *   按優先級分類的完成狀況
        *   延遲任務警示
    3.  工時分析 Widget：
        *   總可用工時 vs 已安排工時
        *   團隊成員工時分佈
        *   工時趨勢分析
    4.  任務狀態分佈 Widget：
        *   圓餅圖顯示任務狀態分佈
        *   任務優先級分析
    5.  團隊效能 Widget：
        *   團隊成員績效指標
        *   任務完成速度趨勢
*   **後端**:
    1.  建立各 Widget 的專用 API 端點。
    2.  實作資料聚合和分析功能。

**7.3: 進階分析工具**

*   **任務**: 提供深度分析和報告功能。
*   **前端**:
    1.  實作進階篩選和分組功能。
    2.  建立匯出報告功能（PDF、Excel）。
    3.  實作自定義時間範圍分析。
*   **後端**:
    1.  建立數據分析 API，支援複雜查詢。
    2.  實作報告生成功能。

---

### **Phase 8: 依賴關係視覺化與專案智能分析**

此階段的目標是實作複雜的任務依賴關係管理和智能專案分析功能。

**8.1: 任務依賴關係視覺化**

*   **任務**: 實作全局任務依賴關係的視覺化和管理。
*   **前端**:
    1.  建立 `src/app/dependencies/page.tsx` 路由。
    2.  實作依賴關係圖：
        *   使用 D3.js 或類似圖形庫繪製關係圖
        *   節點代表任務，邊代表依賴關係
        *   支援縮放、平移、節點拖拽
        *   不同的節點樣式表示任務狀態和優先級
    3.  實作關鍵路徑分析：
        *   高亮顯示關鍵路徑
        *   計算專案最短完成時間
        *   識別瓶頸任務
    4.  提供依賴關係編輯功能：
        *   拖拽連接任務建立依賴
        *   右鍵選單管理依賴關係
        *   依賴衝突檢測和警告
*   **後端**:
    1.  建立 `GET /api/dependencies` API，提供依賴關係數據。
    2.  實作關鍵路徑算法 (Critical Path Method)。
    3.  建立依賴關係 CRUD API。

**8.2: 智能專案分析**

*   **任務**: 實作基於 AI 的專案分析和建議功能。
*   **前端**:
    1.  建立智能分析面板：
        *   專案風險評估
        *   任務完成時間預測
        *   資源分配建議
        *   瓶頸識別和解決方案
    2.  實作互動式分析報告。
*   **後端**:
    1.  實作分析算法：
        *   蒙地卡羅模擬預測專案完成時間
        *   資源利用率分析
        *   風險評估模型
    2.  建立機器學習模型訓練基礎設施。

**8.3: 自動化工作流程**

*   **任務**: 實作基於規則的自動化工作流程。
*   **前端**:
    1.  建立工作流程設計器：
        *   拖拽式流程建立介面
        *   條件和動作的可視化配置
        *   工作流程測試和預覽
*   **後端**:
    1.  實作工作流程引擎。
    2.  建立規則評估和執行系統。

---

### **Phase 9: Plugin 機制與第三方整合**

此階段的目標是建立完整的擴展性架構，支援第三方整合和自定義功能。

**9.1: Plugin 核心架構**

*   **任務**: 建立 Plugin 系統的核心架構。
*   **前端**:
    1.  建立 Plugin 載入器：
        *   動態載入 Plugin 模組
        *   Plugin 生命週期管理
        *   Plugin 間通訊機制
    2.  實作 Plugin API：
        *   UI 組件註冊 API
        *   事件訂閱和發布 API
        *   資料存取 API
    3.  建立 Plugin 管理介面：
        *   Plugin 安裝和卸載
        *   Plugin 配置管理
        *   Plugin 商店（未來擴充）
*   **後端**:
    1.  建立 Plugin 註冊和管理 API。
    2.  實作 Plugin 安全沙箱機制。
    3.  建立 Plugin 資料隔離系統。

**9.2: 第三方服務整合**

*   **任務**: 實作常用第三方服務的整合。
*   **前端**:
    1.  Slack 整合：
        *   任務通知發送到 Slack 頻道
        *   Slack 指令操作任務
    2.  GitHub 整合：
        *   同步 GitHub Issues 和 Pull Requests
        *   代碼提交關聯任務
    3.  Google Workspace 整合：
        *   Google Drive 檔案關聯
        *   Google Meet 會議排程
*   **後端**:
    1.  實作 OAuth 2.0 整合流程。
    2.  建立第三方服務 API 包裝器。
    3.  實作資料同步機制。

**9.3: API 開放平台**

*   **任務**: 建立完整的 API 開放平台。
*   **前端**:
    1.  建立 API 文件網站。
    2.  實作 API Key 管理介面。
*   **後端**:
    1.  實作 REST API 和 GraphQL API。
    2.  建立 API 認證和限流機制。
    3.  實作 Webhook 系統。

---

### **Phase 10: 企業級功能與效能優化**

此階段的目標是將 ScheduleR 提升為企業級的專案管理解決方案。

**10.1: 企業級安全與權限管理**

*   **任務**: 實作企業級的安全和權限控制。
*   **前端**:
    1.  建立角色權限管理介面：
        *   角色定義和權限分配
        *   用戶角色管理
        *   權限矩陣視圖
    2.  實作多租戶支援：
        *   組織隔離
        *   資源配額管理
*   **後端**:
    1.  實作 RBAC (Role-Based Access Control) 系統。
    2.  建立資料加密和備份機制。
    3.  實作審計日誌系統。

**10.2: 效能優化與擴展性**

*   **任務**: 優化系統效能，支援大規模使用。
*   **前端**:
    1.  實作虛擬滾動和懶加載。
    2.  優化 Bundle 大小和載入速度。
    3.  實作離線支援和 PWA 功能。
*   **後端**:
    1.  實作資料庫查詢優化。
    2.  建立 Redis 快取系統。
    3.  實作負載平衡和水平擴展。

**10.3: 移動端支援**

*   **任務**: 開發移動端應用程式。
*   **前端**:
    1.  使用 React Native 開發 iOS 和 Android 應用。
    2.  實作離線同步功能。
    3.  優化移動端 UX。
*   **後端**:
    1.  優化 API 以適應移動端需求。
    2.  實作推送通知系統。

**10.4: 商業智能與報告系統**

*   **任務**: 建立完整的商業智能和報告系統。
*   **前端**:
    1.  實作自定義報告建立器。
    2.  建立數據視覺化儀表板。
    3.  實作報告排程和自動發送。
*   **後端**:
    1.  建立 OLAP 資料倉儲。
    2.  實作複雜的數據分析查詢。
    3.  建立報告生成和分發系統。

---

## 📊 **開發狀態總覽**

### ✅ **已完成功能**
- Phase 4: Google OAuth 認證系統
- Phase 4: User Profile 管理和團隊功能
- Phase 5: Command Palette (全鍵盤操作支援)
- Phase 5: Assignees 功能 (任務指派)
- 基礎 Kanban 看板
- 資料庫模型和 API 架構

### 🚧 **進行中項目**
- Phase 1: New Task Modal 優化
- Phase 1: Calendar Google 風格重構
- Phase 6: Workspace 模組實作

### 📋 **待開發項目 (按優先級)**
1. **高優先級**: Calendar 優化、Workspace 模組、New Task Modal
2. **中優先級**: 泳道圖、Dashboard Widget 系統、依賴關係視覺化
3. **低優先級**: Plugin 機制、第三方整合、企業級功能

### 🎯 **預計開發時程**
- **Phase 6**: 4-6 週 (核心模組完善)
- **Phase 7**: 3-4 週 (Dashboard 系統)
- **Phase 8**: 4-5 週 (依賴關係視覺化)
- **Phase 9**: 6-8 週 (Plugin 機制)
- **Phase 10**: 8-10 週 (企業級功能)
