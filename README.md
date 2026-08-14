# 桌寵工坊

免帳號、純瀏覽器本機處理的 SillyTavern 桌寵角色包製作工具，並附共用 Resident Loader。

- 工坊：<https://minijinai75.github.io/tavern-pet-workshop/>
- Loader 下載：<https://minijinai75.github.io/tavern-pet-workshop/downloads/resident-loader-v0.1.0.zip>
- Loader 原始碼與說明：[`resident-loader/`](resident-loader/)

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
npm run package:loader
```

## 發布

推送至 `main` 後，GitHub Actions 會執行測試、建置並發布 GitHub Pages。

## 授權

目前尚未選定開源授權。公開可見不代表已授權複製、修改或再散布。
