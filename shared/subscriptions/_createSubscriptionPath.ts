import type { SubscriptionMessage } from './_subscriptionMessage'

/*
 * Utility function for generating a subscription path from subscription details
 * Extracted so that they are consistent between server and client
 */
export const createSubscriptionPath = (
  message: Pick<SubscriptionMessage, 'repository' | 'id'>
) => {
  return message.id
    ? `/${message.repository}/${message.id}`
    : `/${message.repository}`
}
