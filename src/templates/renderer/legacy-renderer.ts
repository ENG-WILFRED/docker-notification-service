import logger from '../../logger';
import { TemplateData, RenderedTemplate, EmailTemplate, SMSTemplate, PushTemplate } from '../types';
import { escapeHtml, stripHtmlTags } from './utils';

/**
 * Legacy Template Renderer
 * For backward compatibility - builds templates from TemplateData
 * This should be phased out in favor of Prisma templates
 */
export class LegacyTemplateRenderer {
  /**
   * Render template based on notification type
   * Legacy method - prefer using Prisma templates
   */
  static render(data: TemplateData): RenderedTemplate {
    try {
      switch (data.type) {
        case 'email':
          return this.renderEmail(data);
        case 'sms':
          return this.renderSms(data);
        case 'push':
          return this.renderPush(data);
        default:
          throw new Error(`Unknown notification type: ${data.type}`);
      }
    } catch (error) {
      logger.error('Legacy template rendering error', {
        source: 'TEMPLATE_RENDERER',
        error,
        notificationType: data.type,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Render HTML email template
   */
  private static renderEmail(data: TemplateData): RenderedTemplate {
    const emailTemplate: EmailTemplate = this.buildEmailTemplate(data);

    logger.info('Legacy email template rendered', {
      source: 'TEMPLATE_RENDERER',
      userId: data.userId,
      type: 'email',
      subject: emailTemplate.subject,
      timestamp: new Date().toISOString(),
    });

    return {
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text || stripHtmlTags(emailTemplate.html),
    };
  }

  /**
   * Render SMS text template
   */
  private static renderSms(data: TemplateData): RenderedTemplate {
    const smsTemplate: SMSTemplate = this.buildSmsTemplate(data);

    logger.info('Legacy SMS template rendered', {
      source: 'TEMPLATE_RENDERER',
      userId: data.userId,
      type: 'sms',
      messageLength: smsTemplate.text.length,
      timestamp: new Date().toISOString(),
    });

    return {
      text: smsTemplate.text,
      plainText: smsTemplate.text,
    };
  }

  /**
   * Render push notification template
   */
  private static renderPush(data: TemplateData): RenderedTemplate {
    const pushTemplate: PushTemplate = this.buildPushTemplate(data);

    logger.info('Legacy push template rendered', {
      source: 'TEMPLATE_RENDERER',
      userId: data.userId,
      type: 'push',
      title: pushTemplate.title,
      timestamp: new Date().toISOString(),
    });

    return {
      text: JSON.stringify(pushTemplate),
    };
  }

  /**
   * Build HTML email template
   * Deprecated - use Prisma templates instead
   */
  private static buildEmailTemplate(data: TemplateData): EmailTemplate {
    const { title, message, metadata = {} } = data;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            color: #007bff;
            font-size: 28px;
        }
        .content {
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .metadata {
            background-color: #f9f9f9;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
        .metadata h3 {
            margin: 0 0 10px 0;
            color: #007bff;
            font-size: 14px;
            text-transform: uppercase;
        }
        .metadata-item {
            margin: 5px 0;
            font-size: 13px;
            color: #666;
        }
        .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        .timestamp {
            font-size: 11px;
            color: #aaa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${escapeHtml(title)}</h1>
        </div>
        
        <div class="content">
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        </div>
        
        ${this.buildMetadataSection(metadata)}
        
        <div class="footer">
            <p class="timestamp">Sent on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return {
      subject: title,
      html,
    };
  }

  /**
   * Build SMS text template
   * Deprecated - use Prisma templates instead
   */
  private static buildSmsTemplate(data: TemplateData): SMSTemplate {
    const { title, message, metadata = {} } = data;

    let text = `${title}\n\n${message}`;

    // Add key metadata to SMS (limited space)
    if (Object.keys(metadata).length > 0) {
      const keyData = Object.entries(metadata)
        .slice(0, 2) // Only first 2 items
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');

      if (keyData) {
        text += `\n\n${keyData}`;
      }
    }

    // Ensure SMS is under 160 characters for single segment
    if (text.length > 160) {
      text = text.substring(0, 157) + '...';
    }

    return { text };
  }

  /**
   * Build push notification template
   * Deprecated - use Prisma templates instead
   */
  private static buildPushTemplate(data: TemplateData): PushTemplate {
    const { title, message, metadata = {} } = data;

    return {
      title,
      message,
      badge: (metadata.badge as number) || undefined,
    };
  }

  /**
   * Build HTML metadata section
   */
  private static buildMetadataSection(metadata: Record<string, any>): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return '';
    }

    const items = Object.entries(metadata)
      .map(([key, value]) => {
        const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `<div class="metadata-item"><strong>${escapeHtml(displayKey)}:</strong> ${escapeHtml(displayValue)}</div>`;
      })
      .join('');

    return `
<div class="metadata">
    <h3>Additional Information</h3>
    ${items}
</div>
    `.trim();
  }
}

export default LegacyTemplateRenderer;
