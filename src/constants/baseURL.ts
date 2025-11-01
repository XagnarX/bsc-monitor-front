/**
 * API Server Configuration
 *
 * Usage: Change the baseURL line below to switch servers
 */

// Available server options
const SERVERS = {
  localhost: 'http://localhost:8080/',
  apiLocal: 'http://api.local:8080/',  // Requires hosts file: 192.168.31.217 api.local
  remote: 'https://bscmontiorb.vip.cpolar.cn/',
}

// ============================================
// 👇 CHANGE THIS LINE TO SWITCH SERVERS 👇
// ============================================
export const baseURL = SERVERS.localhost
// export const baseURL = SERVERS.apiLocal
// export const baseURL = SERVERS.remote
// ============================================

// Log current configuration
if (import.meta.env.DEV) {
  console.log('Current API Server:', baseURL)
}