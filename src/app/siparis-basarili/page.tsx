import StoreHeader from "@/components/StoreHeader";
import StoreFooter from "@/components/StoreFooter";
import OrderSuccessContent from "@/components/OrderSuccessContent";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <StoreHeader />
      <OrderSuccessContent orderNo={params.order || ""} />
      <StoreFooter />
    </>
  );
}
