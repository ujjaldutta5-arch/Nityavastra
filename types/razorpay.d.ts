declare module "razorpay" {
  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    [key: string]: unknown;
  }

  class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: {
      create: (options: Record<string, unknown>) => Promise<RazorpayOrder>;
    };
    payments: {
      fetch: (paymentId: string) => Promise<Record<string, unknown>>;
      refund: (paymentId: string, options?: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
  }

  export default Razorpay;
}
