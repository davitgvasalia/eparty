"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { shrinkImage } from "@/lib/image";
import { isWallet } from "@/lib/wallet";
import { api, useDistricts, useSession } from "./PollsStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;

function IdPhoto({
  label,
  value,
  onChange,
  removeLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  removeLabel: string;
}) {
  return (
    <div className="text-xs text-slate-500">
      {label}
      {value ? (
        <div className="mt-1 flex items-center gap-3">
          <img src={value} alt="" className="h-24 w-36 rounded-xl object-cover" />
          <button className="btn btn-ghost !px-2 !py-1.5" aria-label={removeLabel} onClick={() => onChange("")}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/*"
          aria-label={label}
          className="input mt-1"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            // Shrunk before upload; a phone photo is several MB otherwise.
            if (file) onChange(await shrinkImage(file, 1400, 0.8));
          }}
        />
      )}
    </div>
  );
}

export default function ApplyForm({ locale, dict }: { locale: Locale; dict: Dict }) {
  const t = dict.apply;
  // No sign-in needed to apply; a connected wallet only pre-fills the address.
  const { wallet: connected, member } = useSession();
  const districts = useDistricts();

  const [wallet, setWallet] = useState("");
  const [nameKa, setNameKa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [idFront, setIdFront] = useState("");
  const [idBack, setIdBack] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // The server answers known problems with a dictionary key (badEmail, alreadyApplied, ...).
  const message = (code: string) => (code in t ? t[code as keyof typeof t] : code);

  useEffect(() => {
    if (connected) setWallet((w) => w || connected);
  }, [connected]);

  const submit = async () => {
    if (!wallet.trim() || !nameKa.trim() || !nameEn.trim() || !phone.trim() || !email.trim() || !districtId || !idFront || !idBack)
      return setError(t.required);
    if (!isWallet(wallet.trim())) return setError(t.badWallet);
    if (!EMAIL_RE.test(email.trim())) return setError(t.badEmail);
    if (!PHONE_RE.test(phone.trim())) return setError(t.badPhone);

    setBusy(true);
    try {
      await api("/api/applications", {
        body: { wallet: wallet.trim(), nameKa, nameEn, phone, email, districtId, idFront, idBack },
      });
      setError("");
      setSent(true);
    } catch (e) {
      setError(message((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return <div className="card mx-auto max-w-xl p-8 text-center text-sm text-emerald-700">{t.sent}</div>;
  }

  if (member) {
    return <div className="card mx-auto max-w-xl p-8 text-center text-sm text-slate-600">{t.alreadyMember}</div>;
  }

  return (
    <div className="card mx-auto max-w-xl p-5">
      <div className="space-y-3">
        <div className="text-xs text-slate-500">
          {t.wallet}
          <input
            className="input mt-1 font-mono"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          />
          <p className="mt-1 text-slate-400">{t.walletHint}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder={t.fullNameKa} value={nameKa} onChange={(e) => setNameKa(e.target.value)} />
          <input className="input" placeholder={t.fullNameEn} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          <input className="input" type="tel" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="input" type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <select className="input" aria-label={t.district} value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
          <option value="">{t.chooseDistrict}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name[locale]}
            </option>
          ))}
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <IdPhoto label={t.idFront} value={idFront} onChange={setIdFront} removeLabel={dict.admin.removeImage} />
          <IdPhoto label={t.idBack} value={idBack} onChange={setIdBack} removeLabel={dict.admin.removeImage} />
        </div>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <p className="text-xs text-slate-400">{t.privacy}</p>
        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
