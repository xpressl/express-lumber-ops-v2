"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  role: string | null;
}

interface ContactsPanelProps {
  customerId: string;
  contacts: Contact[];
}

export function ContactsPanel({ contacts }: ContactsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contacts ({contacts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contacts</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.firstName} {c.lastName}</span>
                    {c.isPrimary && <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">PRIMARY</span>}
                    {c.role && <span className="text-xs text-muted-foreground">{c.role}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {c.email && <span className="text-xs text-muted-foreground font-mono">{c.email}</span>}
                    {c.phone && <span className="text-xs text-muted-foreground font-mono">{c.phone}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
