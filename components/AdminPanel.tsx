"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Check, X, Lock, Plus, Pencil } from "lucide-react";
import { isDraft, type Poll } from "@/lib/model";
import type { Dict } from "@/lib/dictionaries";
import { fmtDate, shortWallet, type Locale } from "@/lib/i18n";
import { shrinkImage } from "@/lib/image";
import type { AdminState } from "@/lib/server/state";
import {
  api,
  useDistricts,
  useInitiatives,
  useIsFinished,
  usePolls,
  useToday,
  useSession,
  useStore,
} from "./PollsStore";
import { Notice, StatusBadge } from "./ui";
import WalletButton from "./WalletButton";

type Tab = "applications" | "members" | "districts" | "polls" | "initiatives";

export default function AdminPanel({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dict;
}) {
  const { wallet: connected, signedIn, isAdmin, demoAdmin, signIn, signingIn } = useSession();
  const { run: runPublic } = useStore();
  const [tab, setTab] = useState<Tab>("applications");

  const polls = usePolls();
  const isFinished = useIsFinished();
  const today = useToday();
  const initiatives = useInitiatives();
  const districts = useDistricts();
  // Applications and member contact details come from the admin-only endpoint.
  const [admin, setAdmin] = useState<AdminState>({ members: [], applications: [] });
  const { members, applications } = admin;

  // form state
  const [nameKa, setNameKa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [wallet, setWallet] = useState("");
  const [memberDistrict, setMemberDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [districtKa, setDistrictKa] = useState("");
  const [districtEn, setDistrictEn] = useState("");
  const [editingDistrict, setEditingDistrict] = useState<string | null>(null);
  const [districtError, setDistrictError] = useState("");
  const [qKa, setQKa] = useState("");
  const [qEn, setQEn] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [image, setImage] = useState("");
  const [pollFormOpen, setPollFormOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<string | null>(null);

  const loadAdmin = useCallback(async () => {
    try {
      setAdmin(await api<AdminState>("/api/admin/state"));
    } catch {}
  }, []);

  useEffect(() => {
    if (isAdmin) loadAdmin();
  }, [isAdmin, loadAdmin]);

  /** Runs an admin call, then reloads both the public and the admin data. */
  const run = async (path: string, init?: { method?: string; body?: unknown }) => {
    const ok = await runPublic(path, init);
    await loadAdmin();
    return ok;
  };

  if (!isAdmin) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Lock size={22} />
        </div>
        <p className="text-sm text-slate-600">
          {signedIn ? dict.admin.restricted : dict.admin.connectFirst}
        </p>
        <div className="mt-5 flex justify-center">
          {!connected ? (
            <WalletButton />
          ) : (
            !signedIn && (
              <button className="btn btn-primary" disabled={signingIn} onClick={signIn}>
                {dict.common.signIn}
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  const addMember = async () => {
    if (!nameKa.trim() || !nameEn.trim() || !wallet.trim()) return;
    const ok = await run("/api/admin/members", {
      body: { nameKa, nameEn, wallet, districtId: memberDistrict, phone, email },
    });
    if (!ok) return;
    setNameKa("");
    setNameEn("");
    setWallet("");
    setMemberDistrict("");
    setPhone("");
    setEmail("");
  };

  const districtName = (id?: string) => districts.find((d) => d.id === id)?.name[locale] ?? "-";

  const resetDistrictForm = () => {
    setDistrictKa("");
    setDistrictEn("");
    setEditingDistrict(null);
    setDistrictError("");
  };

  const saveDistrict = async () => {
    if (!districtKa.trim() || !districtEn.trim()) return;
    const body = { nameKa: districtKa, nameEn: districtEn };
    const ok = editingDistrict
      ? await run(`/api/admin/districts/${editingDistrict}`, { method: "PATCH", body })
      : await run("/api/admin/districts", { body });
    if (ok) resetDistrictForm();
  };

  const removeDistrict = async (id: string) => {
    // Checked here for a friendly message; the server refuses as well.
    if (members.some((m) => m.districtId === id) || applications.some((a) => a.districtId === id))
      return setDistrictError(dict.admin.districtInUse);
    if (await run(`/api/admin/districts/${id}`, { method: "DELETE" })) {
      if (editingDistrict === id) resetDistrictForm();
    }
  };

  const savePoll = async () => {
    const options = optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    // Options can't be changed when editing, so only a new poll needs them.
    if (!qKa.trim() || !qEn.trim() || (!editingPoll && options.length < 2) || !startDate || !endDate) return;
    if (endDate < startDate) return;
    const fields = { titleKa: qKa, titleEn: qEn, startsAt: startDate, endsAt: endDate, image };
    const ok = editingPoll
      ? await run(`/api/admin/polls/${editingPoll}`, { method: "PATCH", body: fields })
      : await run("/api/admin/polls", { body: { ...fields, options } });
    if (ok) resetPollForm();
  };

  const editPoll = (p: Poll) => {
    setEditingPoll(p.id);
    setQKa(p.title.ka);
    setQEn(p.title.en);
    setOptionsText("");
    setStartDate(p.startsAt ?? today);
    setEndDate(p.endsAt);
    setImage(p.image ?? "");
    setPollFormOpen(true);
  };

  const resetPollForm = () => {
    setQKa("");
    setQEn("");
    setOptionsText("");
    setStartDate("");
    setEndDate("");
    setImage("");
    setEditingPoll(null);
    setPollFormOpen(false);
  };

  const pickImage = async (file?: File) => setImage(file ? await shrinkImage(file) : "");

  const tabs: Tab[] = ["applications", "members", "districts", "polls", "initiatives"];

  return (
    <div>
      {demoAdmin && <Notice>{dict.admin.demoMode}</Notice>}

      <div className="mb-6 inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t ? "bg-surface shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {dict.admin.tabs[t]}
            {t === "applications" && applications.length > 0 && ` (${applications.length})`}
          </button>
        ))}
      </div>

      {tab === "applications" && (
        <div className="space-y-3">
          {applications.length === 0 && (
            <p className="text-sm text-slate-500">{dict.admin.noApplications}</p>
          )}
          {applications.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1 text-sm">
                  <div className="font-semibold">
                    {a.name.ka} / {a.name.en}
                  </div>
                  <div className="break-all font-mono text-xs text-slate-500">{a.wallet}</div>
                  <div className="text-slate-600">
                    {dict.apply.district}: {districtName(a.districtId)}
                  </div>
                  <div className="text-slate-600">
                    {dict.apply.phone}: {a.phone} · {dict.apply.email}: {a.email}
                  </div>
                  <div className="text-xs text-slate-500">
                    {dict.admin.applied}: {fmtDate(a.createdAt, locale)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => run(`/api/admin/applications/${a.id}`, { body: { action: "approve" } })}
                  >
                    <Check size={16} /> {dict.admin.approve}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => run(`/api/admin/applications/${a.id}`, { body: { action: "reject" } })}
                  >
                    <X size={16} /> {dict.admin.reject}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  [dict.apply.idFront, a.idFrontUrl],
                  [dict.apply.idBack, a.idBackUrl],
                ].map(([label, src]) => (
                  <a key={label} href={src} target="_blank" rel="noreferrer" className="block text-xs text-slate-500">
                    {label}
                    <img src={src} alt={label} className="mt-1 h-40 w-full rounded-xl object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "districts" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-1">
            <h3 className="mb-4 font-semibold">{editingDistrict ? dict.admin.edit : dict.admin.addDistrict}</h3>
            <div className="space-y-3">
              <input className="input" placeholder={dict.admin.districtKa} value={districtKa} onChange={(e) => setDistrictKa(e.target.value)} />
              <input className="input" placeholder={dict.admin.districtEn} value={districtEn} onChange={(e) => setDistrictEn(e.target.value)} />
              <div className="flex gap-2">
                {editingDistrict && (
                  <button className="btn btn-ghost flex-1" onClick={resetDistrictForm}>
                    {dict.admin.cancel}
                  </button>
                )}
                <button className="btn btn-primary flex-1" onClick={saveDistrict}>
                  {editingDistrict ? dict.admin.save : dict.admin.add}
                </button>
              </div>
              {districtError && <p className="text-sm text-rose-700">{districtError}</p>}
            </div>
          </div>
          <div className="card overflow-x-auto lg:col-span-2">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {districts.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 font-medium">{d.name.ka}</td>
                    <td className="px-5 py-3 text-slate-500">{d.name.en}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost !px-2 !py-1.5"
                          aria-label={dict.admin.edit}
                          onClick={() => {
                            setEditingDistrict(d.id);
                            setDistrictKa(d.name.ka);
                            setDistrictEn(d.name.en);
                            setDistrictError("");
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn btn-ghost !px-2 !py-1.5"
                          aria-label={dict.admin.remove}
                          onClick={() => removeDistrict(d.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-1">
            <h3 className="mb-4 font-semibold">{dict.admin.addMember}</h3>
            <div className="space-y-3">
              <input className="input" placeholder={dict.admin.fullNameKa} value={nameKa} onChange={(e) => setNameKa(e.target.value)} />
              <input className="input" placeholder={dict.admin.fullNameEn} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              <input className="input font-mono" placeholder={dict.admin.walletAddress} value={wallet} onChange={(e) => setWallet(e.target.value)} />
              <input className="input" type="tel" placeholder={dict.apply.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className="input" type="email" placeholder={dict.apply.email} value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="input" aria-label={dict.apply.district} value={memberDistrict} onChange={(e) => setMemberDistrict(e.target.value)}>
                <option value="">{dict.apply.chooseDistrict}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name[locale]}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary w-full" onClick={addMember}>
                {dict.admin.add}
              </button>
            </div>
          </div>
          <div className="card overflow-x-auto lg:col-span-2">
            <table className="w-full min-w-[560px] text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{m.name[locale]}</div>
                      <div className="text-xs text-slate-500">{districtName(m.districtId)}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      <div>{m.phone ?? "-"}</div>
                      <div>{m.email ?? ""}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{shortWallet(m.wallet)}</td>
                    <td className="px-5 py-3 text-right">
                      {m.role !== "admin" && (
                        <button
                          className="btn btn-ghost !px-2 !py-1.5"
                          aria-label={dict.admin.remove}
                          onClick={() => run(`/api/admin/members/${m.id}`, { method: "DELETE" })}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "polls" && (
        <div className="space-y-6">
          {pollFormOpen ? (
            <div className="card p-5">
              <h3 className="mb-4 font-semibold">{editingPoll ? dict.admin.edit : dict.admin.createPoll}</h3>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" placeholder={dict.admin.pollTitleKa} value={qKa} onChange={(e) => setQKa(e.target.value)} />
                  <input className="input" placeholder={dict.admin.pollTitleEn} value={qEn} onChange={(e) => setQEn(e.target.value)} />
                </div>
                {!editingPoll && (
                  <textarea className="input min-h-[96px]" placeholder={dict.admin.optionsHint} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-slate-500">
                    {dict.admin.startDate}
                    <input type="date" className="input mt-1" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
                  </label>
                  <label className="block text-xs text-slate-500">
                    {dict.admin.endDate}
                    <input type="date" className="input mt-1" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
                  </label>
                </div>
                <div className="text-xs text-slate-500">
                  {dict.admin.image}
                  {image ? (
                    <div className="mt-1 flex items-center gap-3">
                      <img src={image} alt="" className="h-20 w-32 rounded-xl object-cover" />
                      <button
                        className="btn btn-ghost !px-2 !py-1.5"
                        aria-label={dict.admin.removeImage}
                        onClick={() => pickImage()}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      aria-label={dict.admin.image}
                      className="input mt-1"
                      onChange={(e) => pickImage(e.target.files?.[0])}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn btn-ghost" onClick={resetPollForm}>
                    {dict.admin.cancel}
                  </button>
                  <button className="btn btn-primary" onClick={savePoll}>
                    {editingPoll ? dict.admin.save : dict.admin.create}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setPollFormOpen(true)}>
              <Plus size={16} /> {dict.admin.createPoll}
            </button>
          )}
          <div className="space-y-3">
            {polls.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {p.image && (
                    <img src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{p.title[locale]}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {p.startsAt && `${dict.common.startsOn}: ${fmtDate(p.startsAt, locale)} · `}
                      {dict.common.endsOn}: {fmtDate(p.endsAt, locale)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button className="btn btn-ghost !px-2 !py-1.5" aria-label={dict.admin.edit} onClick={() => editPoll(p)}>
                    <Pencil size={16} />
                  </button>
                  {isFinished(p) ? (
                    <span className="text-xs text-slate-400">{dict.admin.closed}</span>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => run(`/api/admin/polls/${p.id}/close`)}>
                      {dict.admin.closePoll}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "initiatives" && (
        <div className="space-y-3">
          <h3 className="font-semibold">{dict.admin.pendingOnly}</h3>
          {initiatives.map((i) => (
            <div key={i.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="text-sm font-medium">{i.title[locale]}</div>
                <div className="mt-1">
                  {isDraft(i) && i.status === "pending" ? (
                    <StatusBadge status="draft" label={dict.initiatives.draft} />
                  ) : (
                    <StatusBadge status={i.status} label={dict.initiatives.status[i.status]} />
                  )}
                </div>
              </div>
              {i.status === "pending" && (
                <div className="flex gap-2">
                  {!isDraft(i) && (
                    <button
                      className="btn btn-primary"
                      onClick={() => run(`/api/admin/initiatives/${i.id}`, { body: { action: "approve" } })}
                    >
                      <Check size={16} /> {dict.admin.approve}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    onClick={() => run(`/api/admin/initiatives/${i.id}`, { body: { action: "reject" } })}
                  >
                    <X size={16} /> {dict.admin.reject}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
