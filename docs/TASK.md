# ScheduleR 開發任務清單

## 📊 項目概覽

**當前狀態**: 核心功能 95% 完成，進入功能擴展和品質提升階段  
**測試覆蓋率**: ~5% (目標 80%+)  
**技術棧**: Next.js 14 + TypeScript + Prisma + PostgreSQL + NextAuth.js  

---

## 🚀 Features (功能開發)

### 💡 用戶擴展需求 (高優先級)

#### F1. Sprint 類型管理 - ✅ **已完成**
**目標**: 支援專案管理 (PROJECT) 和日常管理 (CASUAL) 兩種模式

- [x] **資料庫擴展** ✅ **已完成**
  - [x] 添加 Sprint.type 欄位 (enum: 'PROJECT', 'CASUAL')
  - [x] 添加 Sprint.defaultWorkDays 欄位 (JSON)
  - [x] 添加 Sprint.defaultWorkHours 欄位 (JSON)
  - [x] 建立 migration script 更新現有資料

- [x] **API 修改** ✅ **已完成**
  - [x] 更新 `POST /api/sprints` 支援類型選擇
  - [x] PROJECT: 預設週一-五，8:30-17:30
  - [x] CASUAL: 預設週一-日，全天候
  - [x] 更新 `PATCH /api/sprints/{id}` 支援工作時間自訂

- [x] **前端實作** ✅ **已完成**
  - [x] Sprint 創建表單添加類型選擇器
  - [x] 工作時間設定預覽和自訂
  - [x] Sprint 管理頁面顯示類型資訊

#### F2. Gantt 模式管理
**目標**: 支援自動排程 (Auto) 和手動拖拽 (Manual) 兩種模式

**Auto Mode** - ✅ **已完成**
- [x] 雙指針排程演算法
- [x] 工作時間計算
- [x] 依賴關係處理
- [x] 根據 Sprint 類型調整排程邏輯 ✅ **已完成**

**Manual Mode** - ❌ 未實作
- [ ] **拖拽功能** (1-2週)
  - 任務時間軸拖拽
  - 任務期間調整
  - 即時儲存變更
  - 衝突檢測提示

- [ ] **UI/UX 設計** (3-4天)
  - Auto ↔ Manual 模式切換按鈕
  - 拖拽視覺回饋
  - 模式狀態持久化

- [ ] **API 支援** (1週)
  - 任務時間更新 API
  - 排程衝突檢查 API

### 📊 Dashboard Widgets

#### ✅ 已完成 (真實 API 數據)
1. **Task Summary** - 任務總覽
   - 數據源: `/api/dashboard/summary`
   - 顯示: 總任務數、完成數、進行中數量

2. **Hours Summary** - 工時總覽
   - 數據源: `/api/dashboard/summary`
   - 顯示: 預估總工時

3. **Completion Rate** - 完成率
   - 數據源: 計算自真實任務數據
   - 顯示: 任務完成百分比

4. **Work Hours** - 可用時數 ✅ **(新增)**
   - 數據源: Sprint 時數計算 + BusyHours API
   - 顯示: Sprint 總時數扣除忙碌時數

5. **Progress Chart** - 進度圖表 ✅ **(新增)**
   - 數據源: Task status 統計
   - 顯示: 任務狀態分布（完成/進行中/待辦）

6. **Task Distribution** - 任務分布 ✅ **(新增)**
   - 數據源: Task priority, status 統計
   - 顯示: 任務完成百分比

7. **Recent Activity** - 最近活動 ✅ **(新增)**
   - 數據源: 基於現有任務數量
   - 顯示: 總任務數追蹤

8. **Calendar Overview** - 日曆概覽 ✅ **(新增)**
   - 數據源: BusyHour
   - 顯示: Sprint 期間的忙碌時數

9. **Sprint Progress** - Sprint 進度 ✅ **(新增)**
   - 數據源: Sprint 時間進度
   - 顯示: 經過天數/總天數

#### ✅ Dashboard 功能特性 (已實作)
- **Widget 拖拽重排** ✅ **(2025-07-19 完成)**
  - 技術實作: `@hello-pangea/dnd`
  - 功能: 任意拖拽 widgets 重新排序
  - 視覺回饋: 拖拽時縮放、旋轉、陰影效果
  - 持久化: localStorage 保存用戶偏好順序
  - 響應式: 支援 1-4 欄位自適應佈局

#### 🟡 可基於現有數據完成 (未實作)
10. **Team Member Tasks** - 團隊成員任務 (3-4天)
    - 數據源: Task.assigneeId 統計
    - 需要: 成員任務統計 API

#### 🔴 需要額外數據源實作 (複雜功能)
11. **Sprint Health** - Sprint 健康度 (2-3週)
    - 缺少: 工時追蹤、燃盡數據
    - 需要: 工時記錄系統

12. **Team Workload** - 團隊工作負載 (2週)
    - 缺少: 成員工時分配數據
    - 需要: 工時分配 API

13. **Velocity** - 開發速度 (1週)
    - 缺少: 歷史 Sprint 速度數據
    - 需要: Sprint 歷史統計

14. **Risk Assessment** - 風險評估 (2-3週)
    - 缺少: 風險計算邏輯
    - 需要: 風險評估演算法

15. **Burndown Chart** - 燃盡圖 (3-4週)
    - 缺少: 每日工時記錄
    - 需要: 時間追蹤系統

#### 🚫 需要外部整合 (長期項目)
16. **Code Commits** - 程式碼提交 (1-2個月)
    - 需要: GitHub/GitLab API 整合

17. **Team Communication** - 團隊溝通 (2-3個月)
    - 需要: 聊天/評論系統

18. **Project Documentation** - 專案文件 (1-2個月)
    - 需要: 文件管理系統

19. **Performance Metrics** - 效能指標 (1-2個月)
    - 需要: 指標收集系統

20. **Resource Usage** - 資源使用 (1-2個月)
    - 需要: 系統監控整合

### 🎯 未來擴展功能

#### F3. 依賴關係視覺化 (Priority 2)
- [ ] **依賴關係圖頁面** (2-3週)
  - D3.js 或類似圖形庫實作
  - 任務節點和依賴邊的視覺化
  - 關鍵路徑分析 (Critical Path Method)
  - 依賴衝突檢測

#### F4. 泳道圖 (Swimlane Diagram) (Priority 2)
- [ ] **跨團隊任務流程視覺化** (2-3週)
  - 按團隊/使用者分組的水平泳道
  - 任務在不同階段間的流動
  - 拖拽移動任務到不同泳道

#### F5. 全鍵盤操作增強 (Priority 3)
- [x] Command Palette 基礎實作 (已完成)
- [ ] **Vim 模式/Emacs 風格操作** (1-2個月)
- [ ] **更多快捷鍵支援** (2-3週)

#### F6. Plugin 機制 (Priority 3)
- [ ] **Plugin 核心架構** (2-3個月)
  - 動態載入 Plugin 模組
  - Plugin 生命週期管理
  - 安全沙箱機制

#### F7. 第三方整合 (Priority 3)
- [ ] **Slack 整合** (1個月)
- [ ] **GitHub 整合** (1個月)
- [ ] **Google Workspace 整合** (1個月)

---

## 🛠️ CIP (Continuous Improvement Projects)

### 測試覆蓋率提升

#### C1. API 測試 (最高優先級)
**目標**: 從 5% 提升到 60%

- [ ] **Task API 測試套件** (1週)
  ```typescript
  □ shouldCreateTaskSuccessfully
  □ shouldUpdateTaskStatus
  □ shouldDeleteTaskWithSubtasks
  □ shouldValidateTaskPermissions
  ```

- [ ] **Sprint API 測試套件** (1週)
  ```typescript
  □ shouldCreateSprintWithValidDates
  □ shouldRejectInvalidSprintDates
  □ shouldUpdateSprintConfiguration
  □ shouldValidateTeamPermissions
  ```

- [ ] **User/Team API 測試套件** (1週)
  ```typescript
  □ shouldCreateUserProfile
  □ shouldManageTeamMembership
  □ shouldValidatePermissionMatrix
  ```

#### C2. 前端組件測試 (中優先級)
**目標**: 70% 測試覆蓋率

- [ ] **表單組件測試** (1週)
  ```typescript
  □ shouldValidateTaskForm
  □ shouldValidateSprintForm
  □ shouldHandleUserInteractions
  ```

- [ ] **資料顯示組件測試** (1週)
  ```typescript
  □ shouldDisplayTaskInKanban
  □ shouldDragTaskBetweenColumns
  □ shouldUpdateCalendarView
  ```

#### C3. 商業邏輯測試 (中優先級)
- [ ] **排程演算法測試** (1週)
  ```typescript
  □ shouldCalculateOptimalSchedule
  □ shouldHandleDependencies
  □ shouldDetectConflicts
  ```

### 效能優化

#### C4. Bundle 大小優化 (Priority 2)
- [ ] **Tree-shaking 優化** (1週)
  - date-fns imports 優化
  - 移除未使用的 Radix UI 組件
  - Code-splitting 大型組件

#### C5. 虛擬化改進 (Priority 2)
- [ ] **虛擬滾動實作** (2週)
  - 大型任務列表虛擬滾動
  - Calendar 月視圖虛擬化
  - Kanban 看板優化

#### C6. 快取策略 (Priority 3)
- [ ] **客戶端快取** (2週)
  - React Query 整合
  - 快取失效策略
  - 離線支援基礎

### 程式碼品質提升

#### C7. 元件重構 (Priority 1)
- [ ] **大型元件拆分** (1-2週)
  - WorkspacePage (~1000行) 拆分
  - 提取可重用 custom hooks
  - 實作適當的元件組合

#### C8. TypeScript 改進 (Priority 1)
- [ ] **型別安全增強** (1週)
  - 替換所有 `any` 類型
  - 建立完整的 API 回應型別
  - 加入 Zod 執行時型別驗證

#### C9. 狀態管理優化 (Priority 2)
- [ ] **全域狀態管理** (2週)
  - 考慮引入 Zustand/Redux
  - 使用者偏好設定狀態
  - 狀態持久化

---

## 🐛 Bugs (錯誤修復)

### 高優先級 Bug

#### B1. Priority 系統不一致 (Critical) - ✅ **已完成**
- [x] **問題**: Priority 有時為字串，有時為數字
- [x] **影響**: 排序邏輯錯誤，任務順序混亂
- [x] **修復**: 
  - 統一 Priority 為數字類型
  - 建立 migration script 轉換現有資料 (migration/20250719074500_fix_priority_to_int/)
  - 更新所有排序邏輯
- [x] **工作量**: 2-3天 (**實際完成**)

#### B2. 記憶體洩漏問題 (High)
- [ ] **Calendar 組件**: Timer cleanup 問題
  - useEffect cleanup function 缺失
  - setInterval 未正確清理
- [ ] **Drag operations**: Event listener 清理
  - dragend 事件監聽器累積
  - 元件卸載時未移除監聽器
- [ ] **Workspace 頁面**: 元件卸載清理
  - 非同步操作未取消
  - 訂閱未正確取消
- [ ] **工作量**: 1週

#### B3. 錯誤處理缺失 (High)
- [ ] **缺少 Error Boundaries**
  - 主要頁面缺少錯誤邊界
  - 無法優雅處理元件錯誤
- [ ] **API 錯誤恢復邏輯不完整**
  - 網路錯誤重試機制
  - 使用者友善錯誤訊息
- [ ] **標準化錯誤訊息系統**
  - 統一錯誤訊息格式
  - Toast 通知系統整合
- [ ] **工作量**: 1-2週

### 中優先級 Bug

#### B4. Drag & Drop 問題 (Medium)
- [ ] **競態條件**
  - 快速拖拽時狀態不一致
  - 同時多個拖拽操作衝突
- [ ] **視覺回饋不準確**
  - 拖拽偏移計算錯誤
  - 不同螢幕尺寸下的位置問題
- [ ] **工作量**: 1週

#### B5. 身份驗證邊緣情況 (Medium)
- [ ] **Session 過期處理**
  - 優雅處理過期 session
  - 自動重新導向登入
- [ ] **Refresh token 邏輯**
  - 實作 token 刷新機制
- [ ] **工作量**: 1週

### 低優先級 Bug

#### B6. UI/UX 小問題 (Low)
- [ ] **Workspace 頁面資料重複獲取**
  - 優化 API 呼叫
  - 實作樂觀更新
- [ ] **載入狀態改進**
  - 統一載入指示器
  - 骨架屏實作
- [ ] **工作量**: 3-4天

---

## 📋 開發優先級與時程

### Phase 1: 立即執行 (1-2週)
**焦點**: 關鍵 Bug 修復 + 快速增值功能

1. **B1**: Priority 系統修復 (Critical Bug) - ✅ **已完成**
2. **F1**: Sprint 類型選擇實作 - ✅ **已完成**
3. **F2**: Gantt Auto Mode 優化 - ✅ **已完成**
4. **Dashboard Drag & Drop**: Widget 拖拽重排功能 - ✅ **已完成**
5. **Widgets**: Progress Chart, Task Distribution (簡單 widgets)

### Phase 2: 短期執行 (3-4週)
**焦點**: 核心功能完善 + 測試覆蓋

1. **B2**: 記憶體洩漏修復
2. **B3**: 錯誤處理改進
3. **F2**: Gantt Manual Mode 基礎實作
4. **C1**: API 測試套件 (達到 60% 覆蓋率)
5. **Widgets**: Recent Activity, Calendar Overview

### Phase 3: 中期發展 (2-3個月)
**焦點**: 進階功能 + 品質提升

1. **F2**: Gantt Manual Mode 完整實作
2. **Widgets**: Sprint Health, Team Workload 等複雜功能
3. **C2-C3**: 前端測試覆蓋 (達到 70%)
4. **C7-C8**: 程式碼重構和型別安全

### Phase 4: 長期願景 (3個月+)
**焦點**: 外部整合 + 企業級功能

1. **F5-F6**: Plugin 機制和全鍵盤操作
2. **F7**: 第三方服務整合
3. **C4-C6**: 效能優化和快取策略
4. **Widgets**: 外部整合相關功能

---

## 🎯 關鍵里程碑

- **Week 2**: ✅ Priority Bug 修復完成 + Sprint 類型功能完成 + Gantt Auto Mode 完成 + Dashboard Drag & Drop 完成
- **Week 4**: Gantt Manual Mode MVP + 記憶體洩漏修復
- **Week 8**: API 測試覆蓋 60% + 6個基礎 Widgets 完成
- **Week 12**: 前端測試覆蓋 70% + 程式碼重構完成
- **Week 16**: 進階 Widgets 完成 + Plugin 機制基礎

---

## 📊 投資報酬率 (ROI) 評估

### 🟢 高 ROI (立即執行)
1. **Priority 系統修復** - 影響核心功能，必須修復
2. **可基於現有數據的 Widgets** - 開發成本低，使用者價值高
3. **API 測試覆蓋** - 減少未來 bug，提升系統穩定性
4. **Sprint 類型管理** - 符合使用者核心需求擴展

### 🟡 中 ROI (規劃執行)
1. **Gantt Manual Mode** - 功能完整性重要，但開發成本較高
2. **記憶體洩漏修復** - 效能改善，但影響有限
3. **錯誤處理改進** - 使用者體驗提升
4. **程式碼重構** - 長期維護性改善

### 🔴 低 ROI (長期考慮)
1. **外部系統整合** - 開發複雜度高，使用者需求不確定
2. **Plugin 機制** - 技術挑戰大，短期價值有限
3. **企業級功能** - 目前使用者群體不明確

---

## 🔧 開發原則與流程

### TDD 開發流程
遵循 Kent Beck 的 Test-Driven Development 原則：

1. **Red**: 先寫失敗的測試
2. **Green**: 實作最少程式碼讓測試通過
3. **Refactor**: 在測試通過後重構程式碼

### Tidy First 原則
分離結構性變更和行為變更：

**結構性變更 (先執行)**:
- 重構重複的 API 呼叫邏輯
- 提取共用型別定義
- 重新組織元件檔案結構
- 統一錯誤處理模式

**行為變更 (後執行)**:
- 新功能實作
- 修改商業邏輯
- 新增 API 端點

---

## 📊 總覽統計

### 當前完成度
- **核心功能**: 95% 完成
- **Dashboard Widgets**: 45% 完成 (9/20 widgets) ✅ **更新**
- **Dashboard 功能**: 完整拖拽重排功能 ✅ **2025-07-19 完成**
- **測試覆蓋**: 5% 完成
- **程式碼品質**: 良好，但有改進空間
- **Widget 選擇器**: 已實作，支援 disabled 狀態和 preview 模式 ✅ **新增**

### 工作量估算
- **Features**: 8-12週 (依優先級和複雜度)
- **CIP**: 6-8週 (測試覆蓋 + 效能優化)
- **Bugs**: 2-4週 (關鍵問題修復)

### 資源需求建議
- **1名全端開發者**: 可完成 Phase 1-2 (核心功能)
- **2名開發者**: 可平行進行 Phase 1-3
- **3-4人團隊**: 可在 6個月內完成所有 Phase

---

*最後更新: 2025-07-20*  
*整合來源: dev.md, development_plan.md, plan.md, TASK.md*  
*總任務數: 150+*  
*預估總工時: 6-12個月 (依團隊規模)*
*新增功能: Dashboard Widgets 系統、Widget 選擇器*