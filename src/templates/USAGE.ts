/**
 * Template Renderer Usage Guide
 * 
 * This file demonstrates how to use the new template renderer
 * with Prisma-based notification templates
 */

import { TemplateRenderer, TemplateManager, TemplateVariables, PrismaTemplate } from './index';

/**
 * Example 1: Rendering a template from Prisma
 */
export function exampleRenderPrismaTemplate() {
  // This would come from your database (Prisma)
  const emailTemplate: PrismaTemplate = {
    id: '1',
    name: 'Default Email Notification',
    type: 'email',
    subject: '⏰ Reminder: {{routineName}} starting in {{minutesBefore}} minutes',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>{{routineName}}</h1>
  <p>Starting in {{minutesBefore}} minutes</p>
  <p>Time: {{startTime}} - {{endTime}}</p>
</body>
</html>`,
    keys: JSON.stringify(['routineName', 'minutesBefore', 'startTime', 'endTime']),
    isDefault: true,
  };

  // Define variables to interpolate
  const variables: TemplateVariables = {
    routineName: 'Morning Workout',
    minutesBefore: '15',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
  };

  // Render the template
  const rendered = TemplateRenderer.renderFromTemplate(emailTemplate, variables);

  console.log('Subject:', rendered.subject);
  // Output: Subject: ⏰ Reminder: Morning Workout starting in 15 minutes

  console.log('HTML:', rendered.html);
  // Output: HTML with all {{variables}} replaced with actual values

  console.log('Text:', rendered.text);
  // Output: Plain text version of the email
}

/**
 * Example 2: Using TemplateManager for validation and preview
 */
export function exampleTemplateManager() {
  const template: PrismaTemplate = {
    id: '2',
    name: 'Wake Up Reminder',
    type: 'email',
    subject: '🌅 Good Morning!',
    body: 'Your routine {{routineName}} starts at {{startTime}}',
    keys: JSON.stringify(['routineName', 'startTime', 'endTime']),
    isDefault: false,
  };

  const variables: TemplateVariables = {
    routineName: 'Wake up',
    startTime: '09:00 AM',
    // Missing endTime on purpose
  };

  // Validate variables
  const validation = TemplateManager.validateVariables(template, variables);
  console.log('Valid:', validation.valid);
  // Output: Valid: false
  console.log('Missing:', validation.missing);
  // Output: Missing: ['endTime']

  // Get sample variables
  const samples = TemplateManager.getSampleVariables(template);
  console.log('Sample variables:', samples);
  // Output: { routineName: 'Morning Workout', startTime: '09:00 AM', endTime: '10:00 AM' }

  // Preview template
  const preview = TemplateManager.preview(template);
  console.log('Preview:', preview);
  // Output: { subject: '🌅 Good Morning!', preview: '...' }

  // Get stats
  const stats = TemplateManager.getStats(template);
  console.log('Stats:', stats);
  // Output: { charCount: 123, keyCount: 3, type: 'email' }
}

/**
 * Example 3: SMS Template
 */
export function exampleSMSTemplate() {
  const smsTemplate: PrismaTemplate = {
    id: '3',
    name: 'Default SMS Notification',
    type: 'sms',
    body: '⏰ {{routineName}} starts in {{minutesBefore}} min ({{startTime}}-{{endTime}})',
    keys: JSON.stringify(['routineName', 'minutesBefore', 'startTime', 'endTime']),
    isDefault: true,
  };

  const variables: TemplateVariables = {
    routineName: 'Workout',
    minutesBefore: '15',
    startTime: '09:00',
    endTime: '10:00',
  };

  const rendered = TemplateRenderer.renderFromTemplate(smsTemplate, variables);
  console.log('SMS:', rendered.text);
  // Output: ⏰ Workout starts in 15 min (09:00-10:00)
}

/**
 * Example 4: Integration with Prisma Query
 * 
 * This is how you would use it in your actual code:
 */
export async function examplePrismaIntegration() {
  // Assuming you have a PrismaClient instance
  // import { PrismaClient } from '@prisma/client'
  // const prisma = new PrismaClient()

  // 1. Fetch template from database
  // const template = await prisma.notificationTemplate.findUnique({
  //   where: { name: 'Default Email Notification' }
  // })

  // 2. Prepare variables from routine
  // const routine = await prisma.routine.findUnique({
  //   where: { id: routineId }
  // })

  const variables: TemplateVariables = {
    routineName: 'Beach workout', // from routine.name
    minutesBefore: '10', // from notification.minutesBefore
    startTime: '09:15 AM', // from routine.start formatted
    endTime: '10:00 AM', // from routine.end formatted
  };

  // 3. Render template
  // const rendered = TemplateManager.render(template, variables)

  // 4. Send email/SMS with rendered content
  // await emailOrchestrator.send({
  //   to: notificationPreference.recipient,
  //   subject: rendered.subject,
  //   html: rendered.html,
  //   text: rendered.text
  // })
}

/**
 * Template Variable Interpolation Rules
 * 
 * - Variables are defined with {{variableName}} syntax
 * - Variable names must start with a letter or underscore
 * - Variable names can contain letters, numbers, and underscores
 * - Invalid variables are left as-is if not found in the variables object
 * - Examples:
 *   - {{routineName}} ✓
 *   - {{start_time}} ✓
 *   - {{minute_before}} ✓
 *   - {{123invalid}} ✗ (starts with number)
 *   - {{route-name}} ✗ (contains hyphen)
 * 
 * Supported Variables (from seed script):
 * - routineName: Name of the routine/schedule
 * - minutesBefore: Number of minutes before the routine starts
 * - startTime: Start time of the routine
 * - endTime: End time of the routine
 * - Any custom variables can be added as needed
 */

/**
 * Tips for Creating Templates
 * 
 * 1. HTML Email Templates:
 *    - Include proper DOCTYPE and meta tags
 *    - Use inline CSS for email client compatibility
 *    - Test with different email clients
 *    - Keep file size reasonable (rendered emails)
 * 
 * 2. SMS Templates:
 *    - Keep under 160 characters for single SMS segment
 *    - Use abbreviations when needed
 *    - Focus on essential information
 *    - Emojis count as multiple characters
 * 
 * 3. Variable Substitution:
 *    - Always include {{variables}} in curly braces
 *    - Variable names are case-sensitive
 *    - Test with sample variables before deploying
 * 
 * 4. Database Templates:
 *    - Use 'keys' field to define required variables
 *    - Store as JSON stringified array: JSON.stringify(['routineName', 'startTime'])
 *    - Enables validation before rendering
 */
