# OpenClaw Job Agent — Development Roadmap

## 1. 开发总原则

这项目不要一开始就追求：

- 多模型支持
- 超复杂多 agent 框架
- 完整全自动投递
- 很重的生产级基础设施

第一阶段要追求的是：

**先做出一个别人能本地跑起来、能看见完整主流程的版本。**

---

## 2. 开发阶段总览

建议拆成 6 个阶段：

1. 项目脚手架与本地 Docker 环境
2. 用户资料与职位导入
3. Job Analyzer
4. Resume Customizer
5. Application Pre-fill
6. Tracker、优化与开源发布

---

## 3. Phase 0：项目初始化

### 目标
把项目骨架搭起来。

### 任务
- 建 monorepo
- 建 apps/web
- 建 apps/api
- 建 apps/worker-playwright
- 建 apps/worker-temporal
- 建 packages/shared-types
- 建 packages/prompts
- 建 docker-compose.yml
- 配 pnpm workspace / turbo / nx 任选其一

### 产出
- 仓库结构成型
- 所有服务能本地启动基础空壳

---

## 4. Phase 1：本地 Docker 与基础环境

### 目标
做到“clone 后能启动”。

### 任务
- 配置 postgres 容器
- 配置 redis 容器
- 配置 web 容器
- 配置 api 容器
- 配置 playwright worker 容器
- 配置 volume 挂载本地 storage
- 编写 `.env.example`
- 编写 Quick Start README

### 验收标准
用户可以：

```bash
cp .env.example .env
docker compose up --build
```

然后访问首页和 API 健康检查页。

---

## 5. Phase 2：用户系统与设置页

### 目标
让用户可以保存求职资料和 LLM 配置。

### 任务
- 用户登录系统
- 基本 profile 表设计
- candidate profile 表设计
- settings 表或配置字段设计
- 设置页表单
- LLM 设置模块

### 第一版只支持
- 一个 provider
- 一个 API key
- 一个 model 名称

### 验收标准
用户可以在设置页保存：
- 姓名
- 邮箱
- 电话
- LinkedIn
- GitHub
- work authorization
- LLM API key
- LLM model

---

## 6. Phase 3：职位导入与 Job Collector MVP

### 目标
支持手动粘贴职位链接导入。

### 任务
- `POST /jobs/import-by-url`
- 抓取职位页面 HTML
- 提取 title / company / location / description
- 入库 jobs
- Jobs dashboard 列表展示
- Job detail 页面展示原始 JD

### 暂时不要做
- 大规模站点搜索
- 多来源聚合

### 验收标准
用户贴一个职位链接，系统能保存成 job 记录并展示。

---

## 7. Phase 4：Job Analyzer

### 目标
做出第一个真正有 AI 味道的功能。

### 任务
- 设计分析 prompt
- 定义输出 JSON schema
- LLM service 封装
- 分析结果落库
- Job detail 页面展示：
  - match score
  - required skills
  - missing skills
  - red flags
  - summary

### 关键要求
- 只允许结构化输出
- 结果必须校验
- 失败要有 fallback 和报错日志

### 验收标准
用户点“Analyze”，系统返回一份稳定的岗位匹配分析。

---

## 8. Phase 5：Resume Customizer

### 目标
根据 JD 生成定制简历。

### 任务
- 建 master resume 数据结构
- 建 experience/project library
- 设计简历改写 prompt
- 输出 resume JSON
- 做 PDF 生成
- 存储 PDF 文件
- Resume Review 页面展示
- 记录 resume_versions

### 关键约束
- 不得虚构经历
- 只允许重写和重排
- 提供 diff summary

### 验收标准
用户能看到某个岗位对应的一版 tailored resume，并下载 PDF。

---

## 9. Phase 6：Application Pre-fill MVP

### 目标
做出“自动填写申请表”的核心演示能力。

### 任务
- Playwright worker 建立
- API 与 worker 通信
- 打开 apply page
- 自动填：
  - name
  - email
  - phone
  - LinkedIn
- 上传 resume
- 截图
- 返回 unresolved questions
- Application Review 页面展示结果

### 第一版要求
- 停在提交前
- 不做自动最终提交
- 遇到复杂问题直接标 unresolved

### 验收标准
用户能看到预填写结果和截图，并进入人工确认页面。

---

## 10. Phase 7：Application Tracker

### 目标
形成闭环。

### 任务
- applications 表
- 状态枚举
- status timeline
- tracker dashboard
- 提交后状态更新
- 按公司/岗位查看历史

### 验收标准
用户可以清楚看到：
- 投了哪些岗位
- 当前处于什么状态
- 用了哪个 resume 版本

---

## 11. Phase 8：Workflow Orchestration

### 目标
把离散操作串成真正 workflow。

### 任务
- 接入 Temporal
- 实现：
  - AnalyzeJobWorkflow
  - GenerateResumeWorkflow
  - PrefillApplicationWorkflow
- 实现 pause/resume 机制
- 实现 retry 机制
- workflow logs 页面

### 建议
这一阶段放在核心功能完成后，不要一开始就上。

### 验收标准
流程可串联、可重试、可暂停恢复。

---

## 12. Phase 9：开源友好化

### 目标
把项目变成一个别人愿意 star、愿意试的 GitHub 项目。

### 任务
- 完善 README
- 增加架构图
- 增加 demo 截图
- 增加 `.env.example`
- 增加 seed 数据
- 增加 sample job / sample profile
- 增加快速启动脚本
- 增加 FAQ
- 增加 known limitations

### README 最低应包含
- 项目介绍
- 核心功能
- 技术栈
- 架构图
- 本地启动步骤
- LLM API key 配置说明
- 示例截图

### 验收标准
一个陌生开发者能按 README 在本地跑起来。

---

## 13. MVP 定义

### MVP 范围
只做以下主线：

1. 用户填资料
2. 用户填一个 LLM API key
3. 用户粘贴职位链接
4. 系统抓取 JD
5. 系统分析匹配度
6. 系统生成简历
7. 系统预填写申请表
8. 用户人工确认
9. 系统记录申请状态

### 不纳入 MVP 的功能
- 多模型 provider 管理
- ChatGPT OAuth
- 全自动批量投递
- 复杂 scheduler
- 多租户设计
- 高级 analytics

---

## 14. 建议的先后顺序

最推荐的落地顺序是：

### 第一步
先搭 **Docker + 基础骨架**

### 第二步
做 **Profile + LLM settings**

### 第三步
做 **Job import**

### 第四步
做 **Job analysis**

### 第五步
做 **Resume generation**

### 第六步
做 **Playwright prefill**

### 第七步
做 **Tracker**

### 第八步
再加 **Temporal**

这个顺序最稳，因为每一步都能看到成果。

---

## 15. 每阶段的核心交付件

### 阶段 1
- docker-compose.yml
- `.env.example`
- README 初稿

### 阶段 2
- Settings 页面
- candidate profile 表
- LLM config 存储

### 阶段 3
- jobs 表
- import API
- Jobs dashboard

### 阶段 4
- job_analysis 表
- analysis prompt
- 分析结果 UI

### 阶段 5
- resume_versions 表
- PDF generator
- Resume Review UI

### 阶段 6
- worker-playwright
- automation_sessions 表
- Application Review UI

### 阶段 7
- applications 表
- tracker dashboard

### 阶段 8
- workflow runs
- Temporal integration
- retry / pause / resume

---

## 16. 第一版环境变量规划

建议只暴露最少字段：

```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.4
LLM_API_KEY=

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/job_agent
REDIS_URL=redis://redis:6379
JWT_SECRET=dev-secret
FILE_STORAGE_PATH=/app/storage

APP_URL=http://localhost:3000
API_URL=http://localhost:3001
```

目标是让试用者觉得：

**除了 API key，其他基本不用自己配。**

---

## 17. GitHub 开源发布清单

发布前最好有：

- `README.md`
- `.env.example`
- `docker-compose.yml`
- `LICENSE`
- `CONTRIBUTING.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/limitations.md`

如果还能加：
- demo gif
- 示例数据
- 截图

效果会非常好。

---

## 18. 风险控制建议

### 技术风险
- Playwright 在 Docker 中可能踩坑
- ATS 页面结构不统一
- Temporal 会拉高复杂度

### 产品风险
- 用户期待全自动，但项目定位其实是半自动
- LLM 可能输出不稳定

### 规避方式
- 明确写进 README
- MVP 只做最稳主线
- 复杂功能后置
- 永远保留人工确认节点

---

## 19. 一句话开发策略
**先把“可跑、可演示、可开源试用”的 MVP 做出来，再逐步把它升级成真正完整的 workflow 系统。**

---

## 20. 推荐你现在的实际开工方式

你现在最适合的第一步不是写五个 agent，而是先做这三件事：

1. **仓库骨架 + Docker Compose**
2. **Settings 页面 + LLM API key 配置**
3. **职位链接导入 + JD 分析**

因为这三步一做完，你的项目就已经“活了”。
