import logger from '../../logger';
import { PrismaTemplate, TemplateVariables, RenderedTemplate } from '../types';
import { interpolateTemplate, stripHtmlTags, truncateSmsIfNeeded } from './utils';

/**
 * Prisma Template Renderer
 * Renders database templates with variable interpolation
 */
export class PrismaTemplateRenderer {
  /**
   * Render a Prisma-based template with variable interpolation
   */
  static render(template: PrismaTemplate, variables: TemplateVariables): RenderedTemplate {
    try {
      // Validate template
      if (!template || !template.body) {
        throw new Error('Invalid template: missing body');
      }

      // Log rendering start
      logger.info('Rendering Prisma template', {
        source: 'TEMPLATE_RENDERER',
        templateId: template.id,
        templateName: template.name,
        type: template.type,
        timestamp: new Date().toISOString(),
      });

      switch (template.type) {
        case 'email':
          return this.renderEmail(template, variables);
        case 'sms':
          return this.renderSms(template, variables);
        default:
          throw new Error(`Unknown template type: ${template.type}`);
      }
    } catch (error) {
      logger.error('Template rendering error', {
        source: 'TEMPLATE_RENDERER',
        templateId: template?.id,
        templateName: template?.name,
        error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Render email template
   */
  private static renderEmail(template: PrismaTemplate, variables: TemplateVariables): RenderedTemplate {
    const subject = interpolateTemplate(template.subject || '', variables);
    const html = interpolateTemplate(template.body, variables);
    const text = stripHtmlTags(html);

    logger.info('Email template rendered', {
      source: 'TEMPLATE_RENDERER',
      templateId: template.id,
      templateName: template.name,
      subjectLength: subject.length,
      bodyLength: html.length,
      timestamp: new Date().toISOString(),
    });

    return {
      subject,
      html,
      text,
    };
  }

  /**
   * Render SMS template
   */
  private static renderSms(template: PrismaTemplate, variables: TemplateVariables): RenderedTemplate {
    const text = interpolateTemplate(template.body, variables);
    const finalText = truncateSmsIfNeeded(text);

    logger.info('SMS template rendered', {
      source: 'TEMPLATE_RENDERER',
      templateId: template.id,
      templateName: template.name,
      messageLength: finalText.length,
      segments: Math.ceil(finalText.length / 160),
      timestamp: new Date().toISOString(),
    });

    return {
      text: finalText,
      plainText: finalText,
    };
  }
}

export default PrismaTemplateRenderer;
