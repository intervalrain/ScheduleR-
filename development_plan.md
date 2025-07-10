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

**5.4: Assignees 功能**

*   **任務**: 實作任務指派給使用者的功能。
*   **前端**:
    1.  在任務編輯表單中，新增指派給使用者的欄位（例如，下拉選單）。
*   **後端**:
    1.  更新 `Task` 模型，新增 `assigneeId` 欄位，並與 `User` 模型建立關聯。
    2.  修改 `POST /api/tasks` 和 `PUT /api/tasks/{id}` API，以支援任務指派。
