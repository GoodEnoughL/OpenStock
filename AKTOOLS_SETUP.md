# Aktools 部署指南

Aktools 是基于 AKShare 的 HTTP API 服务，可以为 OpenStock 提供全面的股票数据支持，包括A股、港股、美股等全球市场。

## 为什么选择 Aktools？

### 优势
- ✅ **支持全球市场** - A股、港股、美股等
- ✅ **数据实时性强** - 直接从交易所获取数据
- ✅ **无需API密钥** - 完全免费使用
- ✅ **本地部署** - 数据安全可控
- ✅ **功能丰富** - K线数据、市场指数等

### 对比 Finnhub
| 特性 | Aktools | Finnhub |
|------|---------|---------|
| 数据费用 | 免费 | 免费版有限制 |
| A股支持 | ✅ 完整支持 | ❌ 有限支持 |
| 港股支持 | ✅ 完整支持 | ❌ 有限支持 |
| 美股支持 | ✅ 完整支持 | ✅ 完整支持 |
| 部署方式 | 本地/Docker | 云端API |
| 数据延迟 | 较低 | 较低 |

## 部署方式

### 方式一：Docker 部署（推荐）

1. **安装 Docker**
   ```bash
   # 确保已安装 Docker 和 Docker Compose
   docker --version
   docker-compose --version
   ```

2. **创建 docker-compose.yml**
   ```yaml
   version: '3'
   services:
     aktools:
       image: mornind/aktools:latest
       container_name: aktools
       ports:
         - "8080:8080"
       restart: unless-stopped
       environment:
         - PORT=8080
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:8080/stock_zh_a_spot_em"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **验证服务**
   ```bash
   curl http://localhost:8080/stock_zh_a_spot_em?symbo1=000001
   ```

### 方式二：Python 环境部署

1. **安装 Python 3.8+**
   ```bash
   python --version
   ```

2. **安装 AKShare 和 Aktools**
   ```bash
   pip install akshare aktools
   ```

3. **启动服务**
   ```bash
   # 直接启动
   aktools serve --port 8080
   
   # 或使用 nohup 后台运行
   nohup aktools serve --port 8080 > aktools.log 2>&1 &
   ```

4. **验证服务**
   ```bash
   curl http://localhost:8080/stock_zh_a_spot_em?symbo1=000001
   ```

## 配置 OpenStock

### 环境变量配置

在 `.env` 文件中设置：

```env
# 选择数据源 (aktools 或 finnhub)
STOCK_DATA_SOURCE=aktools

# Aktools 服务地址
AKTOOLS_BASE_URL=http://localhost:8080

# Finnhub 配置（备选）
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key_here
FINNHUB_BASE_URL=https://finnhub.io/api/v1
```

### 测试连接

启动 OpenStock 后，可以测试 Aktools 连接：

```bash
# 检查数据源状态
npm run dev

# 访问应用后，在浏览器控制台执行：
await fetch('/api/stock/status').then(r => r.json())
```

## 支持的股票代码格式

### A股市场
- **上海证券交易所**: `600000` 或 `sh.600000`
- **深圳证券交易所**: `000001` 或 `sz.000001`
- **北京证券交易所**: `830799` 或 `bj.830799`

### 港股市场
- **香港交易所**: `00700` 或 `hk.00700` (腾讯控股)

### 美股市场
- **美国交易所**: `AAPL` 或 `us.AAPL` (苹果公司)

### 市场指数
- **上证指数**: `000001`
- **深证成指**: `399001`
- **创业板指**: `399006`

## API 接口示例

### 获取股票实时数据
```bash
# A股实时数据
curl "http://localhost:8080/stock_zh_a_spot_em?symbol=000001"

# 港股实时数据
curl "http://localhost:8080/stock_hk_spot_em?symbol=00700"

# 美股实时数据
curl "http://localhost:8080/stock_us_spot_em?symbol=AAPL"
```

### 获取K线数据
```bash
# 日K线数据
curl "http://localhost:8080/stock_zh_a_hist?symbol=000001&period=daily"

# 周K线数据
curl "http://localhost:8080/stock_zh_a_hist?symbol=000001&period=weekly"
```

### 获取市场指数
```bash
# A股主要指数
curl "http://localhost:8080/stock_zh_index_spot"
```

## 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :8080
   
   # 检查 Docker 容器状态
   docker ps -a
   docker logs aktools
   ```

2. **数据获取失败**
   ```bash
   # 测试基础连接
   curl http://localhost:8080/
   
   # 检查网络连接
   ping localhost
   ```

3. **Python 环境问题**
   ```bash
   # 检查 Python 版本
   python --version
   
   # 重新安装依赖
   pip install --upgrade akshare aktools
   ```

### 性能优化

1. **启用缓存**
   ```bash
   # 使用 Redis 缓存
   docker run -d --name redis -p 6379:6379 redis
   ```

2. **负载均衡**
   ```bash
   # 使用多个 Aktools 实例
   docker-compose scale aktools=3
   ```

3. **监控日志**
   ```bash
   # 查看实时日志
   docker logs -f aktools
   
   # 或查看文件日志
   tail -f aktools.log
   ```

## 数据更新频率

- **实时数据**: 每3-5秒更新
- **日线数据**: 每日收盘后更新
- **财务数据**: 季度更新
- **公司信息**: 不定期更新

## 数据源说明

Aktools 数据来源于：
- **东方财富网** - A股、港股实时数据
- **新浪财经** - 美股实时数据
- **腾讯财经** - 历史K线数据
- **官方交易所** - 公司基本信息

## 技术支持

如果遇到问题：

1. 查看 Aktools 日志：`docker logs aktools`
2. 检查网络连接
3. 验证股票代码格式
4. 重启 Aktools 服务

---

**部署完成后，OpenStock 将自动使用 Aktools 作为股票数据源，享受全面的全球市场支持！** 🚀