# 專案開發規劃書：單頁應用任務管理系統（ScheduleR）

## 一、專案簡介

ScheduleR 是一套現代化的專案任務管理單頁應用（SPA），使用者可透過視覺化方式進行專案規劃、任務分派、進度追蹤與效能分析。其核心價值在於：高可用性、可視化與全鍵盤控制的效率操作體驗。

---

## 二、技術棧規劃

* **前端框架**：React
* **語言**：TypeScript
* **UI 元件庫**：shadcn/ui
* **樣式系統**：TailwindCSS
* **狀態管理**：React Context API
* **其他**：支援 Google OAuth 登入

---

## 三、功能模組說明

### 1. 初始畫面

* **無 Sprint 時自動導引**：當無任一 Sprint 存在時，首頁提示使用者新增 Sprint。

### 2. Header 功能區

* **Sprint 管理器**

  * 左上角 Sprint 選單，可切換當前 Sprint
  * 「新增 Sprint」功能，並設定起訖日期（duration）
  * Sprint 可設定 iteration 模板（如每週迭代一次，為期 8 週）
* **新增任務快捷鍵（右上角）**

  * 任務預設隸屬當前 Sprint
  * 輸入欄位：name、description、estimate hours、dependencies、categories、label、tag（priority 為非必填，assignee 暫不支援）
* **Tab 導覽區**：切換各功能模組（Calendar、Kanban、Workspace、Gantt、Dashboard）

---

## 四、各模組功能詳述

### 📅 Calendar 模組

* 類似 Google Calendar
* 可建立「會議」、「請假」、「公差」、「例會」等 block 時段
* 自動計算非排程時段為可用工時 (work hours)
* 可切換天/週視圖
* 會議可支援 recurring 模式（如每日例會）

### 📌 Kanban 模組

* 欄位：Pending、Queueing/Ongoing、Done
* 任務流轉邏輯：

  * 任務預設進入 Pending，並置於最下方（若無 priority）
  * 可拖拉至其他欄位（即時儲存）
  * 有 dependencies 的任務自動進入 Queueing，使用 Topological Sort 安排順序
  * Done 表示完成，可手動拖拉進入

### 🧠 Workspace 模組（核心模組）

* 顯示詳細任務內容與操作
* 可新增：

  * Sub-task / check item（並據此計算完成度）
  * Markdown 筆記（僅單人可編輯）
* 連動 Sidebar 點選項目可跳轉此處
* 支援全螢幕檢視模式

### 📊 Gantt 模組

* 根據 Calendar + Estimate Hours 自動估算時間軸
* 使用者可拖動任務條調整 estimate 時間
* 顯示 dependencies 線
* 支援「里程碑」與「關鍵路徑」視覺化

### 📈 Dashboard 模組

* 拖拉式 Widget 系統，可自訂檢視項
* 預設 Widget：Burn Down Chart、Sprint 完成率、總可用工時、已耗工時、進度條
* 每位使用者的 Dashboard 儲存於 LocalStorage，可自由調整顯示內容與排列

### 📌 Sidebar 模組

* 顯示當前 Sprint 中的 Ongoing 任務清單
* 項目支援上下拖曳排序（同步 Kanban 順序）
* 每項顯示 task name、簡述與完成度 bar
* 點選項目跳轉對應 Workspace

---

## 五、使用者與團隊管理

* **登入方式**：Google OAuth
* **個人資料設定**：

  * 建立與加入 Team
  * 指派任務給 Team 成員（未來擴充）
* **跨 Team 任務依賴**：

  * 外部依賴設定（如 Team B）
  * 全局視覺化依賴圖（如泳道圖）

---

## 六、API 與資料結構設計（初版）

### 🗃 簡易 ERD（Entity Relationship Diagram）

* **User** (id, name, email, avatar)
* **Team** (id, name)
* **Sprint** (id, name, startDate, endDate, iterations, teamId)
* **Task** (id, sprintId, name, description, estimateHours, priority, tags, labels, status)
* **Dependency** (taskId, dependsOnTaskId)
* **SubTask** (id, taskId, title, isCompleted)
* **Note** (id, taskId, content)
* **CalendarEvent** (id, userId, type, title, start, end, isRecurring)

### 🔌 API Spec（RESTful 命名）

* `POST /auth/google` - Google OAuth 登入
* `GET /sprints` - 取得所有 Sprint
* `POST /sprints` - 新增 Sprint
* `GET /tasks?sprintId=` - 查詢任務
* `POST /tasks` - 建立任務
* `PUT /tasks/{id}` - 更新任務內容/狀態
* `POST /tasks/{id}/dependencies` - 新增依賴
* `GET /calendar` - 查詢行事曆 block
* `POST /calendar` - 建立行事曆 block
* `GET /dashboard/summary` - 總覽資料
* `GET /workspace/task/{id}` - 查看任務詳情

---

## 七、前端路由建議

* `/login` - 登入畫面（OAuth）
* `/sprint/:id` - Sprint 模組頁（預設進入 Calendar）

  * `/calendar`
  * `/kanban`
  * `/workspace/:taskId`
  * `/gantt`
  * `/dashboard`

---

## 八、未來擴充目標（Future Work）

* **全鍵盤操作支援**：

  * 每一操作皆對應熱鍵（hotkey）
  * 支援命令式操作面板（Command Palette）
  * 未來支援 Vim 模式/Emacs 風格操作
* **Plugin 機制與 API 擴充**：

  * 供第三方或企業內部開發擴充元件
* **Assignees 功能**
* **Task 自訂欄位（如 QA 狀態、測試連結等）**

---

## 九、開發與進度建議

### 建議開發階段：

1. **Sprint 與任務 CRUD**（含 Calendar & Kanban）
2. **Workspace 功能 + Sidebar 串接**
3. **Gantt 與 Dashboard 初版**
4. **OAuth 登入與 User Profile 模組**
5. **全鍵盤控制與外部依賴視覺化支援**

---

## 十、備註

* 所有模組皆需支援響應式設計與無障礙操作
* 優先優化核心模組（Workspace、Kanban、Calendar）體驗與效能
