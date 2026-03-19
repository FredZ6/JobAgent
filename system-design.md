# OpenClaw Job Agent — System Design Document

## 1. 项目概述

### 1.1 项目名称
**OpenClaw Job Agent**

### 1.2 项目定位
一个面向求职场景的**半自动 AI 工作流系统**，帮助用户完成：

- 岗位收集
- 岗位分析
- 简历定制
- 申请表预填写
- 人工确认提交
- 申请状态追踪

它不是一个“全自动海投机器人”，而是一个**人机协作型求职 Copilot**。

---

## 2. 设计目标

### 2.1 产品目标
减少求职流程中的重复劳动，把用户时间集中在最有价值的环节：

- 判断这个岗位值不值得投
- 审核简历是否贴合
- 最终确认是否提交

### 2.2 工程目标
构建一个具备以下特点的系统：

- 模块清晰
- 支持 AI 接入
- 支持浏览器自动化
- 支持长流程任务
- 可本地 Docker 部署
- 适合开源发布到 GitHub
- 对试用者足够友好

---

## 3. 系统范围

### 3.1 第一版支持
- 用户配置个人求职信息
- 导入职位链接
- 抓取 JD
- AI 分析岗位匹配度
- 生成定制版简历
- 自动预填写申请表基础信息
- 人工确认后提交
- 申请记录追踪
- 本地 Docker 启动
- 用户填写一个 LLM API key 即可使用 AI 能力

### 3.2 第一版不支持
- 完全自动提交所有网站申请
- 批量跨平台高频抓取
- 多模型复杂编排
- ChatGPT OAuth 作为正式 LLM 认证方式
- 自动处理验证码
- 自动回复 recruiter

---

## 4. 关键设计原则

### 4.1 半自动优先
所有高风险节点都保留人工确认。

### 4.2 单模型优先
第一版采用**单一 LLM provider + 单 API key**的方式，降低配置复杂度。

### 4.3 Docker 优先
开源项目必须优先考虑“别人是否能快速跑起来”。

### 4.4 Workflow 优先
项目核心不是某个页面，而是完整工作流。

### 4.5 AI 只做适合 AI 的事
LLM 主要负责：

- 读 JD
- 做结构化分析
- 改写简历
- 生成问答草稿

不把所有事情都交给大模型。

---

## 5. 总体技术栈

### 5.1 推荐技术栈
- **Frontend:** Next.js + React + TypeScript
- **Backend API:** NestJS
- **Browser Automation:** Playwright
- **Workflow Engine:** Temporal
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Cache:** Redis
- **File Storage:** Local storage in dev / S3-compatible storage later
- **Validation:** Zod
- **UI:** Tailwind CSS + shadcn/ui
- **Containerization:** Docker + Docker Compose
- **AI Integration:** Single LLM API key for v1

---

## 6. 架构概览

### 6.1 逻辑架构

```text
User
 │
 ▼
Next.js Web App
 │
 ▼
NestJS API
 ├─ PostgreSQL
 ├─ Redis
 ├─ Local File Storage / S3
 ├─ LLM Provider
 └─ Temporal Server
      │
      ▼
Temporal Workers
 ├─ Job Collector Workflow
 ├─ Job Analyzer Workflow
 ├─ Resume Customizer Workflow
 ├─ Application Pre-fill Workflow
 └─ Application Tracker Workflow
      │
      ▼
Playwright Worker
```

### 6.2 分层职责
**Web 层**  
负责 dashboard、审核页面、设置页面。

**API 层**  
负责业务逻辑、数据管理、状态流转。

**Workflow 层**  
负责长流程编排、暂停、恢复、重试。

**Automation 层**  
负责网页操作。

**AI 层**  
负责文本理解与生成。

**Storage 层**  
负责持久化和文件存储。

---

## 7. 五个 Agent Workflow 设计

### 7.1 总体流程

```text
Job Collector Agent
        │
        ▼
Job Analyzer Agent
        │
        ▼
Resume Customizer Agent
        │
        ▼
Application Pre-fill Agent
        │
        ▼
Human Approval
        │
        ▼
Application Tracker Agent
```

### 7.2 Agent 1：Job Collector Agent
**目标**  
收集岗位并结构化保存。

**输入**
- 职位链接
- 搜索参数
- 目标来源

**输出**
- 标准化 Job 记录

**是否依赖 LLM**
- 通常不依赖
- 主要依赖抓取逻辑和网页解析

**主要工具**
- Playwright
- HTML parsing
- NestJS API
- PostgreSQL

### 7.3 Agent 2：Job Analyzer Agent
**目标**  
分析岗位与候选人的匹配程度。

**输入**
- Job description
- Candidate profile

**输出**
- match score
- required skills
- missing skills
- red flags
- fit summary

**是否依赖 LLM**
- 强依赖

**主要工具**
- LLM API
- Zod schema
- Analysis service

### 7.4 Agent 3：Resume Customizer Agent
**目标**  
生成针对岗位的定制简历版本。

**输入**
- 主简历
- 项目经历
- 岗位分析结果
- JD 文本

**输出**
- 简历 JSON
- PDF 文件
- diff 摘要

**是否依赖 LLM**
- 强依赖

**主要工具**
- LLM API
- Resume template engine
- PDF generator
- File storage

### 7.5 Agent 4：Application Pre-fill Agent
**目标**  
自动填写申请表的基础信息，并停在最终提交前。

**输入**
- apply URL
- candidate profile
- generated resume
- default answers

**输出**
- 已填写字段列表
- unresolved questions
- screenshot
- session state

**是否依赖 LLM**
- 部分依赖

**主要工具**
- Playwright
- LLM（回答开放问题时）
- screenshot / trace

### 7.6 Agent 5：Application Tracker Agent
**目标**  
记录和追踪申请全生命周期。

**输入**
- application state changes
- workflow events

**输出**
- application timeline
- status funnel
- analytics

**是否依赖 LLM**
- 通常不依赖

**主要工具**
- PostgreSQL
- NestJS modules
- Dashboard analytics

---

## 8. LLM 接入设计

### 8.1 第一版原则
第一版只支持：

- **用户填写一个 LLM API key**
- 默认只接入一个 provider
- 推荐先支持 OpenAI 兼容接口风格

### 8.2 为什么这样设计
因为它最简单：

- 用户更容易配置
- 开源试用门槛更低
- 不需要复杂的 provider 管理
- 更适合先做出 MVP

### 8.3 LLM 在系统中的作用
LLM 只用于以下能力：

- 岗位分析
- 简历改写
- 开放问题生成草稿

不用于：

- 普通 CRUD
- 状态追踪
- 简单字段填写
- 页面跳转控制

### 8.4 配置方式
设置页中提供：

- Provider
- API Key
- Model name

第一版可以先简化成：

- `LLM_API_KEY`
- `LLM_MODEL`

### 8.5 关于 ChatGPT OAuth
架构上可以预留 `auth_method` 字段，但**第一版不正式支持**。  
第一版只落地：

- `auth_method = api_key`

---

## 9. 用户认证与 LLM 认证拆分

### 9.1 App Auth
用户登录你的项目本身。

可选：
- GitHub OAuth
- Google OAuth
- Email magic link

### 9.2 LLM Auth
用户授权系统调用模型。

第一版：
- API Key

### 9.3 为什么必须分开
因为这两个是不同层：

- 登录你的产品
- 使用哪个模型、由谁计费

这两个不应该混为一谈。

---

## 10. Docker 部署设计

### 10.1 开源目标
让使用者尽量做到：

```bash
git clone ...
cp .env.example .env
# 填一个 LLM API key
docker compose up --build
```

### 10.2 Docker 化范围
必须 Docker 化：

- web
- api
- postgres
- redis
- worker-playwright
- worker-temporal

可选：
- temporal server
- temporal ui

### 10.3 本地开发默认值
为了实现“只填一个 key 就能跑”，建议：

- PostgreSQL：compose 自动启动
- Redis：compose 自动启动
- 文件存储：默认本地目录挂载
- JWT secret：dev 默认值
- Playwright 浏览器依赖：写进镜像
- LLM API key：用户自己填写

### 10.4 环境变量示例

```env
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/job_agent
REDIS_URL=redis://redis:6379

LLM_PROVIDER=openai
LLM_MODEL=gpt-5.4
LLM_API_KEY=

JWT_SECRET=dev-secret
FILE_STORAGE_PATH=/app/storage
```

---

## 11. 数据模型

### 11.1 核心表
- users
- candidate_profiles
- jobs
- job_analysis
- resume_versions
- applications
- automation_sessions
- workflow_runs

### 11.2 关系说明
- 一个 user 对应一个或多个 candidate profile 版本
- 一个 job 可以有一个或多个 analysis 记录
- 一个 job 可以有多个 resume version
- 一个 application 绑定一个 job 和一个 resume version
- 一个 automation session 绑定一次预填写执行

---

## 12. API 模块设计

### 12.1 Jobs
- `POST /jobs/import-by-url`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/analyze`

### 12.2 Resume
- `POST /jobs/:id/generate-resume`
- `GET /jobs/:id/resume-versions`
- `GET /resume-versions/:id`

### 12.3 Application
- `POST /jobs/:id/prefill`
- `GET /applications`
- `GET /applications/:id`
- `POST /applications/:id/submit`

### 12.4 Profile
- `GET /profile`
- `POST /profile`
- `PATCH /profile/default-answers`

### 12.5 Settings
- `GET /settings/llm`
- `PATCH /settings/llm`

---

## 13. 前端页面设计

### 13.1 Jobs Dashboard
显示职位列表、匹配分、状态、操作按钮。

### 13.2 Job Detail
显示 JD、AI 分析结果、关键词、red flags。

### 13.3 Resume Review
显示生成的简历版本、diff、下载链接。

### 13.4 Application Review
显示表单截图、自动填写字段、未解决问题、确认提交按钮。

### 13.5 Tracker Dashboard
显示申请漏斗、状态分布、公司列表。

### 13.6 Settings
显示：
- 基本资料
- 主简历
- 默认回答
- LLM 配置

---

## 14. Monorepo 目录结构

```text
openclaw-job-agent/
├─ apps/
│  ├─ web/
│  ├─ api/
│  ├─ worker-playwright/
│  └─ worker-temporal/
├─ packages/
│  ├─ ui/
│  ├─ shared-types/
│  ├─ prompts/
│  ├─ resume-templates/
│  └─ config/
├─ prisma/
├─ infra/
│  ├─ docker/
│  └─ scripts/
├─ docs/
└─ docker-compose.yml
```

---

## 15. 非功能性要求

### 15.1 可用性
- 10 分钟内本地启动
- 新用户通过 README 能走通流程

### 15.2 可观察性
- automation trace
- screenshot
- workflow logs
- structured application logs

### 15.3 安全性
- API key 加密存储
- session/cookie 谨慎处理
- 文件访问控制

### 15.4 可维护性
- worker 解耦
- DTO/schema 统一
- prompt 模板集中管理

---

## 16. 风险与限制

- 各 ATS 页面差异大
- 网页自动化稳定性有限
- CAPTCHA 无法完全自动处理
- LLM 可能编造，需要严格约束
- ChatGPT OAuth 目前不作为正式方案
- Temporal 增加了架构复杂度

---

## 17. 最终定位
这是一个：

**基于单一 LLM API key、支持本地 Docker 部署、围绕五个业务 Agent 展开的半自动求职工作流平台。**
