import { Client, Environment } from 'square';
import { v4 as uuidv4 } from 'uuid';

const { SQUARE_ACCESS_TOKEN } = process.env;

const client = new Client({
  environment: Environment.Sandbox,
  accessToken: SQUARE_ACCESS_TOKEN,
});

export const processPayment = async (sourceId: string, amount: number) => {
  try {
    const response = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: uuidv4(),
      amountMoney: {
        amount: BigInt(amount),
        currency: 'USD',
      },
    });
    return response.result;
  } catch (error) {
    console.error('Payment Error:', error);
    throw new Error('Payment failed');
  }
};
