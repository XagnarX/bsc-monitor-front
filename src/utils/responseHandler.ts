/**
 * 通用的 API 响应处理工具函数
 * 用于适配不同的响应数据结构
 */

/**
 * 解析 API 响应数据，支持多种数据结构
 * @param response - API 响应对象
 * @param dataKey - 期望的数据字段名（如: 'events', 'transactions', 'records'）
 * @returns 解析后的数据数组
 */
export function parseApiResponse(response: any, dataKey: string = 'data'): any[] {
  console.log('完整响应:', response) // 调试日志

  // 多种数据结构适配
  if (response?.data?.[dataKey]) {
    // 结构1: { data: { [dataKey]: [...] } }
    console.log(`使用结构1: data.${dataKey}`)
    return response.data[dataKey]
  } else if (response?.[dataKey]) {
    // 结构2: { [dataKey]: [...] }
    console.log(`使用结构2: ${dataKey}`)
    return response[dataKey]
  } else if (Array.isArray(response?.data)) {
    // 结构3: { data: [...] }
    console.log('使用结构3: data (数组)')
    return response.data
  } else if (Array.isArray(response)) {
    // 结构4: 直接返回数组
    console.log('使用结构4: 直接数组')
    return response
  } else if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    // 结构5: { data: { ... } } - 可能是分页结构
    console.log('使用结构5: data (对象)')
    // 尝试常见的分页字段
    if (response.data.list) return response.data.list
    if (response.data.items) return response.data.items
    if (response.data.rows) return response.data.rows
    if (response.data.results) return response.data.results
  }

  console.warn('未识别响应结构，返回空数组')
  return []
}

/**
 * 提取错误消息
 * @param error - 错误对象
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message
  } else if (error.response?.data?.msg) {
    return error.response.data.msg
  } else if (error.message) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  } else {
    return '未知错误'
  }
}
