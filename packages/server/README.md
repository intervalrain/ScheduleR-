# ScheduleR 後端開發任務

## 專案設定 (Phase 0)

1.  **初始化專案**: 使用 Node.js + Express + TypeScript 建立專案。
2.  **設定 ORM**:
    *   安裝與設定 Prisma。
    *   根據 `README.md` 的 ERD，撰寫 `schema.prisma` 檔案，定義 User, Team, Sprint, Task 等模型。
3.  **資料庫**:
    *   使用 Docker 建立一個 PostgreSQL 資料庫實例。
    *   執行 `prisma migrate dev` 初始化資料庫 schema。

## 開發階段 (Phase 1-5)

### Phase 1: 核心 API - Sprint 與任務
*   **Sprint API**:
    *   `GET /sprints`: 取得所有 Sprint。
    *   `POST /sprints`: 新增 Sprint (包含 `iterations` 邏輯)。
*   **Task API**:
    *   `GET /tasks?sprintId=`: 根據 Sprint ID 查詢任務。
    *   `POST /tasks`: 建立任務。
    *   `PUT /tasks/{id}`: 更新任務內容/狀態。
    *   `POST /tasks/{id}/dependencies`: 新增任務依賴。

### Phase 2: Calendar 與 Workspace API
*   **Calendar API**:
    *   `GET /calendar`: 查詢行事曆事件。
    *   `POST /calendar`: 建立行事曆事件 (會議、請假等)。
*   **Workspace API**:
    *   `GET /workspace/task/{id}`: 取得單一任務的詳細資料 (包含 sub-tasks, notes)。
    *   實作 Sub-task 與 Note 的 CRUD endpoints。

### Phase 3: Dashboard API
*   **Dashboard API**:
    *   `GET /dashboard/summary`: 提供儀表板所需的摘要資料，例如 Sprint 完成率、工時統計等。

### Phase 4: 認證與授權
*   **Auth API**:
    *   `POST /auth/google`: 實作 Google OAuth 登入流程，驗證 token、建立或查詢使用者資料，並回傳 JWT 或 session token。
*   **Middleware**: 建立保護路由的認證中介軟體。

### Phase 5: 團隊與未來功能
*   **資料模型**: 擴充 Prisma Schema 以支援 Team 與 User-Team 的關聯。
*   **API**: 規劃未來指派任務 (Assignees) 與團隊管理相關的 API。
