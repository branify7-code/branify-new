// =============================================================================
// BRANIFY WHATSAPP CRM — setup panel (database tables not created yet)
// Shows the exact steps + one-click copy of supabase/whatsapp-schema.sql.
// Never fakes data in this state (spec §45).
// =============================================================================
import React, { useState } from 'react';
import { Check, Copy, Database } from 'lucide-react';
import { Btn, Card } from '../ui';
import schemaSql from '../../../supabase/whatsapp-schema.sql?raw';

export const SetupPanel: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard blocked — the file path is shown as fallback
    }
  };
  return (
    <Card className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A45C]/30 bg-[#C9A45C]/10">
          <Database size={18} className="text-[#8F6B2D]" />
        </span>
        <div>
          <h2 className="font-display text-base font-extrabold text-[#111827]">Database setup required</h2>
          <p className="text-xs text-[#5B6B82]">One-time step before the WhatsApp CRM can store conversations.</p>
        </div>
      </div>
      <ol className="mt-4 space-y-2 text-xs leading-relaxed text-[#334155]">
        <li><b>1.</b> Open the Supabase SQL Editor: <span className="font-mono text-[10.5px]">supabase.com/dashboard/project/uspshkegxhrglbpxqtil/sql/new</span></li>
        <li><b>2.</b> Copy the WhatsApp CRM schema (button below, or file <span className="font-mono text-[10.5px]">supabase/whatsapp-schema.sql</span>) and paste it.</li>
        <li><b>3.</b> Run it — it is fully idempotent and creates 9 RLS-protected <span className="font-mono">whatsapp_*</span> tables.</li>
        <li><b>4.</b> Reload this page — the Inbox, Contacts, Leads, Templates, Automations and Analytics unlock automatically.</li>
      </ol>
      <div className="mt-4 flex items-center gap-2">
        <Btn variant="gold" size="sm" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'SQL copied' : 'Copy setup SQL'}
        </Btn>
        <span className="text-[10.5px] text-[#7E8DA6]">Only allowlisted BRANIFY admins can ever read this data (RLS).</span>
      </div>
    </Card>
  );
};
