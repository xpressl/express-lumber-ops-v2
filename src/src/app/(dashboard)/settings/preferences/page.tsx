"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserPreferencesPage() {
  const [prefs, setPrefs] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/users/me/preferences");
      if (res.ok) setPrefs(await res.json());
    })();
  }, []);

  async function updatePref(key: string, value: unknown) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    await fetch("/api/users/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferences"
        description="Customize your workspace"
        breadcrumbs={[{ label: "Settings" }, { label: "Preferences" }]}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Theme</Label>
            <Select value={(prefs["theme"] as string) ?? "dark"} onValueChange={(v) => void updatePref("theme", v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Compact Mode</Label>
            <Switch checked={(prefs["compact"] as boolean) ?? false} onCheckedChange={(v) => void updatePref("compact", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">In-App Notifications</Label>
            <Switch checked={(prefs["notifications_inapp"] as boolean) ?? true} onCheckedChange={(v) => void updatePref("notifications_inapp", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Email Notifications</Label>
            <Switch checked={(prefs["notifications_email"] as boolean) ?? false} onCheckedChange={(v) => void updatePref("notifications_email", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Sound Alerts</Label>
            <Switch checked={(prefs["notifications_sound"] as boolean) ?? true} onCheckedChange={(v) => void updatePref("notifications_sound", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Default Views</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Landing Page</Label>
            <Select value={(prefs["landing_page"] as string) ?? "/command-center"} onValueChange={(v) => void updatePref("landing_page", v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="/command-center">Command Center</SelectItem>
                <SelectItem value="/orders">Orders</SelectItem>
                <SelectItem value="/dispatch">Dispatch</SelectItem>
                <SelectItem value="/yard">Yard</SelectItem>
                <SelectItem value="/collections">Collections</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Records Per Page</Label>
            <Select value={String((prefs["page_size"] as number) ?? 20)} onValueChange={(v) => void updatePref("page_size", Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
