# 桌寵工坊

免帳號、純瀏覽器本機處理的 SillyTavern 桌寵角色包製作工具。

## 目前能做什麼

- 一鍵複製「參考圖 → 1024×1536、8×12、96 格透明 Sprite Sheet」的 GPT 圖片指令。
- 上傳標準 Sprite Sheet PNG，檢查尺寸並以第一格在酒館風格畫面預覽。
- 編輯桌寵名稱、作者、介紹、代表色與三組 Prompt。
- 下載資料型 `.jrpack.zip`，不輸出任意 JavaScript。
- 圖片、角色資料與 Prompt 不會傳到伺服器。

> Resident Loader 的匯入功能與安裝包仍在後續階段；目前網站先建立角色包格式與製作流程。

## 本機開發

```bash
npm install
npm run dev
```

## 驗證

```bash
npm test
npm run build
```

## 發布

推送至 `main` 後，GitHub Actions 會執行測試、建置並發布 GitHub Pages。

## 授權

目前尚未選定開源授權。公開可見不代表已授權複製、修改或再散布。
