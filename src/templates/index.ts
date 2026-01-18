export { TemplateRenderer, default as defaultTemplateRenderer } from './renderer';
export { TemplateManager, default as defaultTemplateManager } from './template-manager';
export {
  PrismaTemplateRenderer,
  LegacyTemplateRenderer,
  escapeHtml,
  stripHtmlTags,
  interpolateTemplate,
  validateSmsLength,
  truncateSmsIfNeeded,
} from './renderer/index';
export {
  TemplateData,
  PrismaTemplate,
  TemplateVariables,
  RenderedTemplate,
  EmailTemplate,
  SMSTemplate,
  PushTemplate,
} from './types';
