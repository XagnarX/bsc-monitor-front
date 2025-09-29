import { Message } from '@arco-design/web-vue'

/**
 * Universal clipboard copy function with fallback support
 * Works in both secure (HTTPS/localhost) and insecure contexts
 */
export const copyToClipboard = async (text: string, successMessage = '已复制', errorMessage = '复制失败') => {
  try {
    // Check if clipboard API is available and we're in a secure context
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      Message.success(successMessage)
    } else {
      // Fallback for insecure contexts or browsers without clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      textarea.style.top = '-999999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (successful) {
        Message.success(successMessage)
      } else {
        throw new Error('execCommand failed')
      }
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err)
    Message.error(errorMessage)
  }
}