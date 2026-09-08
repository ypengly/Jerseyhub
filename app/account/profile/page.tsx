import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { ProfileForms } from "@/components/account/profile-forms";

export default async function ProfilePage() {
  const user = await requireUser();
  const [fullUser, address] = await Promise.all([
    db.user.findUnique({ where: { id: user.id } }),
    db.address.findFirst({ where: { userId: user.id, isDefault: true } }),
  ]);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-8 font-display text-4xl tracking-wide">PROFILE</h1>
      <ProfileForms
        user={{ name: fullUser?.name ?? "", email: fullUser?.email ?? "", phone: fullUser?.phone ?? "" }}
        address={{
          fullName: address?.fullName ?? "",
          phone: address?.phone ?? "",
          address: address?.address ?? "",
          city: address?.city ?? "",
          country: address?.country ?? "",
          postalCode: address?.postalCode ?? "",
        }}
      />
    </div>
  );
}
