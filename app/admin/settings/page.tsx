import { getStoreSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-3xl tracking-wide">STORE SETTINGS</h1>
      <SettingsForm
        initial={{
          storeName: settings.storeName,
          telegramUsername: settings.telegramUsername,
          supportEmail: settings.supportEmail,
          shippingFlat: Number(settings.shippingFlat),
          freeShippingOver: Number(settings.freeShippingOver),
        }}
      />
    </div>
  );
}
