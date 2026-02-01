# OpenStock 本地开发环境启动指南

本文档详细说明如何在本地环境中启动和运行 OpenStock 项目。

## 环境要求

### 必需软件
- **Node.js 20+** - [下载地址](https://nodejs.org/)
- **MongoDB 7.0+** - [下载地址](https://www.mongodb.com/try/download/community)
- **npm 10.8+** (随 Node.js 一起安装)

### 可选软件
- Git (用于版本控制)
- 代码编辑器 (推荐 VS Code)

## 快速启动流程

### 第一步：检查环境准备

1. **验证 Node.js 安装**
   ```bash
   node --version
   npm --version
   ```
   确保输出类似：
   ```
   v20.20.0
   10.8.2
   ```

2. **验证 MongoDB 安装**
   ```bash
   mongod --version
   ```
   确保输出包含 MongoDB 版本信息。

### 第二步：项目设置

1. **克隆项目** (如果尚未克隆)
   ```bash
   git clone https://github.com/Open-Dev-Society/OpenStock.git
   cd OpenStock
   ```

2. **安装项目依赖**
   ```bash
   npm install
   ```

### 第三步：MongoDB 配置

1. **创建数据目录**
   ```bash
   # 在命令提示符中运行（可能需要管理员权限）
   mkdir C:\data\db
   mkdir C:\data\log
   ```

2. **启动 MongoDB 服务**
   ```bash
   # 方法1：手动启动（开发推荐）
   mongod --dbpath "C:\data\db"
   
   # 方法2：安装为 Windows 服务
   mongod --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log" --install
   net start MongoDB
   ```

   **注意**：如果手动启动，请保持 MongoDB 命令窗口打开。

### 第四步：环境配置

1. **创建环境变量文件**
   - 复制 `.env.example` 为 `.env`（如果存在）
   - 或创建新的 `.env` 文件

2. **配置基本环境变量**
   ```env
   # Core
   NODE_ENV=development

   # Database (本地 MongoDB)
   MONGODB_URI=mongodb://localhost:27017/openstock

   # Better Auth
   BETTER_AUTH_SECRET=your_better_auth_secret_change_this_in_production
   BETTER_AUTH_URL=http://localhost:3000

   # Finnhub (必需 - 免费申请)
   NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key_here
   FINNHUB_BASE_URL=https://finnhub.io/api/v1

   # 可选配置
   GEMINI_API_KEY=your_gemini_api_key_here
   INNGEST_SIGNING_KEY=your_inngest_signing_key_here
   NODEMAILER_EMAIL=youraddress@gmail.com
   NODEMAILER_PASSWORD=your_gmail_app_password
   ```

3. **申请 Finnhub API 密钥**
   - 访问 [finnhub.io](https://finnhub.io)
   - 注册免费账户
   - 获取 API 密钥
   - 更新 `.env` 文件中的 `NEXT_PUBLIC_FINNHUB_API_KEY`

### 第五步：测试和启动

1. **测试数据库连接**
   ```bash
   npm run test:db
   ```
   预期输出：
   ```
   OK: Connected to MongoDB [db="openstock", host="localhost", time=17ms]
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```
   预期输出：
   ```
   ▲ Next.js 15.5.7 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://172.22.112.1:3000
   ```

3. **访问应用**
   - 打开浏览器访问：http://localhost:3000
   - 如果端口 3000 被占用，会自动使用其他可用端口

## 故障排除

### 常见问题

1. **MongoDB 连接失败**
   - 确保 MongoDB 服务正在运行
   - 检查端口 27017 是否被占用
   - 验证数据目录权限

2. **端口被占用**
   - 应用会自动选择其他端口
   - 或手动指定端口：`npm run dev -- -p 3001`

3. **API 密钥错误**
   - 确保 Finnhub API 密钥正确配置
   - 检查 API 密钥是否有效

4. **依赖安装失败**
   - 清除缓存：`npm cache clean --force`
   - 删除 node_modules：`rm -rf node_modules`
   - 重新安装：`npm install`

### 调试命令

```bash
# 检查 MongoDB 状态
net start | findstr MongoDB

# 检查端口占用
netstat -ano | findstr :3000

# 查看应用日志
npm run dev

# 构建检查
npm run build
```

## 开发功能说明

启动成功后，您可以：

- ✅ **用户认证** - 注册、登录、密码重置
- ✅ **股票搜索** - 实时搜索股票代码和公司
- ✅ **关注列表** - 添加/删除关注的股票
- ✅ **股票详情** - 查看公司信息、财务数据
- ✅ **市场数据** - 实时价格和图表
- ✅ **个性化设置** - 投资目标、风险偏好等

## 开发脚本

```bash
# 开发模式（热重载）
npm run dev

# 生产构建
npm run build

# 生产启动
npm run start

# 代码检查
npm run lint

# 数据库测试
npm run test:db
```

## 项目结构

```
OpenStock/
├── app/                 # Next.js App Router
├── components/          # React 组件
├── database/           # MongoDB 模型
├── lib/               # 工具函数和配置
├── public/            # 静态资源
└── scripts/           # 工具脚本
```

## 技术支持

如果遇到问题：

1. 检查本文档的故障排除部分
2. 查看项目主 README.md
3. 在 GitHub Issues 中搜索相关问题
4. 创建新的 Issue 描述问题

---

**祝您开发愉快！** 🚀