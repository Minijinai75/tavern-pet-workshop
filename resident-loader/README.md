# Resident Loader v0.1.0

共用的 SillyTavern 動畫桌寵載入器。安裝一次後，可以匯入酒館桌寵工坊產生的 `.jrpack.zip`，再綁定到目前角色。

## 安裝

1. 解壓縮本 ZIP。
2. 把解壓後包含 `manifest.json` 的整個資料夾，放到 SillyTavern 的 `data/<你的使用者>/extensions/resident-loader/`。舊版或全域安裝也可用 `public/scripts/extensions/third-party/resident-loader/`。
3. 重新啟動或重新整理 SillyTavern。
4. 點左下角「桌寵」，匯入工坊下載的 `.jrpack.zip`，再按「綁定目前角色」。

## 已包含

- 安全 data-only 角色包匯入；拒絕 JS、HTML、SVG、假 PNG、危險 ZIP 路徑。
- 每個角色獨立綁定角色包、日常／書信／番外 Prompt、API Profile、最近對話樓數與速度設定。
- 最近樓層設定會顯示實際樓數、約略字數和內容預覽；設為 0 就完全不帶對話。
- 沿用目前酒館 API，或選擇酒館已存在的 Connection Profile；Loader 不保存 API Key。
- 桌機／手機大小、透明度、拖曳位置、動畫速度與移動速度。
- 書信與番外生成結果保存在同一個 Loader HTML 面板；依角色＋聊天＋功能隔離，重開仍在。
- 生成結果只顯示在桌寵面板，不新增聊天樓層。

所有角色包、圖片、Prompt 覆寫與歷史紀錄都保存在瀏覽器本機 IndexedDB。
