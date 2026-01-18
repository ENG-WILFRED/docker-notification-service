import { dbPool } from './pool';
import logger from '../logger';

export interface Template {
  id: string;
  key: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  content: string;
  variables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get template by key
 */
export async function getTemplate(templateKey: string): Promise<Template | null> {
  const sql = 'SELECT * FROM templates WHERE key = $1 LIMIT 1';

  try {
    const result = await dbPool.query(sql, [templateKey]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Failed to get template', {
      source: 'DATABASE',
      error,
      templateKey,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

export default { getTemplate };
