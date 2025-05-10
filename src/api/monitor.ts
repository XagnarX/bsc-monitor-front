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
  return request<API.TargetPage>('/api/monitor/tags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  })
}
