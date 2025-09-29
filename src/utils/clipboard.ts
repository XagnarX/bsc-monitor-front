import { Message } from '@arco-design/web-vue'

/**
 * Universal clipboard copy function with modern API preference
 * Uses hostname mapping to ensure secure context for modern clipboard API
 */
export const copyToClipboard = async (text: string, successMessage = '已复制', errorMessage = '复制失败') => {
  try {
    // Method 1: Modern Clipboard API (preferred in secure contexts)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      Message.success(successMessage)
      return
    }
    
    // Method 2: Fallback using Selection API + execCommand
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    textArea.setAttribute('tabindex', '-1')
    
    document.body.appendChild(textArea)
    
    // Focus and select the text
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, text.length)
    
    // Copy using execCommand
    // @ts-ignore - execCommand is deprecated but needed for fallback
    const successful = document.execCommand('copy')
    
    // Clean up
    document.body.removeChild(textArea)
    
    if (successful) {
      Message.success(successMessage)
    } else {
      throw new Error('Copy command failed')
    }
  } catch (err) {
    console.error('Copy failed:', err)
    // Final fallback - show text in alert for user to copy manually
    alert(`复制内容: ${text}`)
    Message.warning('请手动复制上方内容')
  }
}