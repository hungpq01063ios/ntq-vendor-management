import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSystemConfigs } from "@/actions/rate.actions";
import GlobalConfigForm from "@/components/features/rate/GlobalConfigForm";

export default async function RateConfigPage() {
  const session = await auth();
  const isDULeader =
    (session?.user as { role?: string })?.role === "DU_LEADER";

  if (!isDULeader) redirect("/rates");

  const configs = await getSystemConfigs();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Rate Config</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configure global rate calculation parameters.
      </p>
      <GlobalConfigForm configs={configs} />
    </div>
  );
}
