export interface EmailProvider {
  name: string;
  send(to: string, subject: string, text: string, html: string): Promise<void>;
}
