import request from '@/request.ts'

export const getAllTargets = async (options?: { [key: string]: any }) => {
  return request<API.TargetPage>('/api/monitor/targets', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  })
}

export const addTarget = async (body: API.Target, options: { [key: string]: any }) => {
  return request('/api/monitor/targets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
export const analysis = async (params: API.AnalysisQuery, options?: { [key: string]: any }) => {
  console.log('1')
  return request<API.AnalysisPage>('/api/monitor/analysis',
    {
      method:'GET',
      params:{
        ...params,
      },
      ...(options || {}),
    })
}
export const analysis2 = async (params: API.AnalysisQuery, options?: { [key: string]: any }) => {
  console.log('2')
  return request<API.AnalysisPage>('/api/monitor2/analysis',
    {
      method:'GET',
      params:{
        ...params,
      },
      ...(options || {}),
    })
}
export const delTarget = async (body:API.DeleteTarget, options?: { [key: string]: any }) => {
  return request('/api/monitor/targets',{
    method:'DELETE',
    headers:{
      'Content-Type': 'application/json',
    },
    data:body,
    ...(options || {}),
  })
}
export const getAllTags = async (options?: { [key: string]: any }) => {
  return request<API.TagPage>('/api/monitor/tags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  })
}

export const queryTagByFromAddress = async (params: API.QueryTag, options?: { [key: string]: any })=>{
  return request<API.TagPage>('/api/monitor/tags/by-address',{
    method:'GET',
    params:{
      ...params
    },
    ...(options || {}),
  })
}

export const getActivityStats = async (params?: any, options?: { [key: string]: any }) => {
  return request('/api/monitor2/activity', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {}),
  })
}

export const getAddressTransactions = async (params: { address: string, period?: string }, options?: { [key: string]: any }) => {
  return request('/api/monitor2/analysis/transactions', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {}),
  })
}

export const deleteActivityAddress = async (body: { address: string, tag?: string }, options?: { [key: string]: any }) => {
  return request('/api/monitor2/activity/blacklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const getPinnedAddresses = async (options?: { [key: string]: any }) => {
  return request<API.PinnedAddressesResponse>('/api/monitor2/activity/pinned', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  })
}

export const addPinnedAddress = async (body: { address: string, tag: string }, options?: { [key: string]: any }) => {
  return request('/api/monitor2/activity/pinned', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const removePinnedAddress = async (body: { address: string, tag: string }, options?: { [key: string]: any }) => {
  return request('/api/monitor2/activity/pinned', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const getTransactions = async (params: any, options?: { [key: string]: any }) => {
  return request('/api/transactions/query', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const addReceiverBlacklist = async (body: { to_address: string, data_source: string, tag?: string }, options?: { [key: string]: any }) => {
  return request('/api/receiver-blacklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const deleteReceiverBlacklist = async (body: { to_address: string, data_source: string }, options?: { [key: string]: any }) => {
  return request('/api/receiver-blacklist', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const batchDeleteReceiverBlacklist = async (body: { addresses: Array<{ to_address: string, data_source: string, tag?: string }> }, options?: { [key: string]: any }) => {
  return request('/api/receiver-blacklist/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const getReceiverBlacklist = async (params?: { to_address?: string, data_source?: string }, options?: { [key: string]: any }) => {
  return request<API.BlacklistPage>('/api/receiver-blacklist', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const getBnbTransactions = async (params: any, options?: { [key: string]: any }) => {
  return request('/api/transactions/bnb', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

// 地址标签管理API
export const getAddressTags = async (params?: { address?: string, tag?: string, limit?: number, offset?: number }, options?: { [key: string]: any }) => {
  return request('/api/address-tags', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const addAddressTag = async (body: { address: string, tag: string, description?: string }, options?: { [key: string]: any }) => {
  return request('/api/address-tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const updateAddressTag = async (body: { address: string, tag: string, description?: string }, options?: { [key: string]: any }) => {
  return request('/api/address-tags', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const deleteAddressTag = async (body: { address: string, tag: string }, options?: { [key: string]: any }) => {
  return request('/api/address-tags', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const batchAddAddressTags = async (body: { addresses: string[], tag: string, description?: string }, options?: { [key: string]: any }) => {
  return request('/api/address-tags/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const getUniqueAddressTags = async (options?: { [key: string]: any }) => {
  return request('/api/address-tags/unique', {
    method: 'GET',
    ...(options || {}),
  })
}

// ERC-20转账事件API
export const getErc20Events = async (params: any, options?: { [key: string]: any }) => {
  return request('/api/erc20-events/query', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const getErc20EventsCount = async (params: any, options?: { [key: string]: any }) => {
  return request('/api/erc20-events/count', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const getErc20EventsStats = async (options?: { [key: string]: any }) => {
  return request('/api/erc20-events/stats', {
    method: 'GET',
    ...(options || {}),
  })
}

// ERC-20代币管理API
export const getAllTokens = async (params?: { contract_address?: string, chain_id?: number, verified?: boolean, format?: string }, options?: { [key: string]: any }) => {
  return request('/api/tokens', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const addToken = async (body: { 
  token_contract: string, 
  token_symbol: string, 
  token_name: string, 
  token_decimals: number, 
  chain_id: number, 
  is_verified?: boolean 
}, options?: { [key: string]: any }) => {
  return request('/api/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const getToken = async (contract: string, chain: number, options?: { [key: string]: any }) => {
  return request(`/api/tokens/${contract}/${chain}`, {
    method: 'GET',
    ...(options || {}),
  })
}

export const updateToken = async (contract: string, chain: number, body: { 
  token_symbol?: string, 
  token_name?: string, 
  token_decimals?: number, 
  is_verified?: boolean 
}, options?: { [key: string]: any }) => {
  return request(`/api/tokens/${contract}/${chain}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const deleteToken = async (contract: string, chain: number, options?: { [key: string]: any }) => {
  return request(`/api/tokens/${contract}/${chain}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

export const getTokensByChain = async (chain: number, params?: { verified?: boolean }, options?: { [key: string]: any }) => {
  return request(`/api/tokens/by-chain/${chain}`, {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const updateTokenVerifyStatus = async (contract: string, chain: number, body: { is_verified: boolean }, options?: { [key: string]: any }) => {
  return request(`/api/tokens/${contract}/${chain}/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

// 批量转账相关接口
export const queryBatchTransfers = async (params: any, options?: { [key: string]: any }) => {
  return request('/api/batch-transfers/query', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const getBatchTransfersCount = async (params: any, options?: { [key: string]: any }) => {
  return request('/api/batch-transfers/count', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const getBatchTransfersStats = async (options?: { [key: string]: any }) => {
  return request('/api/batch-transfers/stats', {
    method: 'GET',
    ...(options || {}),
  })
}

// Internal Transactions API
export const getInternalTransactions = async (params: API.InternalTransactionsQuery, options?: { [key: string]: any }) => {
  return request('/api/account/txlistinternal', {
    method: 'GET',
    params: {
      module: 'account',
      action: 'txlistinternal',
      ...params,
    },
    ...(options || {}),
  })
}

// USDT Monitor API
export const getUsdtReceipts = async (params?: any, options?: { [key: string]: any }) => {
  return request('/api/usdt-monitor/receipts', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const getUsdtTargets = async (params?: any, options?: { [key: string]: any }) => {
  return request('/api/usdt-monitor/targets', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

// USDT sender group statistics API
export const getUsdtSenderGroupStats = async (params?: any, options?: { [key: string]: any }) => {
  return request('/api/usdt-monitor/receipts/group-by-sender', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

// USDT Blacklist Management API
export const addBlacklistAddresses = async (
  body: { addresses: string[], reason?: string, created_by?: string },
  options?: { [key: string]: any }
) => {
  return request('/api/usdt-monitor/blacklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const removeBlacklistAddresses = async (
  body: { addresses: string[] },
  options?: { [key: string]: any }
) => {
  return request('/api/usdt-monitor/blacklist', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}

export const getBlacklist = async (
  params?: { page?: number, limit?: number, address?: string },
  options?: { [key: string]: any }
) => {
  return request('/api/usdt-monitor/blacklist', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}

export const checkBlacklistStatus = async (
  params: { address: string },
  options?: { [key: string]: any }
) => {
  return request('/api/usdt-monitor/blacklist/check', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  })
}
