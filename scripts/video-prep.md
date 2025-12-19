# 🎥 视频录制检查清单 (Phase 15)

> **目标**: 确保演示视频零瑕疵，达到"可投资级"标准。

## 1. 环境自检 (Environment Check)

- [ ] **代码状态**
  - [ ] `git status` 确认无未提交的脏代码
  - [ ] `pnpm build` 确保前端构建无报错
  - [ ] `anchor build` 确保合约构建最新

- [ ] **运行环境**
  - [ ] `docker ps` 确保 SRE 容器未运行 (演示时如果用 Mock 模式可不需要，但建议备用)
  - [ ] `solana config get` 确认指向 Devnet
  - [ ] `solana balance` 确保演示账户有 > 2 SOL

- [ ] **浏览器设置**
  - [ ] Chrome/Edge 隐身模式 (无插件干扰)
  - [ ] 分辨率: 1920x1080 (100% 缩放)
  - [ ] 隐藏书签栏 (Ctrl+Shift+B)
  - [ ] F11 全屏模式
  - [ ] 清空 LocalStorage (F12 -> Application -> Clear Storage)

## 2. 演示流程彩排 (Rehearsal)

- [ ] **Happy Path**
  - [ ] 点击 "Execute Skill"
  - [ ] 确认状态流转: IDLE -> LOCK -> EXEC -> COMMIT -> FINALIZE
  - [ ] 确认日志出现绿色 "SUCCESS"
  - [ ] 确认金额变化正确

- [ ] **Malicious Path**
  - [ ] 按 'X' 键激活恶意模式
  - [ ] 确认出现红色 "MALICIOUS MODE ACTIVE" 标签
  - [ ] 点击 "Execute Skill"
  - [ ] 确认状态流转: ... -> COMMIT -> CHALLENGE -> SLASHED
  - [ ] 确认出现红色 "SLASHED" 印章
  - [ ] 确认日志出现红色 "CRIT" 报警

## 3. 录制设置 (OBS/Screenflow)

- [ ] **音频**
  - [ ] 麦克风底噪测试 (-60dB 以下)
  - [ ] 语速控制: 140字/分钟 (沉稳、自信)
  - [ ] 关闭系统通知/静音手机

- [ ] **视频**
  - [ ] 帧率: 60fps
  - [ ] 码率: High / Lossless
  - [ ] 鼠标指针: 稍微放大或加高亮圈 (可选)

## 4. 应急预案

- [ ] **网络卡顿**: 切换手机热点
- [ ] **Devnet 拥堵**: 使用 `localhost` 验证前端逻辑 (备选)
- [ ] **演示失败**: 准备备用的录屏片段进行剪辑

---

*Last Updated: Phase 15 Final Push*
