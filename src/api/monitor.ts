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
