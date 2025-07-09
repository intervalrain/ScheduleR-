# ScheduleR 前端開發任務

## 專案設定 (Phase 0)

1.  **初始化專案**: 使用 Vite + React + TypeScript 建立專案。
2.  **安裝相依套件**:
    *   `tailwindcss`: 設定並整合 TailwindCSS。
    *   `shadcn/ui`: 初始化 `shadcn/ui` 元件庫。
    *   `react-router-dom`: 設定前端路由。
3.  **建立基礎 Layout**:
    *   設計包含 Header, Sidebar, 與主要內容區的應用程式外殼 (App Shell)。
    *   Header 需包含 Sprint 管理器、新增任務按鈕的預留位置。
    *   Sidebar 需有顯示任務清單的預留位置。

## 開發階段 (Phase 1-5)

### Phase 1: Sprint 與任務 CRUD
*   **路由**: 實作 `/sprint/:id/calendar` 與 `/sprint/:id/kanban`。
*   **狀態管理**: 使用 React Context API 管理當前的 Sprint 與使用者狀態。
*   **元件**:
    *   **Sprint 管理器**: 實作 Sprint 下拉選單、切換、新增功能。
    *   **新增任務表單**: 建立快捷新增任務的表單元件。
    *   **Calendar**: 建立一個基本的日曆視圖，能夠顯示事件 block。
    *   **Kanban**: 建立 Pending, Queueing/Ongoing, Done 三個欄位，並實作任務卡的拖拉功能。
*   **API 串接**: 串接 `GET /sprints`, `POST /sprints`, `GET /tasks`, `POST /tasks`, `PUT /tasks/{id}`。

### Phase 2: Workspace 功能 + Sidebar
*   **路由**: 實作 `/sprint/:id/workspace/:taskId`。
*   **元件**:
    *   **Workspace**: 顯示任務詳細資訊、可新增 Sub-task/check item、支援 Markdown 筆記。
    *   **Sidebar**: 顯示 Ongoing 任務清單，點擊後能跳轉至對應的 Workspace 頁面，並支援拖曳排序。
*   **API 串接**: 串接 `GET /workspace/task/{id}`。

### Phase 3: Gantt 與 Dashboard
*   **路由**: 實作 `/sprint/:id/gantt` 與 `/sprint/:id/dashboard`。
*   **元件**:
    *   **Gantt**: 根據任務資料視覺化時間軸、依賴關係。
    *   **Dashboard**: 建立可拖拉的 Widget 系統，並實作預設的 Burn Down Chart 等元件。資料儲存於 LocalStorage。
*   **API 串接**: 串接 `GET /dashboard/summary`。

### Phase 4: OAuth 登入
*   **路由**: 實作 `/login` 頁面。
*   **功能**: 整合 Google OAuth，處理登入流程與回調，並儲存使用者資訊。
*   **API 串接**: 串接 `POST /auth/google`。

### Phase 5: 優化與擴充
*   開始規劃全鍵盤操作的基礎架構。
*   確保所有模組皆符合響應式設計 (RWD)。
