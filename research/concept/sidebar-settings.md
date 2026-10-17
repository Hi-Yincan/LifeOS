# 系统设置入口纠正：开始菜单左侧栏独立按钮

2026-10-17。负责人通过截图明确：Settings 应像 Documents、Pictures、Videos 一样，位于开始菜单左侧栏，与 Power 并列。上次把它整合到电源子菜单是助手理解错误，已撤回。

当前入口：**开始菜单左侧栏 → 系统设置**，位置在 Power 上方。它直接使用上游 SidebarButton，继承相同的图标尺寸、行高、悬停、折叠/展开和键盘行为。原生高度策略只为新增行预留空间，没有额外移动界面。

删除自制电源子菜单及 helper，Power 的完整动作块和提示与固定上游逐字一致；未执行清除会话来测试。作品集仍无设置按钮，普通应用列表仍不重复放置 Settings。

构建、类型检查及静态导出通过（82.38 秒）。[源码检查](evidence/sidebar-settings/source.json)记录 Power 恢复情况；[浏览器结果](evidence/sidebar-settings/browser.json)记录同级顺序、直接打开与窗口恢复。[侧栏画面](evidence/sidebar-settings/sidebar.png)是 DOM 渲染图，非原生截图。

[系统设置规范](../../specs/concept/system-settings.md)、PRD、UI 规范、流程和运行说明已经更正；#17 仍负责 OS 设置边界。旧“电源子菜单”评论留作历史，不能作为当前需求或负责人认可的方案。
