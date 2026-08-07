import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-serif text-3xl mb-4">Payment cancelled</h1>
      <p className="text-[#78716C] mb-8">Your payment was not completed.</p>
      <Link href="/cart" className="text-[#7C1F30] underline">
        Return to cart
      </Link>
    </div>
  );
}
