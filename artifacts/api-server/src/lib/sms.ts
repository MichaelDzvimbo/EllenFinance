import { logger } from "./logger";

export async function sendSms(phone: string, message: string): Promise<boolean> {
  logger.info({ phone: phone.slice(0, 6) + "****", message }, "SMS stub — message would be sent");
  return true;
}
