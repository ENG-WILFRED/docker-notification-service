export interface SmsProvider {
  name: string;
  send(to: string, message: string): Promise<void>;
}
