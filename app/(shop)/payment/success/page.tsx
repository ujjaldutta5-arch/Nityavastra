import Link from "next/link";
import { Suspense } from "react";

type SearchParams = { [key: string]: string | string[] | undefined };

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function SuccessInner({ searchParams }: { searchParams: SearchParams }) {
  const order = asString(searchParams?.order);
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-serif text-3xl mb-4 text-[#2A1508]">Order confirmed</h1>
      <p className="text-[#78716C] mb-8">Thank you for shopping with Nityavastra.</p>
      {order && (
        <p className="mb-6 text-sm">
          Order ID: <span className="font-medium">{order}</span>
        </p>
      )}
      <div className="flex justify-center gap-4">
        <Link href="/account" className="text-[#7C1F30] underline">
          View orders
        </Link>
        {order && (
          <Link href={`/invoice/${order}`} className="text-[#7C1F30] underline">
            Invoice
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return (
    <Suspense>
      <SuccessInner searchParams={params} />
    </Suspense>
  );
}
