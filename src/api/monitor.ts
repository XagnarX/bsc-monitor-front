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
