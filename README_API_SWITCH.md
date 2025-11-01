# API 服务器切换说明

## 如何切换服务器

只需要修改 `src/constants/baseURL.ts` 文件的一行代码：

### 使用 localhost（本地开发）
```typescript
export const baseURL = SERVERS.localhost
```

### 使用 api.local（局域网）
```typescript
export const baseURL = SERVERS.apiLocal
```
**注意**：需要在 hosts 文件中添加：`192.168.31.217 api.local`

### 使用远程服务器
```typescript
export const baseURL = SERVERS.remote
```

## 完整示例

打开 `src/constants/baseURL.ts`：

```typescript
const SERVERS = {
  localhost: 'http://localhost:8080/',
  apiLocal: 'http://api.local:8080/',
  remote: 'https://bscmontiorb.vip.cpolar.cn/',
}

// ============================================
// 👇 修改这一行即可切换服务器 👇
// ============================================
export const baseURL = SERVERS.localhost     // ← 当前使用 localhost
// export const baseURL = SERVERS.apiLocal   // ← 改成这个使用 api.local
// export const baseURL = SERVERS.remote     // ← 改成这个使用远程服务器
// ============================================
```

## 切换步骤

1. 修改 `src/constants/baseURL.ts` 的 `export const baseURL = ...` 这一行
2. 重启开发服务器（`Ctrl+C` 停止，然后 `npm run dev`）
3. 完成！所有 API 请求会自动使用新的服务器

## 添加新服务器

在 `SERVERS` 对象中添加新配置：

```typescript
const SERVERS = {
  localhost: 'http://localhost:8080/',
  apiLocal: 'http://api.local:8080/',
  remote: 'https://bscmontiorb.vip.cpolar.cn/',
  custom: 'http://192.168.1.100:3000/',  // ← 新增
}

export const baseURL = SERVERS.custom  // ← 使用新服务器
```
