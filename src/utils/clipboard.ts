import { Message } from '@arco-design/web-vue'

/**
 * Universal clipboard copy function with fallback support
 * Works in both secure (HTTPS/localhost) and insecure contexts
 */
export const copyToClipboard = async (text: string, successMessage = '已复制', errorMessage = '复制失败') => {
  try {
    // Method 1: Modern Clipboard API (requires secure context)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      Message.success(successMessage)
      return
    }

    // Method 2: Selection API (more modern than execCommand)
    if (navigator.userAgent && 'clipboard' in navigator) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        textArea.setAttribute('readonly', '')
        document.body.appendChild(textArea)
        
        // Use Selection API
        textArea.select()
        textArea.setSelectionRange(0, text.length)
        
        // @ts-ignore - We know execCommand is deprecated but it's our last resort
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          Message.success(successMessage)
          return
        }
      } catch (fallbackError) {
        console.warn('Selection API fallback failed:', fallbackError)
      }
    }

    // Method 3: Last resort - ask user to copy manually
    if (window.prompt) {
      window.prompt('请手动复制以下内容:', text)
      Message.warning('请手动复制内容')
    } else {
      throw new Error('All clipboard methods failed')
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err)
    Message.error(errorMessage)
  }
}