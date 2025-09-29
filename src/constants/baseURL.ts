// 使用 hostname 映射解决跨设备剪贴板权限问题
// 需要在两台设备的 hosts 文件中添加：192.168.31.217 api.local
export const host: string = 'api.local:8080'
export const baseURL: string = `http://${host}/`

// 远程服务器配置（备用）
// export const host: string = 'bscmontiorb.vip.cpolar.cn'
// export const baseURL: string = `https://${host}/`