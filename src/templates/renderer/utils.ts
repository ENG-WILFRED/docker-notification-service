import logger from '../../logger';
import { TemplateVariables } from '../types';

/**
 * Escape HTML special characters to prevent injection
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Strip HTML tags from text to create plain text version
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Interpolate template variables
 * Replaces {{variableName}} with actual values from variables object
 */
export function interpolateTemplate(template: string, variables: TemplateVariables): string {
  let result = template;

  // Replace all {{variable}} patterns
  const regex = /{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g;
  result = result.replace(regex, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) {
      logger.warn('Template variable not found', {
        source: 'TEMPLATE_RENDERER',
        variable: key,
        timestamp: new Date().toISOString(),
      });
      return match; // Return original placeholder if variable not found
    }
    return String(value);
  });

  return result;
}

/**
 * Validate SMS text length (160 character limit for single segment)
 */
export function validateSmsLength(text: string): { valid: boolean; length: number; segments: number } {
  const length = text.length;
  const segments = Math.ceil(length / 160);
  
  return {
    valid: length <= 160,
    length,
    segments,
  };
}

/**
 * Truncate SMS text to fit within segment limit if needed
 */
export function truncateSmsIfNeeded(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
