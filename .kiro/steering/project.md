---
inclusion: always
---

# 含诺（Arlo）学习站

这是一个面向小学生的纯静态学习网站，托管在 GitHub Pages 上。

## 技术栈
- 纯 HTML + CSS + JavaScript，无框架
- 数据存储：localStorage + GitHub API（cloud.js）
- 部署：GitHub Pages（仓库 lee2089292/arlo-learning）

## 项目结构
- `index.html` — 首页，学习记录展示
- `units.html` — 单位换算练习（长度、重量、时间、面积）
- `clock.html` — 认识时钟练习
- `english.html` — 英语单词练习（外研版四年级下册）
- `words.js` — 英语单词库（按 Unit 1-6 分单元）
- `store.js` — 本地存储模块（localStorage）
- `cloud.js` — 云端同步模块（GitHub API）
- `auth.js` — 用户登录模块
- `style.css` — 全局样式

## 开发规范
- 保持简约风格，不使用任何前端框架
- 所有页面共用 style.css、store.js、cloud.js、auth.js
- 新增学习模块时需同步更新首页导航、卡片入口和历史记录表格
- 单词库严格按照教材内容，不可随意增删
- 提交后通过 `git push` 部署到 GitHub Pages
