"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateProfile, changePassword, upsertAddress } from "@/app/actions/profile-actions";

type UserInfo = { name: string; email: string; phone: string };
type AddressInfo = { fullName: string; phone: string; address: string; city: string; country: string; postalCode: string };

export function ProfileForms({ user, address }: { user: UserInfo; address: AddressInfo }) {
  return (
    <div className="space-y-8">
      <ProfileInfoForm user={user} />
      <PasswordForm />
      <AddressForm address={address} />
    </div>
  );
}

function ProfileInfoForm({ user }: { user: UserInfo }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await updateProfile({ name, phone });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else toast.success("Profile updated");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user.email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await changePassword({ currentPassword: current, newPassword: next });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Password updated");
    setCurrent("");
    setNext("");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Current Password</Label>
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>New Password</Label>
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={loading || !current || !next}>{loading ? "Updating..." : "Update Password"}</Button>
      </CardContent>
    </Card>
  );
}

function AddressForm({ address }: { address: AddressInfo }) {
  const [form, setForm] = useState(address);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof AddressInfo>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    const res = await upsertAddress(form);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else toast.success("Address saved");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Default Shipping Address</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Postal Code</Label>
            <Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
        </div>
        <Button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Save Address"}</Button>
      </CardContent>
    </Card>
  );
}
