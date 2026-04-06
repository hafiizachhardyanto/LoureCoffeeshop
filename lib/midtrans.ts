import midtransClient from 'midtrans-client';

const isProduction = process.env.NODE_ENV === 'production';

const snap = new midtransClient.Snap({
  isProduction: isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export async function createTransaction(params: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}): Promise<{ token: string; redirect_url: string } | null> {
  try {
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      item_details: params.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      enabled_payments: ['gopay', 'shopeepay', 'qris'],
    };

    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Midtrans Error:', error);
    return null;
  }
}

export async function checkTransactionStatus(orderId: string): Promise<{
  status: string;
  transaction_status: string;
} | null> {
  try {
    const status = await (snap as any).transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Midtrans Status Error:', error);
    return null;
  }
}