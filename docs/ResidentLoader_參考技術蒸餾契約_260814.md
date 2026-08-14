# Resident Loader 參考技術蒸餾契約

> 狀態：v0.1.0 已依契約實作並通過自動驗證
> 路由：hybrid
> 更新時間：26-08-14 19:08（Asia/Taipei）
> 目標：把景和 Resident 現有可驗證行為蒸餾成一個只安裝一次、可匯入多個資料包的 SillyTavern 共用 Loader。

本輪邊界：Loader v1 只處理資料型角色包、桌寵動畫、酒館生成與本機歷史；不接手角色卡的 MVU 狀態交易，也不修改或開關世界書。未來若加入 MVU／世界書能力，必須另立 adapter、交易與回滾契約，不能藉本次匯入格式偷偷取得權限。

## 1. 來源快照與權利邊界

| 來源 | 路徑／版本 | SHA-256／證據 | 可用範圍 | 禁止／需重作 |
|---|---|---|---|---|
| 景和 Resident 擴充入口 | `參考蒸餾_私用/景和酒館桌寵_JingheResident_260810/manifest.json`、`index.js`；`0.8.0-rc.1` | `0AF291410EDC1A455AE89778345D41BF1EBE3C385570149047A22A79F7B2E8A0`、`1ECC9821B92EA9D52965A20764047D619CEB2058D659EE3DF1B8EE0BDD512222` | lifecycle、切聊天重載與 destroy 行為可作 clean-room 參考 | 不把景和或固定檔案路徑硬編進共用版 |
| 固定角色選包設定 | `resident.config.json`、`src/entrypoints/select-pack.mjs` | `2CDB56C403FDD847BC302C812C23BFFEE41CD9F1EE01B858005C9A15319A94DD`、`5F45036B0730A67BBB71AFDDE5437180A38FA5147D161A46F4FB6C449A5CCBC7` | 角色擷取與精確匹配行為 | 共用版改為使用者明示綁定；不得依模糊名稱自猜 |
| 角色包舊 schema | `schema/character-pack.schema.json` | `2B23B8D2C1F47AE55437DF6051CCA890C11354ED20B54713AB6B51703DFA80B1` | 可參考資料／素材／Prompt 分層 | 公開 `.jrpack` 採較小的 data-only v1 契約，不接受任意 action/code |
| runtime 核心 | `src/entrypoints/bootstrap.mjs`、`src/core/manifest.mjs`、`storage.mjs`、`asset-registry.mjs` | `0DDE59FD…`、`2CAB436C…`、`D31BA387…`、`AEE096CD…` | 啟動、驗證、namespaced state、Blob URL 回收模式 | 大型 PNG 改用 IndexedDB；匯入器另作安全驗證 |
| 酒館 adapter／生成路由 | `src/adapters/sillytavern.mjs`、`src/core/generation-router.mjs` | `BFBC584F…`、`3670CF24…` | ST context、安靜生成、能力降級 | 不保存 API URL、Token 或 Key |
| 已驗證 API Profile 實例 | `scripts/embedded/jiangnan-pet-v2.js` | `E4FFCE2D37845CDFD7D823026947C062F88630EB9DFC88F291920B59B289AB61`；`getConnectionProfiles()` 280–293、`/profile-genstream` 370/581、current API 376/586、settings 1146–1193 | 沿用當前 API 或從酒館既有 Connection Profiles 選擇；僅記 profile id | 姜南文案與角色特例全部改成 pack/config；不得複製任何秘密 |
| 工坊輸出契約 | 本 repo `src/pack-builder.ts` | `jinghe-resident-pack` format v1；`manifest.json`＋`pack-meta.json`＋`assets/spritesheet.png` | Loader v1 的唯一公開匯入格式 | ZIP 中其他可執行檔、SVG、HTML、路徑穿越一律拒收 |

權利判斷：參考案是 Mini 與景和自有 clean-room 工作，可抽取可驗證行為；角色專屬文字、形象與設定仍歸各 pack，不變成 Loader 的通用預設。公開前另補 LICENSE，未補前不宣稱第三方可再散布程式碼。

## 2. 組件盤點

| 組件 | 現行位置 | 責任 | 新版落點 | confidence／證據 |
|---|---|---|---|---|
| Extension lifecycle | `manifest.json`、`index.js` | APP_READY／CHAT_CHANGED 啟動，disable 清理 | Loader entry＋ST adapter | EXTRACTED／原檔 |
| Character capture | `select-pack.mjs` | 取得目前角色候選名稱 | `getCharacterIdentity()` | EXTRACTED；stable key 需 ADAPTER |
| Pack import | 現行沒有 | 解 ZIP、白名單驗證、寫入 registry | `pack-importer.ts` | REIMPLEMENT |
| Pack registry | 現行固定 `resident.config.json` | pack 清單、資產、綁定 | IndexedDB repository | REIMPLEMENT |
| Pack manifest | 工坊 `pack-builder.ts` | 8×12 圖集、Prompt、identity | `pack-schema.ts` | EXTRACTED／本 repo 測試 |
| Connection Profiles | embedded 280–293 | 讀 ST 既有 Profile 的 id/name/api/model | `st-adapter.ts` | EXTRACTED；ST 版本差異需降級 |
| Generation | embedded 358–386、562–599 | current API 或 `/profile-genstream`，靜默回傳文字 | `generation-adapter.ts` | EXTRACTED／不得 SEND |
| Context capture | embedded 311、333、571 | 最近對話裁切後放入 Prompt | `context-builder.ts` | EXTRACTED；樓數改為自由設定 |
| Prompt settings | embedded settings＋工坊 manifest | pack 預設、USER 覆寫、重設 | per-character settings | ADAPTER／CONFIG |
| Sprite runtime | 工坊 8×12 atlas＋舊 shell | 顯示、動作、拖曳、尺寸、速度 | `sprite-resident.ts` | REIMPLEMENT |
| Settings panel | embedded 1146–1193 | profile、桌寵尺寸等 | Loader UI | REIMPLEMENT；手機優先 |

## 3. 入口、事件與完整流程

```text
安裝一次 Loader → ST 載入 manifest/index → APP_READY
  → 打開 IndexedDB registry → 取得目前角色 stable key
  → 查 binding → 有綁定：讀 pack＋設定 → mount 桌寵
             └→ 未綁定：保持安靜，只在設定面板提示

匯入 .jrpack.zip → DOM_ONLY 選檔
  → ZIP 路徑／檔型／容量／JSON schema／PNG magic bytes 驗證
  → 全部通過才單次 STATE_WRITE → registry 更新 → 預覽
  → 按「綁定目前角色」→ 寫 binding → mount

點桌寵 → DOM_ONLY 開功能面板
  → USER 明示按「生成書信／番外」
  → 讀該角色 Prompt 覆寫＋最近 N 樓（0＝不帶）
  → 選 current API 或 profile id → GENERATE（不 SEND）
  → 將結果 STATE_WRITE 到本機歷史 → RENDER_ONLY 顯示在同一個 HTML 面板

CHAT_CHANGED → unmount 舊角色、撤銷 Blob URL／listeners
  → 重新查目前角色 binding → mount 新 pack；不得串角色狀態

onDisable → 移除 event listener、panel、pet、timer、Blob URL；不刪使用者 pack。
```

## 4. 狀態與資料所有權

| 資料 | canonical owner | 讀／寫者 | scope／namespace | 持久化／migration |
|---|---|---|---|---|
| 原始 `.jrpack` manifest 與 PNG bytes | Loader IndexedDB | importer／registry／sprite runtime | `resident-loader/v1/packs/{packId}` | immutable import revision；同 id 更新先保留上一版 |
| 目前角色綁定 | Loader IndexedDB | binding UI／lifecycle | `resident-loader/v1/bindings/{characterKey}` | key 優先 card/avatar id；名稱只作顯示與降級 |
| USER Prompt 覆寫 | ST `extension_settings`；無 API 才 namespaced localStorage | settings／context builder | characterKey＋feature | 空值代表沿用 pack default；一鍵重設 |
| API 模式／Profile | 同上 | settings／generation adapter | characterKey＋feature | 只存 `current` 或 profile id；絕不存 URL/Key/Token |
| 最近樓數 | 同上 | settings／context builder | characterKey＋feature | 整數 0–50；0 完全不讀 chat context |
| 尺寸、位置、透明度 | 同上 | settings／sprite | characterKey＋viewport class | desktop/mobile 分開；超界自動夾回視窗 |
| 動畫速度 | 同上 | settings／sprite scheduler | characterKey | frame interval 50–1000 ms |
| 移動速度 | 同上 | settings／walk scheduler | characterKey | px/s 10–500，與 frame interval 分離 |
| 生成紀錄 | Loader IndexedDB | generation feature／歷史分頁 | characterKey＋chatKey＋feature | 本機持久保存；重載不消失；不寫聊天樓層；只有 USER 明示才可刪除 |

## 5. DOM、SEND、GENERATE、STATE_WRITE 邊界

| 操作 | DOM_ONLY | SEND | GENERATE | STATE_WRITE | RENDER_ONLY | 失敗回復 |
|---|---:|---:|---:|---:|---:|---|
| 開／關桌寵與設定面板 | 是 | 否 | 否 | 否 | 是 | 不造新樓層、不呼叫模型 |
| 匯入 pack／抽換 PNG | 是 | 否 | 否 | 驗證全過才是 | 是 | 拒收整包，保留舊 revision |
| 綁定／切換／解除角色 | 是 | 否 | 否 | 是 | 是 | 綁定失敗不改現況 |
| 改 Prompt、尺寸、速度、樓數 | 是 | 否 | 否 | 是 | 是 | 驗證失敗保留舊值 |
| 自動待機氣泡／走動 | 是 | 否 | 否 | 否 | 是 | runtime 停止即可 |
| 明示生成書信／番外 | 是 | 否 | 是 | 成功後保存歷史 | 是 | 生成失敗不寫入空紀錄，顯示能力錯誤 |
| 開啟／切換生成歷史 | 是 | 否 | 否 | 否 | 是 | 空狀態不呼叫模型 |
| 一鍵複製圖片指令／歷史結果 | 是 | 否 | 否 | 否 | 是 | Clipboard 失敗改手動選取 |
| 刪除單筆／清空歷史 | 是 | 否 | 否 | USER 確認後才是 | 是 | 取消即 0 寫入；不影響 pack 與聊天樓層 |

鐵則：Loader v1 的 SEND 次數永遠為 0；只有 USER 明示的生成按鈕可令 GENERATE 從 0 變 1。預覽、匯入、切角色、開面板與自動桌寵行為皆不得消耗 API。

## 6. 搬運與重作分類

| 組件 | 分類 | 技術／權利理由 | 改動面 |
|---|---|---|---|
| lifecycle 與 cleanup 模式 | DIRECT | 自有 clean-room，邊界已有測試概念 | 改成 registry resolver |
| 角色與 Prompt 內容 | CONFIG | 屬於每個資料包 | 不存在 Loader 預設角色 |
| ST context／event／profile 探測 | ADAPTER | API 隨 ST 版本與 Helper 可用性變化 | 能力探測＋友善降級 |
| current API／profile generation | ADAPTER | 沿用酒館已設定連線，不另收秘密 | 統一 `generateText()` |
| ZIP importer／安全 schema | REIMPLEMENT | 現行 runtime 無瀏覽器匯入 | JSZip＋白名單＋限額 |
| IndexedDB pack registry | REIMPLEMENT | localStorage 不適合二進位素材 | transaction＋revision |
| binding registry | REIMPLEMENT | 固定 name mapping 不足以供一般 USER 使用 | stable key＋明示綁定 |
| Prompt resolver／recent floors | REIMPLEMENT | 舊程式樓數固定且 Prompt 閉包化 | 每次生成讀即時設定 |
| 8×12 sprite renderer | REIMPLEMENT | 工坊 v1 atlas 與舊角色包資產契約不同 | CSS background-position／timer |
| Loader settings UI | REIMPLEMENT | 公開產品須簡化且行動版可用 | accessible panel＋mobile layout |

## 7. 移植映射表

| 原欄位／事件／資產 | Loader 設定鍵／adapter path | 預設 | 驗證方式 |
|---|---|---|---|
| `manifest.identity.*` | `pack.identity.*` | pack 必填 | schema＋HTML escape |
| `assets/spritesheet.png` | `packAssets[packId].spritesheet` | 1024×1536 PNG | path allowlist＋magic bytes＋尺寸 |
| `animation` 8×12 | `sprite.grid` | 8／12／128／96 | exact constants＋frame bounds |
| `prompts.idle/letters/stories` | `resolvePrompt(packDefault, userOverride)` | pack default | override/reset unit test |
| `letterMode()` | `generation.mode` | `current` | enum validation |
| `letterProfileId` | `generation.profileId` | 空 | 必須存在於即時 profile 清單；只存 id |
| `recentConversation(8/6)` | `context.recentMessages.{letters,stories}` | letters 8、stories 6 | 0/1/上限與裁切測試 |
| `max_chat_history` | adapter budget hint | 與最近樓數一致 | generation spy |
| `generatedLetter`／番外結果 | `history/{characterKey}/{chatKey}/{feature}` | 空陣列 | 重載、角色／聊天隔離、時間排序測試 |
| 使用者尺寸 60–180 | `appearance.sizePercent` | desktop 100、mobile 82 | clamp 60–180 |
| 新增動畫速度 | `motion.frameIntervalMs` | 125 | clamp 50–1000 |
| 新增移動速度 | `motion.walkSpeedPxPerSec` | 72 | clamp 10–500；不影響動畫速度 |
| `APP_READY/CHAT_CHANGED` | `loaderLifecycle.start/rebind` | 自動 | listener singleton／cleanup test |
| 固定 `packByCharacter` | `bindings[stableCharacterKey]` | 未綁定 | 兩角色／同名角色隔離測試 |

## 8. 不變量、交易與故障恢復

| 不變量 | 可能破壞方式 | 防線 | rollback／fallback | 告警文案 |
|---|---|---|---|---|
| Pack 永不執行使用者程式碼 | ZIP 夾帶 JS/HTML/SVG | 檔名 allowlist；不插入 pack HTML | 整包拒收 | 「這個角色包含有不支援的檔案」 |
| 不允許 ZIP Slip | `../`、絕對路徑、反斜線變形 | normalize 後逐檔驗證 | 0 筆寫入 | 「角色包路徑不安全」 |
| 圖片留在裝置 | upload endpoint／遠端 URL | 只收本機 ZIP bytes；CSP；Blob URL | 停止匯入 | 「圖片只在你的瀏覽器與酒館裡處理」 |
| API 秘密不被 Loader 保存 | 誤序列化 profile 物件 | settings schema 只允許 mode/profileId | 移除未知欄位 | 「Loader 只記住連線名稱，不會保存 API Key」 |
| 匯入要全有或全無 | manifest 過、PNG 寫入失敗 | IndexedDB transaction | 保留舊 revision | 「匯入失敗，原本桌寵沒有被更動」 |
| 角色狀態不串包 | 名稱碰撞／切聊 race | stable key、generation token、先 unmount | 回未綁定 | 「這個角色還沒有綁定桌寵」 |
| Prompt 可見可回復 | 覆寫蓋掉 pack 原文 | default/override 分層 | 一鍵重設 | 「已恢復角色包預設 Prompt」 |
| 生成紀錄不因關閉 HTML 消失 | 只存在 DOM／記憶體 | 生成成功與 IndexedDB 寫入同一流程；再由 store render | 寫入失敗時仍顯示本次結果並告警 | 「這次內容已生成，但未能保存到歷史」 |
| 歷史不串角色／聊天 | 只用 feature 作 key | characterKey＋chatKey＋feature 複合索引 | 回目前 scope 的空狀態 | 「這段聊天目前還沒有生成紀錄」 |
| 動畫與位移速度獨立 | 共用 timer 導致越調越快 | frame clock 與 px/s 分離 | reset motion defaults | 「已恢復預設速度」 |
| 生成不新增聊天樓層 | 誤走 send API | adapter 不暴露 SEND | 直接顯示結果 | 「結果只顯示在桌寵面板」 |

## 9. 使用者核對的產品流程

- [x] 共用 Resident Loader 是網站之後的下一階段；只需安裝一次，可匯入、切換不同人的 pack。（Mini，26-08-14）
- [x] API 不讓 USER 重填 URL／Key；直接沿用酒館目前 API，或從酒館既有 Connection Profiles 選擇。（Mini，26-08-14）
- [x] Loader 可調桌寵大小、位置／顯示設定、動畫速度與移動速度。（Mini，26-08-14）
- [x] Prompt 必須可見、可由 USER 修改並可回到角色包預設。（Mini，26-08-14）
- [x] 番外等功能可自由設定要帶最近幾樓 context；0 代表不帶。（Mini，26-08-14）
- [x] 桌寵產生過的書信／番外／對話紀錄要持久保存在同一個 HTML 面板，關閉面板或重開酒館也不消失；不寫入聊天樓層。（Mini，26-08-14 18:30）
- [x] GPT 圖片指令是「上傳參考圖後直接生出符合格式的 Sprite Sheet PNG」，網站提供一鍵複製完整指令，不是一般畫圖 Prompt。（Mini，26-08-14）
- [x] Pack 綁定在酒館內對目前角色明示操作；網站不需要讀取或上傳角色卡。（前次產品核對＋Mini 本輪指示）
- [x] 匯入、預覽、綁定、設定與自動動畫皆不 SEND／不 GENERATE；只有 USER 明示生成書信／番外才 GENERATE。（依需求保守落地）
- [x] 手機與桌面共用一個設定入口，手機偵測後改成觸控友善單欄面板。（Mini，26-08-14）
- [x] 壞包／壞圖／升級失敗時保留舊資料，不做破壞性覆寫。（依母基地安全規則落地）

## 10. 回歸與驗收計畫

| Case | 前置／操作 | 預期 | 自動／人工 | 證據 |
|---|---|---|---|---|
| 安裝啟動 | 安裝 Loader、無 pack | 無錯誤、無桌寵、面板可匯入 | smoke＋人工 ST | console＋截圖 |
| 合法匯入 | 工坊 v1 `.jrpack.zip` | schema PASS、PNG 可預覽、重載仍在 | unit＋E2E | registry assertions |
| 惡意 ZIP | JS、SVG、`../`、偽 PNG、超額檔 | 0 寫入、舊 revision 保留 | unit | security fixtures |
| 綁定角色 | 匯入後按綁定目前角色 | 當下 mount，切回仍正確 | adapter unit＋ST 人工 | binding key log |
| 同名隔離 | 兩張同名卡各綁 pack | 不串包；無 stable id 時明確提示限制 | unit＋人工 | fixtures |
| Profile 列表 | 酒館已有多個 profile | 只顯示 name/model，保存 id，不顯示 Key | adapter spy＋人工 | serialized settings |
| current API | 選沿用目前 API、生成一次 | GENERATE 1、SEND 0、面板顯示文字 | provider spy | call counts |
| Profile API | 選既有 profile、生成一次 | `/profile-genstream` 使用選定 id | adapter spy＋人工 | command capture（無秘密） |
| Prompt 覆寫 | 改 stories Prompt／重設 | 僅目前角色生效，能回預設 | unit | resolved prompt snapshot |
| Context 樓數 | 設 0、3、50 | 分別帶 0／最近 3／最多 50 樓 | unit | captured sanitized prompt |
| 歷史持久化 | 生成兩筆、關面板、重載酒館 | 同一 HTML 歷史分頁按時間顯示兩筆，內容不消失 | unit＋ST 人工 | IndexedDB/history assertions |
| 歷史隔離 | 兩角色、兩聊天各生成一筆 | 每個 scope 只看見自己的紀錄 | unit | compound-key fixtures |
| 歷史刪除 | 取消確認／確認刪除 | 取消時不動；確認後只刪指定 scope／record | unit＋人工 | transaction assertions |
| 速度獨立 | 改動畫速度後再改移動速度 | frame rate 與 px/s 各自改變 | fake timer unit＋人工 | timing assertions |
| 手機 UI | 390px 匯入、綁定、改 textarea/slider | 單欄、16px input、48px action、安全區可用 | browser QA | screenshot＋computed style |
| cleanup | 切聊天、停用、重啟多次 | 只有一組 listener／pet／timer；Blob URL 撤銷 | unit＋人工 | resource counters |
| Build/package | `npm test && npm run build:loader` | 測試全綠；產出可安裝 ZIP | CI | artifact hash |

## Gate 結果

- [x] 十節完整
- [x] 關鍵邊皆有來源證據與可重查 hash
- [x] 產品流程已由使用者核對
- [x] 映射、state owner、版本與 rollback 策略已定
- [x] validator PASS（26-08-14 18:31，hybrid route）
