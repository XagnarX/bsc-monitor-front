# BSC Monitor API 接口文档

## 📖 文档概述

本文档详细描述了 BSC Monitor 前端项目所需的所有后端 API 接口。BSC Monitor 是一个基于 Vue 3 + Arco Design 的区块链监控平台，支持多链监控、代币管理、交易分析等功能。

**基础配置**:
- 基础 URL: `http://localhost:8080/` (可配置)
- 内容类型: `application/json`
- 身份验证: Bearer Token (satoken)
- 响应格式: JSON

---

## 📂 接口分类

### 1. 监控目标管理 API
### 2. 交易分析 API
### 3. 活动统计 API
### 4. 交易查询 API
### 5. 接收者黑名单 API
### 6. 地址标签管理 API
### 7. ERC-20 事件 API
### 8. 代币管理 API
### 9. 批量转账 API
### 10. 内部交易 API
### 11. USDT 监控 API

---

## 1. 监控目标管理 API

### 1.1 获取所有监控目标
**接口路径**: `/api/monitor/targets`
**HTTP 方法**: `GET`
**功能描述**: 获取所有监控目标列表，支持分页和过滤

**支持入参**:
```typescript
{
  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,        // 页码，从1开始
  limit?: number,       // 每页数量，默认20
  offset?: number,      // 偏移量
  sort?: string,        // 排序字段
  order?: 'asc'|'desc', // 排序方向
  address?: string,     // 按地址过滤
  tag?: string          // 按标签过滤
}
```

**请求示例**:
```bash
GET /api/monitor/targets?page=1&limit=20&sort=address&order=asc
```

**返回数据**:
```typescript
{
  code: 200,
  message: "success",
  data: {
    total: 100,
    targets: [
      {
        address: "0x123...abc",
        tag: "bybit1",
        min_value: "20",
        max_value: "100"
      }
    ]
  }
}
```

### 1.2 添加监控目标
**接口路径**: `/api/monitor/targets`
**HTTP 方法**: `POST`
**功能描述**: 添加新的监控目标，设置地址、标签和金额范围

**支持入参**:
```typescript
{
  address: string,        // 必填，监控地址（以太坊地址格式）
  tag: string,            // 必填，标签名称（字符串）
  min_value: string,      // 必填，最小交易金额（字符串格式的数字）
  max_value?: string,     // 可选，最大交易金额（字符串格式的数字）
  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/monitor/targets
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "bybit1",
  "min_value": "20",
  "max_value": "100"
}
```

### 1.3 删除监控目标
**接口路径**: `/api/monitor/targets`
**HTTP 方法**: `DELETE`
**功能描述**: 删除指定的监控目标（通过地址和标签组合）

**支持入参**:
```typescript
{
  address: string,        // 必填，地址
  tag: string,            // 必填，标签
  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
DELETE /api/monitor/targets
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "bybit1"
}
```

### 1.4 获取所有标签
**接口路径**: `/api/monitor/tags`
**HTTP 方法**: `GET`
**功能描述**: 获取所有监控标签列表

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,        // 页码
  limit?: number,       // 每页数量
  sort?: string,        // 排序字段
  order?: 'asc'|'desc', // 排序方向
}
```

**请求示例**:
```bash
GET /api/monitor/tags?limit=50
```

### 1.5 根据地址查询标签
**接口路径**: `/api/monitor/tags/by-address`
**HTTP 方法**: `GET`
**功能描述**: 根据监控地址查询相关标签

**支持入参**:
```typescript
{
  monitor_address: string,  // 必填，监控地址
  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/monitor/tags/by-address?monitor_address=0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5
```

---

## 2. 交易分析 API

### 2.1 分析接口 v1
**接口路径**: `/api/monitor/analysis`
**HTTP 方法**: `GET`
**功能描述**: 交易分析查询（第一版本），支持多种过滤条件

**支持入参**:
```typescript
{
  // 地址过滤
  address?: string,           // 单个地址
  from_address?: string,      // 单个发送地址
  from_addresses?: string,    // 多个发送地址（逗号分隔）

  // 标签过滤
  tag?: string,               // 标签名称

  // 区块范围过滤
  min_block_num?: number,     // 最小区块号
  max_block_num?: number,     // 最大区块号

  // 金额范围过滤
  min_value?: number,         // 最小金额（数值）
  max_value?: number,         // 最大金额（数值）

  // 新地址过滤
  is_new_address: boolean,    // 是否新地址（必需参数）

  // 排序
  order_by?: string,          // 排序字段（如: block_number, value, timestamp）
  order?: string,             // 排序方向（'asc' | 'desc'）

  // 分页
  limit?: number,             // 返回记录数限制

  // 时间范围
  start_time?: string,        // 开始时间（ISO 8601格式）
  end_time?: string,          // 结束时间（ISO 8601格式）

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/monitor/analysis?from_address=0x123...abc&min_block_num=30000000&max_block_num=30001000&is_new_address=true&limit=100&order_by=block_number&order=desc
```

### 2.2 分析接口 v2
**接口路径**: `/api/monitor2/analysis`
**HTTP 方法**: `GET`
**功能描述**: 交易分析查询（第二版本），接口结构同 v1

**支持入参**: 同 `/api/monitor/analysis`

**请求示例**:
```bash
GET /api/monitor2/analysis?from_address=0x123...abc&min_block_num=30000000&is_new_address=true&limit=100
```

### 2.3 获取地址交易
**接口路径**: `/api/monitor2/analysis/transactions`
**HTTP 方法**: `GET`
**功能描述**: 获取指定地址的交易列表详情

**支持入参**:
```typescript
{
  address: string,        // 必填，地址
  period?: string,        // 可选，时间周期（如: '24h', '7d', '30d'）

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  min_block_num?: number, // 最小区块号
  max_block_num?: number, // 最大区块号
  limit?: number,         // 限制数量
  offset?: number,        // 偏移量
}
```

**请求示例**:
```bash
GET /api/monitor2/analysis/transactions?address=0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5&period=7d&limit=50
```

---

## 3. 活动统计 API

### 3.1 获取活动统计
**接口路径**: `/api/monitor2/activity`
**HTTP 方法**: `GET`
**功能描述**: 获取地址活动统计信息，支持多维度统计

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意参数对象，会透传给后端统计逻辑
  // 常用可选参数：
  address?: string,        // 特定地址统计
  tag?: string,            // 标签过滤
  period?: string,         // 统计周期（'24h', '7d', '30d'）
  min_tx_count?: number,   // 最小交易次数
  start_time?: string,     // 开始时间
  end_time?: string,       // 结束时间

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/monitor2/activity?period=7d&min_tx_count=10
```

### 3.2 获取置顶地址
**接口路径**: `/api/monitor2/activity/pinned`
**HTTP 方法**: `GET`
**功能描述**: 获取置顶地址列表

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,        // 页码
  limit?: number,       // 每页数量
  sort?: string,        // 排序字段
  order?: 'asc'|'desc', // 排序方向
}
```

**请求示例**:
```bash
GET /api/monitor2/activity/pinned?limit=20&order=desc
```

### 3.3 添加置顶地址
**接口路径**: `/api/monitor2/activity/pinned`
**HTTP 方法**: `POST`
**功能描述**: 添加地址到置顶列表

**支持入参**:
```typescript
{
  address: string,        // 必填，地址
  tag: string,            // 必填，标签

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/monitor2/activity/pinned
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "important_address"
}
```

### 3.4 删除置顶地址
**接口路径**: `/api/monitor2/activity/pinned`
**HTTP 方法**: `DELETE`
**功能描述**: 从置顶列表删除地址

**支持入参**:
```typescript
{
  address: string,        // 必填，地址
  tag: string,            // 必填，标签

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
DELETE /api/monitor2/activity/pinned
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "important_address"
}
```

### 3.5 删除活动地址（添加到黑名单）
**接口路径**: `/api/monitor2/activity/blacklist`
**HTTP 方法**: `POST`
**功能描述**: 将地址添加到黑名单

**支持入参**:
```typescript
{
  address: string,        // 必填，地址
  tag?: string,           // 可选，标签

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/monitor2/activity/blacklist
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "suspicious"
}
```

---

## 4. 交易查询 API

### 4.1 查询交易
**接口路径**: `/api/transactions/query`
**HTTP 方法**: `GET`
**功能描述**: 查询交易记录，支持多条件过滤

**支持入参**:
```typescript
{
  // 地址过滤
  from_addresses?: string,      // 发送地址列表（逗号分隔）
  to_addresses?: string,        // 接收地址列表（逗号分隔）

  // 代币过滤
  token_contract?: string,      // 代币合约地址

  // 区块范围
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号

  // 金额过滤
  min_token_amount?: string,    // 最小代币数量（wei格式字符串）

  // 分页
  limit?: number,               // 返回记录数限制

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  offset?: number,              // 偏移量
  sort?: string,                // 排序字段
  order?: 'asc'|'desc',         // 排序方向
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间
}
```

**请求示例**:
```bash
GET /api/transactions/query?from_addresses=0x123...abc,0x456...def&token_contract=0x789...ghi&min_block_num=30000000&limit=100
```

### 4.2 查询 BNB 交易
**接口路径**: `/api/transactions/bnb`
**HTTP 方法**: `GET`
**功能描述**: 查询 BNB 原生币交易记录

**支持入参**:
```typescript
{
  // 无固定参数
  // 支持任意参数对象，会透传给后端查询逻辑
  // 常用可选参数：
  from_addresses?: string,      // 发送地址列表
  to_addresses?: string,        // 接收地址列表
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号
  min_amount?: string,          // 最小金额（wei）
  max_amount?: string,          // 最大金额（wei）
  limit?: number,               // 限制数量
  offset?: number,              // 偏移量

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/transactions/bnb?min_block_num=30000000&limit=50
```

---

## 5. 接收者黑名单 API

### 5.1 添加接收者到黑名单
**接口路径**: `/api/receiver-blacklist`
**HTTP 方法**: `POST`
**功能描述**: 添加接收者到黑名单，用于交易过滤

**支持入参**:
```typescript
{
  to_address: string,       // 必填，接收者地址
  data_source: string,      // 必填，数据来源标识
  tag?: string,             // 可选，标签

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/receiver-blacklist
Content-Type: application/json

{
  "to_address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "data_source": "erc20_events",
  "tag": "suspicious_receiver"
}
```

### 5.2 删除接收者黑名单
**接口路径**: `/api/receiver-blacklist`
**HTTP 方法**: `DELETE`
**功能描述**: 删除接收者黑名单

**支持入参**:
```typescript
{
  to_address: string,       // 必填，接收者地址
  data_source: string,      // 必填，数据来源标识

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
DELETE /api/receiver-blacklist
Content-Type: application/json

{
  "to_address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "data_source": "erc20_events"
}
```

### 5.3 批量删除接收者黑名单
**接口路径**: `/api/receiver-blacklist/batch`
**HTTP 方法**: `POST`
**功能描述**: 批量删除接收者黑名单

**支持入参**:
```typescript
{
  addresses: Array<{        // 必填，地址对象数组
    to_address: string,     // 接收者地址
    data_source: string,    // 数据来源
    tag?: string            // 可选，标签
  }>,

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/receiver-blacklist/batch
Content-Type: application/json

{
  "addresses": [
    {
      "to_address": "0x123...abc",
      "data_source": "erc20_events",
      "tag": "spam1"
    },
    {
      "to_address": "0x456...def",
      "data_source": "erc20_events",
      "tag": "spam2"
    }
  ]
}
```

### 5.4 获取接收者黑名单
**接口路径**: `/api/receiver-blacklist`
**HTTP 方法**: `GET`
**功能描述**: 获取接收者黑名单列表，支持分页

**支持入参**:
```typescript
{
  to_address?: string,      // 可选，接收者地址（精确匹配）
  data_source?: string,     // 可选，数据来源（精确匹配）

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,            // 页码
  limit?: number,           // 每页数量
  offset?: number,          // 偏移量
  sort?: string,            // 排序字段
  order?: 'asc'|'desc',     // 排序方向
  tag?: string              // 标签过滤
}
```

**请求示例**:
```bash
GET /api/receiver-blacklist?data_source=erc20_events&limit=50&page=1
```

**返回数据**:
```typescript
{
  code: 200,
  message: "success",
  data: {
    total: 100,
    blacklist: [
      {
        id: 1,
        to_address: "0x123...abc",
        data_source: "erc20_events",
        tag: "spam",
        created_at: "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

## 6. 地址标签管理 API

### 6.1 获取地址标签
**接口路径**: `/api/address-tags`
**HTTP 方法**: `GET`
**功能描述**: 获取地址标签列表，支持按地址或标签过滤

**支持入参**:
```typescript
{
  address?: string,         // 可选，地址（精确匹配）
  tag?: string,             // 可选，标签（精确匹配）
  limit?: number,           // 可选，限制数量（默认1000）
  offset?: number,          // 可选，偏移量

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,            // 页码
  sort?: string,            // 排序字段
  order?: 'asc'|'desc',     // 排序方向
}
```

**请求示例**:
```bash
GET /api/address-tags?address=0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5&limit=100
```

### 6.2 添加地址标签
**接口路径**: `/api/address-tags`
**HTTP 方法**: `POST`
**功能描述**: 为地址添加标签，可添加描述信息

**支持入参**:
```typescript
{
  address: string,          // 必填，地址
  tag: string,              // 必填，标签
  description?: string,     // 可选，描述信息

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/address-tags
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "exchange_wallet",
  "description": "已知交易所钱包地址"
}
```

### 6.3 更新地址标签
**接口路径**: `/api/address-tags`
**HTTP 方法**: `PUT`
**功能描述**: 更新地址标签信息（主要是描述）

**支持入参**:
```typescript
{
  address: string,          // 必填，地址
  tag: string,              // 必填，标签
  description?: string,     // 可选，描述信息

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
PUT /api/address-tags
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "exchange_wallet",
  "description": "更新：已知 Binance 交易所热钱包"
}
```

### 6.4 删除地址标签
**接口路径**: `/api/address-tags`
**HTTP 方法**: `DELETE`
**功能描述**: 删除地址标签（通过地址和标签组合）

**支持入参**:
```typescript
{
  address: string,          // 必填，地址
  tag: string,              // 必填，标签

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
DELETE /api/address-tags
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
  "tag": "exchange_wallet"
}
```

### 6.5 批量添加地址标签
**接口路径**: `/api/address-tags/batch`
**HTTP 方法**: `POST`
**功能描述**: 批量为多个地址添加相同标签

**支持入参**:
```typescript
{
  addresses: string[],      // 必填，地址数组
  tag: string,              // 必填，标签
  description?: string,     // 可选，描述信息

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/address-tags/batch
Content-Type: application/json

{
  "addresses": [
    "0x123...abc",
    "0x456...def",
    "0x789...ghi"
  ],
  "tag": "exchange_wallet",
  "description": "已知交易所钱包地址"
}
```

### 6.6 获取唯一标签列表
**接口路径**: `/api/address-tags/unique`
**HTTP 方法**: `GET`
**功能描述**: 获取所有唯一标签列表，不含重复

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  limit?: number,           // 限制返回数量
  sort?: string,            // 排序字段
  order?: 'asc'|'desc',     // 排序方向
}
```

**请求示例**:
```bash
GET /api/address-tags/unique?limit=100&order=asc
```

---

## 7. ERC-20 事件 API

### 7.1 查询 ERC-20 事件
**接口路径**: `/api/erc20-events/query`
**HTTP 方法**: `GET`
**功能描述**: 查询 ERC-20 代币转账事件，支持多条件过滤

**支持入参**:
```typescript
{
  // 地址过滤（支持多个，用逗号分隔）
  contract_addresses?: string,  // 合约地址列表
  from_addresses?: string,      // 发送地址列表
  to_addresses?: string,        // 接收地址列表

  // 区块范围
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号

  // 金额过滤（wei 格式字符串）
  min_amount?: string,          // 最小金额（wei）

  // 分页
  limit?: number,               // 返回记录数限制（默认1000）

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  offset?: number,              // 偏移量
  sort?: string,                // 排序字段
  order?: 'asc'|'desc',         // 排序方向
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间
  max_amount?: string,          // 最大金额（wei）
}
```

**请求示例**:
```bash
GET /api/erc20-events/query?contract_addresses=0x55d398326f99059ff775485246999027b3197955&from_addresses=0x123...abc,0x456...def&min_block_num=30000000&limit=100
```

### 7.2 获取 ERC-20 事件数量
**接口路径**: `/api/erc20-events/count`
**HTTP 方法**: `GET`
**功能描述**: 获取 ERC-20 事件总数（不返回具体记录）

**支持入参**:
```typescript
{
  // 同 /api/erc20-events/query
  contract_addresses?: string,  // 合约地址列表
  from_addresses?: string,      // 发送地址列表
  to_addresses?: string,        // 接收地址列表
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号
  min_amount?: string,          // 最小金额（wei）
  max_amount?: string,          // 最大金额（wei）
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/erc20-events/count?contract_addresses=0x55d398326f99059ff775485246999027b3197955&from_addresses=0x123...abc
```

### 7.3 获取 ERC-20 事件统计
**接口路径**: `/api/erc20-events/stats`
**HTTP 方法**: `GET`
**功能描述**: 获取 ERC-20 事件统计信息（汇总数据）

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  contract_addresses?: string,  // 合约地址列表
  from_addresses?: string,      // 发送地址列表
  to_addresses?: string,        // 接收地址列表
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号
  period?: string,              // 统计周期
}
```

**请求示例**:
```bash
GET /api/erc20-events/stats?contract_addresses=0x55d398326f99059ff775485246999027b3197955&period=24h
```

---

## 8. 代币管理 API

### 8.1 获取所有代币
**接口路径**: `/api/tokens`
**HTTP 方法**: `GET`
**功能描述**: 获取代币列表，支持按合约、链和验证状态过滤

**支持入参**:
```typescript
{
  contract_address?: string,    // 可选，合约地址（精确匹配）
  chain_id?: number,            // 可选，链ID（56=BSC, 1=Ethereum, 137=Polygon）
  verified?: boolean,           // 可选，验证状态（true=已验证，false=未验证）
  format?: string,              // 可选，返回格式（如: 'csv' 用于导出）

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,                // 页码
  limit?: number,               // 每页数量
  offset?: number,              // 偏移量
  sort?: string,                // 排序字段
  order?: 'asc'|'desc',         // 排序方向
  search?: string,              // 搜索关键词（合约名或符号）
}
```

**请求示例**:
```bash
GET /api/tokens?chain_id=56&verified=true&limit=20&page=1
```

### 8.2 添加代币
**接口路径**: `/api/tokens`
**HTTP 方法**: `POST`
**功能描述**: 添加新代币到管理系统

**支持入参**:
```typescript
{
  token_contract: string,       // 必填，代币合约地址（以太坊地址格式）
  token_symbol: string,         // 必填，代币符号（如：USDT, BNB）
  token_name: string,           // 必填，代币全名（如：Tether USD, Binance Coin）
  token_decimals: number,       // 必填，小数位数（0-255）
  chain_id: number,             // 必填，链ID（56=BSC, 1=Ethereum, 137=Polygon）
  is_verified?: boolean,        // 可选，是否已验证（默认false）

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/tokens
Content-Type: application/json

{
  "token_contract": "0x55d398326f99059ff775485246999027b3197955",
  "token_symbol": "USDT",
  "token_name": "Tether USD",
  "token_decimals": 18,
  "chain_id": 56,
  "is_verified": true
}
```

### 8.3 获取单个代币
**接口路径**: `/api/tokens/{contract}/{chain}`
**HTTP 方法**: `GET`
**功能描述**: 获取指定代币的详细信息

**路径参数**:
```typescript
{
  contract: string,             // 必填，合约地址（路径参数）
  chain: number                 // 必填，链ID（路径参数）
}
```

**支持入参**:
```typescript
{
  // 无额外参数
  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/tokens/0x55d398326f99059ff775485246999027b3197955/56
```

### 8.4 更新代币
**接口路径**: `/api/tokens/{contract}/{chain}`
**HTTP 方法**: `PUT`
**功能描述**: 更新代币信息（符号、名称、小数位、验证状态）

**路径参数**:
```typescript
{
  contract: string,             // 必填，合约地址（路径参数）
  chain: number                 // 必填，链ID（路径参数）
}
```

**支持入参**:
```typescript
{
  token_symbol?: string,        // 可选，代币符号
  token_name?: string,          // 可选，代币名称
  token_decimals?: number,      // 可选，小数位数
  is_verified?: boolean,        // 可选，是否验证

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
PUT /api/tokens/0x55d398326f99059ff775485246999027b3197955/56
Content-Type: application/json

{
  "token_symbol": "USDT",
  "is_verified": true
}
```

### 8.5 删除代币
**接口路径**: `/api/tokens/{contract}/{chain}`
**HTTP 方法**: `DELETE`
**功能描述**: 删除代币（从管理系统中移除）

**路径参数**:
```typescript
{
  contract: string,             // 必填，合约地址（路径参数）
  chain: number                 // 必填，链ID（路径参数）
}
```

**支持入参**:
```typescript
{
  // 无额外参数
  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
DELETE /api/tokens/0x55d398326f99059ff775485246999027b3197955/56
```

### 8.6 按链获取代币
**接口路径**: `/api/tokens/by-chain/{chain}`
**HTTP 方法**: `GET`
**功能描述**: 按链ID获取代币列表

**路径参数**:
```typescript
{
  chain: number                 // 必填，链ID（路径参数）
}
```

**支持入参**:
```typescript
{
  verified?: boolean,           // 可选，验证状态过滤

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  page?: number,                // 页码
  limit?: number,               // 每页数量
  offset?: number,              // 偏移量
  sort?: string,                // 排序字段
  order?: 'asc'|'desc',         // 排序方向
}
```

**请求示例**:
```bash
GET /api/tokens/by-chain/56?verified=true&limit=50&page=1
```

### 8.7 更新代币验证状态
**接口路径**: `/api/tokens/{contract}/{chain}/verify`
**HTTP 方法**: `PUT`
**功能描述**: 单独更新代币验证状态

**路径参数**:
```typescript
{
  contract: string,             // 必填，合约地址（路径参数）
  chain: number                 // 必填，链ID（路径参数）
}
```

**支持入参**:
```typescript
{
  is_verified: boolean,         // 必填，验证状态

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
PUT /api/tokens/0x55d398326f99059ff775485246999027b3197955/56/verify
Content-Type: application/json

{
  "is_verified": true
}
```

---

## 9. 批量转账 API

### 9.1 查询批量转账
**接口路径**: `/api/batch-transfers/query`
**HTTP 方法**: `GET`
**功能描述**: 查询批量转账记录，支持多维度过滤

**支持入参**:
```typescript
{
  // 交易哈希过滤
  tx_hashes?: string,           // 交易哈希列表（逗号分隔）

  // 地址过滤
  from_addresses?: string,      // 发送地址列表（逗号分隔）
  to_addresses?: string,        // 接收地址列表（逗号分隔）

  // 代币过滤
  token_contracts?: string,     // 代币合约列表（逗号分隔）
  token_types?: string[],       // 代币类型数组（'NATIVE'=BNB, 'ERC20'=ERC20代币）

  // 函数过滤
  function_names?: string,      // 函数名称列表（逗号分隔）

  // 金额范围（wei 格式字符串）
  min_amount?: string,          // 最小金额
  max_amount?: string,          // 最大金额

  // 区块范围
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号

  // 分页
  limit?: number,               // 返回记录数限制（默认100）

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  offset?: number,              // 偏移量
  sort?: string,                // 排序字段
  order?: 'asc'|'desc',         // 排序方向
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间
}
```

**请求示例**:
```bash
GET /api/batch-transfers/query?from_addresses=0x123...abc&token_types=NATIVE,ERC20&min_block_num=30000000&limit=100
```

### 9.2 获取批量转账数量
**接口路径**: `/api/batch-transfers/count`
**HTTP 方法**: `GET`
**功能描述**: 获取批量转账记录总数（不返回具体数据）

**支持入参**:
```typescript
{
  // 同 /api/batch-transfers/query
  tx_hashes?: string,           // 交易哈希列表
  from_addresses?: string,      // 发送地址列表
  to_addresses?: string,        // 接收地址列表
  token_contracts?: string,     // 代币合约列表
  token_types?: string[],       // 代币类型数组
  function_names?: string,      // 函数名称列表
  min_amount?: string,          // 最小金额
  max_amount?: string,          // 最大金额
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/batch-transfers/count?from_addresses=0x123...abc&min_block_num=30000000
```

### 9.3 获取批量转账统计
**接口路径**: `/api/batch-transfers/stats`
**HTTP 方法**: `GET`
**功能描述**: 获取批量转账统计信息（汇总数据）

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  start_block?: number,         // 开始区块
  end_block?: number,           // 结束区块
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间
  token_types?: string[],       // 代币类型过滤
  function_names?: string,      // 函数名称过滤
}
```

**请求示例**:
```bash
GET /api/batch-transfers/stats?start_block=30000000&end_block=30001000
```

**返回数据**:
```typescript
{
  code: 200,
  message: "success",
  data: {
    total_batch_transactions: 1000,
    total_transfer_records: 50000,
    avg_records_per_batch: 50,
    max_batch_size: 200,
    top_function: "transfer",
    top_function_count: 800
  }
}
```

---

## 10. 内部交易 API

### 10.1 获取内部交易
**接口路径**: `/api/account/txlistinternal`
**HTTP 方法**: `GET`
**功能描述**: 获取地址的内部交易列表（Message Call 类型交易）

**支持入参**:
```typescript
{
  // API 标准参数
  module?: string,              // 可选，模块（默认 'account'）
  action?: string,              // 可选，动作（默认 'txlistinternal'）

  // 地址过滤
  address?: string,             // 可选，目标地址

  // 区块范围
  startblock?: number,          // 可选，开始区块（默认 latest-10000）
  endblock?: number,            // 可选，结束区块（默认 latest）

  // 分页
  page?: number,                // 可选，页码（默认1）
  offset?: number,              // 可选，每页数量（默认10，最大1000）

  // 排序
  sort?: 'asc'|'desc',          // 可选，排序方向（默认 'desc'）

  // 自定义过滤条件
  min_block_txs?: number,       // 可选，最小区块交易数
  min_subcalls?: number,        // 可选，最小子调用数

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/account/txlistinternal?module=account&action=txlistinternal&address=0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5&startblock=30000000&endblock=30001000&page=1&offset=100&sort=desc
```

**返回数据**:
```typescript
{
  code: 200,
  message: "OK",
  data: {
    message: "OK",
    page: 1,
    page_size: 100,
    result: [
      {
        blockNumber: "30000001",
        contractAddress: "0x123...abc",
        errCode: "",
        from: "0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5",
        gas: "100000",
        gasUsed: "50000",
        hash: "0xabc...123",
        input: "0x1234...abcd",
        isError: "0",
        timeStamp: "1704067200",
        to: "0x456...def",
        traceId: "trace_001",
        type: "call",
        value: "1000000000000000000"
      }
    ],
    status: "1",
    total: 1000,
    total_pages: 10
  }
}
```

---

## 11. USDT 监控 API

### 11.1 获取 USDT 收据
**接口路径**: `/api/usdt-monitor/receipts`
**HTTP 方法**: `GET`
**功能描述**: 获取 USDT 稳定币转账收据列表

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意参数对象，会透传给后端查询逻辑
  // 常用可选参数：
  from_addresses?: string,      // 发送地址列表
  to_addresses?: string,        // 接收地址列表
  min_block_num?: number,       // 最小区块号
  max_block_num?: number,       // 最大区块号
  min_amount?: string,          // 最小金额（wei）
  max_amount?: string,          // 最大金额（wei）
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间
  limit?: number,               // 限制数量
  offset?: number,              // 偏移量

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/usdt-monitor/receipts?from_addresses=0x123...abc&limit=100&offset=0
```

### 11.2 获取 USDT 目标
**接口路径**: `/api/usdt-monitor/targets`
**HTTP 方法**: `GET`
**功能描述**: 获取 USDT 监控目标列表

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意参数对象，会透传给后端查询逻辑
  // 常用可选参数：
  address?: string,             // 监控地址
  tag?: string,                 // 标签
  min_value?: string,           // 最小值
  max_value?: string,           // 最大值
  limit?: number,               // 限制数量
  page?: number,                // 页码

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/usdt-monitor/targets?limit=50&page=1
```

### 11.3 获取 USDT 发送者组统计
**接口路径**: `/api/usdt-monitor/receipts/group-by-sender`
**HTTP 方法**: `GET`
**功能描述**: 按发送者分组统计 USDT 转账数据

**支持入参**:
```typescript
{
  // 无必需参数
  // 支持任意参数对象，会透传给后端查询逻辑
  // 常用可选参数：
  period?: string,              // 统计周期（'24h', '7d', '30d'）
  min_amount?: string,          // 最小金额过滤
  start_time?: string,          // 开始时间
  end_time?: string,            // 结束时间
  limit?: number,               // 限制返回数量

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/usdt-monitor/receipts/group-by-sender?period=7d&limit=100
```

### 11.4 添加黑名单地址
**接口路径**: `/api/usdt-monitor/blacklist`
**HTTP 方法**: `POST`
**功能描述**: 批量添加地址到 USDT 监控黑名单

**支持入参**:
```typescript
{
  addresses: string[],          // 必填，地址数组
  reason?: string,              // 可选，添加原因
  created_by?: string,          // 可选，创建者

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
POST /api/usdt-monitor/blacklist
Content-Type: application/json

{
  "addresses": [
    "0x123...abc",
    "0x456...def",
    "0x789...ghi"
  ],
  "reason": "异常转账行为",
  "created_by": "system_admin"
}
```

### 11.5 移除黑名单地址
**接口路径**: `/api/usdt-monitor/blacklist`
**HTTP 方法**: `DELETE`
**功能描述**: 批量移除黑名单地址

**支持入参**:
```typescript
{
  addresses: string[],          // 必填，地址数组

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
DELETE /api/usdt-monitor/blacklist
Content-Type: application/json

{
  "addresses": [
    "0x123...abc",
    "0x456...def"
  ]
}
```

### 11.6 获取黑名单
**接口路径**: `/api/usdt-monitor/blacklist`
**HTTP 方法**: `GET`
**功能描述**: 获取 USDT 监控黑名单列表

**支持入参**:
```typescript
{
  page?: number,                // 可选，页码（默认1）
  limit?: number,               // 可选，每页数量（默认20）
  address?: string,             // 可选，地址筛选（模糊匹配）

  // 支持任意自定义参数（options），通过 ...options 透传
  // 示例：
  sort?: string,                // 排序字段
  order?: 'asc'|'desc',         // 排序方向
  reason?: string,              // 原因过滤
  created_by?: string,          // 创建者过滤
}
```

**请求示例**:
```bash
GET /api/usdt-monitor/blacklist?page=1&limit=50&order=desc
```

### 11.7 检查黑名单状态
**接口路径**: `/api/usdt-monitor/blacklist/check`
**HTTP 方法**: `GET`
**功能描述**: 检查单个地址是否在黑名单中

**支持入参**:
```typescript
{
  address: string,              // 必填，要检查的地址

  // 支持任意自定义参数（options），通过 ...options 透传
}
```

**请求示例**:
```bash
GET /api/usdt-monitor/blacklist/check?address=0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5
```

---

## 📝 通用说明

### 请求头设置
所有 POST/PUT 请求必须包含以下请求头：
```bash
Content-Type: application/json
```

### 身份验证
项目预留了身份验证机制，但当前代码中已注释：
```javascript
// config.headers['satoken'] = 'Bearer ' + sessionStorage.getItem('satoken')
```

### 错误处理
所有接口应返回统一格式：
```typescript
{
  code: number,        // 状态码（200=成功）
  message: string,     // 消息
  data?: any           // 数据（可选）
}
```

### 金额单位
- 金额参数（如 `min_amount`, `max_amount`, `min_value`, `max_value`）使用 **wei** 作为单位（字符串格式）
- 前端代码中会自动转换：如输入 "100" 会转换为 "100000000000000000000"（×10^18）

### 时间格式
- 时间戳：Unix 时间戳（秒）或 ISO 8601 格式
- 推荐使用：`2024-01-01T00:00:00Z` 格式

### 地址格式
- 所有地址使用 **以太坊地址格式**：`0x` 开头 + 40位十六进制字符
- 示例：`0x742d35Cc6634C0532925a3b8D4E9F4F7b5b5c5c5`

### 链 ID
- BSC Mainnet: `56`
- Ethereum Mainnet: `1`
- Polygon: `137`

---

## 🔗 相关链接

- [以太坊地址格式说明](https://ethereum.org/en/developers/docs/accounts/)
- [Wei 与 Ether 单位换算](https://www.investopedia.com/terms/w/wei.asp)
- [BSC Scan](https://bscscan.com/)
- [ERC-20 标准](https://eips.ethereum.org/EIPS/eip-20)

---

**文档版本**: v1.0
**最后更新**: 2024-12-07
**维护者**: BSC Monitor 开发团队
