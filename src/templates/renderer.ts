import { PrismaTemplateRenderer } from './renderer/prisma-renderer';
import { LegacyTemplateRenderer } from './renderer/legacy-renderer';
import { TemplateData, PrismaTemplate, TemplateVariables, RenderedTemplate } from './types';

/**
 * Main TemplateRenderer class
 * Routes to appropriate renderer based on template type
 * 
 * Prefer using PrismaTemplateRenderer with Prisma templates
 */
export class TemplateRenderer {
  /**
   * Render Prisma-based template with variable interpolation
   * Recommended approach - use templates from database
   */
  static renderFromTemplate(template: PrismaTemplate, variables: TemplateVariables): RenderedTemplate {
    return PrismaTemplateRenderer.render(template, variables);
  }

  /**
   * Render template based on notification type
   * Legacy method - for backward compatibility
   * Deprecated: Use Prisma templates instead
   */
  static render(data: TemplateData): RenderedTemplate {
    return LegacyTemplateRenderer.render(data);
  }

  /**
   * Get template format information
   */
  static getTemplateFormats(): Record<string, { format: string; description: string }> {
    return {
      email: {
        format: 'HTML/MIME',
        description: 'Rendered as HTML email with fallback plain text',
      },
      sms: {
        format: 'Plain Text',
        description: 'Plain text limited to 160 characters per segment',
      },
      push: {
        format: 'JSON',
        description: 'JSON object with title and message',
      },
    };
  }
}

export default TemplateRenderer;
