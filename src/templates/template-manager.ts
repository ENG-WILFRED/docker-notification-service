import logger from '../logger';
import { PrismaTemplateRenderer } from './renderer/prisma-renderer';
import { PrismaTemplate, TemplateVariables, RenderedTemplate } from './types';

/**
 * Template Manager handles Prisma template retrieval and rendering
 * This integrates with the database templates created by the seed script
 */
export class TemplateManager {
  /**
   * Render a template by key/name with variables
   * This would typically be called after fetching from the database
   */
  static render(template: PrismaTemplate, variables: TemplateVariables): RenderedTemplate {
    return PrismaTemplateRenderer.render(template, variables);
  }

  /**
   * Validate template variables against template's required keys
   */
  static validateVariables(template: PrismaTemplate, variables: TemplateVariables): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!template.keys) {
      return { valid: true, missing: [] };
    }

    try {
      const requiredKeys = JSON.parse(template.keys) as string[];

      for (const key of requiredKeys) {
        if (variables[key] === undefined || variables[key] === null) {
          missing.push(key);
        }
      }

      return {
        valid: missing.length === 0,
        missing,
      };
    } catch (error) {
      logger.warn('Failed to parse template keys', {
        source: 'TEMPLATE_MANAGER',
        templateId: template.id,
        error,
      });
      return { valid: true, missing: [] };
    }
  }

  /**
   * Get sample variables for a template
   */
  static getSampleVariables(template: PrismaTemplate): Record<string, string> {
    const samples: Record<string, string> = {
      routineName: 'Morning Workout',
      minutesBefore: '15',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
    };

    if (!template.keys) {
      return samples;
    }

    try {
      const requiredKeys = JSON.parse(template.keys) as string[];
      const result: Record<string, string> = {};

      for (const key of requiredKeys) {
        result[key] = samples[key] || `[${key}]`;
      }

      return result;
    } catch (error) {
      logger.warn('Failed to parse template keys for samples', {
        source: 'TEMPLATE_MANAGER',
        templateId: template.id,
        error,
      });
      return samples;
    }
  }

  /**
   * Format template for preview
   */
  static preview(template: PrismaTemplate): { subject?: string; preview: string } {
    const sampleVars = this.getSampleVariables(template);
    const rendered = this.render(template, sampleVars);

    return {
      subject: rendered.subject,
      preview: template.type === 'email' ? (rendered.text || '') : (rendered.plainText || ''),
    };
  }

  /**
   * Get template statistics
   */
  static getStats(template: PrismaTemplate): { charCount: number; keyCount: number; type: string } {
    let keyCount = 0;
    if (template.keys) {
      try {
        keyCount = (JSON.parse(template.keys) as string[]).length;
      } catch {
        // Ignore parse errors
      }
    }

    return {
      charCount: template.body.length,
      keyCount,
      type: template.type,
    };
  }
}

export default TemplateManager;
