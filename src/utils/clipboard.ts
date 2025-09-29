import { Message } from '@arco-design/web-vue'

/**
 * Universal clipboard copy function - always works regardless of security context
 * Uses the most reliable method that works everywhere
 */
export const copyToClipboard = async (text: string, successMessage = '已复制', errorMessage = '复制失败') => {
  try {
    // Create invisible textarea element
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
    
    // Copy using execCommand (works in all contexts)
    // @ts-ignore - execCommand is deprecated but universally supported
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