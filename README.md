# 桌寵工坊

免帳號、純瀏覽器本機處理的 SillyTavern 桌寵角色包製作工具，搭配獨立的共用 Resident Loader。

- 工坊：<https://minijinai75.github.io/tavern-pet-workshop/>
- Loader repo 安裝網址：<https://github.com/Minijinai75/resident-loader>
- Loader 離線 ZIP：<https://github.com/Minijinai75/resident-loader/releases/download/v0.1.1/resident-loader-v0.1.1.zip>

## 目前能做什麼

- 一鍵複製「參考圖 → 1024×1536、8×12、96 格透明 Sprite Sheet」的 GPT 圖片指令。
- 上傳標準 Sprite Sheet PNG，檢查尺寸並以第一格在酒館風格畫面預覽。
- 編輯桌寵名稱、作者、介紹、代表色與三組 Prompt。
- 下載資料型 `.jrpack.zip`，不輸出任意 JavaScript。
- 圖片、角色資料與 Prompt 不會傳到伺服器。
- 安裝 Resident Loader 後，可匯入角色包、綁定目前角色、選酒館既有 API Profile、調整 Prompt／最近樓數／桌寵速度，並在同一個 HTML 面板保存生成歷史。

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

推送至 `main` 後，GitHub Actions 會執行工坊測試、建置並發布 GitHub Pages。Loader 的原始碼、測試、預建 `dist/` 與版本發行在獨立的 [`Minijinai75/resident-loader`](https://github.com/Minijinai75/resident-loader)。

## 授權

目前尚未選定開源授權。公開可見不代表已授權複製、修改或再散布。
