"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Dict } from "@/lib/dictionaries";
import { fmtDate, type Locale } from "@/lib/i18n";
import { shrinkImage } from "@/lib/image";
import type { NewsItem } from "@/lib/server/news";
import { api, useToday } from "./PollsStore";

const EMPTY = { titleKa: "", titleEn: "", bodyKa: "", bodyEn: "", date: "", image: "" };

/** Admin tab: the news posts shown on the public website's timeline. */
export default function AdminNews({ locale, dict }: { locale: Locale; dict: Dict }) {
  const today = useToday();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setNews(await api<NewsItem[]>("/api/news"));
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const reset = () => {
    setForm(EMPTY);
    setEditing(null);
    setOpen(false);
    setError("");
  };

  const save = async () => {
    const { titleKa, titleEn, bodyKa, bodyEn, date } = form;
    if (![titleKa, titleEn, bodyKa, bodyEn, date].every((v) => v.trim())) return setError(dict.admin.newsRequired);
    setSaving(true);
    try {
      if (editing) await api(`/api/admin/news/${editing}`, { method: "PATCH", body: form });
      else await api("/api/admin/news", { body: form });
    } catch (e) {
      return setError((e as Error).message);
    } finally {
      setSaving(false);
    }
    reset();
    load();
  };

  const edit = (n: NewsItem) => {
    setEditing(n.id);
    setForm({
      titleKa: n.title.ka,
      titleEn: n.title.en,
      bodyKa: n.body.ka,
      bodyEn: n.body.en,
      date: n.date,
      image: n.image ?? "",
    });
    setError("");
    setOpen(true);
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/admin/news/${id}`, { method: "DELETE" });
    } catch {}
    if (editing === id) reset();
    load();
  };

  const pickImage = async (file?: File) => {
    const image = file ? await shrinkImage(file) : "";
    setForm((f) => ({ ...f, image }));
  };

  return (
    <div className="space-y-6">
      {open ? (
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">{editing ? dict.admin.edit : dict.admin.addNews}</h3>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder={dict.admin.newsTitleKa} value={form.titleKa} onChange={set("titleKa")} />
              <input className="input" placeholder={dict.admin.newsTitleEn} value={form.titleEn} onChange={set("titleEn")} />
              <textarea className="input min-h-[120px]" placeholder={dict.admin.newsBodyKa} value={form.bodyKa} onChange={set("bodyKa")} />
              <textarea className="input min-h-[120px]" placeholder={dict.admin.newsBodyEn} value={form.bodyEn} onChange={set("bodyEn")} />
            </div>
            <label className="block max-w-xs text-xs text-slate-500">
              {dict.admin.newsDate}
              <input type="date" className="input mt-1" value={form.date} onChange={set("date")} />
            </label>
            <div className="text-xs text-slate-500">
              {dict.admin.image}
              {form.image ? (
                <div className="mt-1 flex items-center gap-3">
                  <img src={form.image} alt="" className="h-20 w-32 rounded-xl object-cover" />
                  <button className="btn btn-ghost !px-2 !py-1.5" aria-label={dict.admin.removeImage} onClick={() => pickImage()}>
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
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={reset}>
                {dict.admin.cancel}
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={save}>
                {editing ? dict.admin.save : dict.admin.create}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm({ ...EMPTY, date: today });
            setOpen(true);
          }}
        >
          <Plus size={16} /> {dict.admin.addNews}
        </button>
      )}

      <div className="space-y-3">
        {news.length === 0 && <p className="text-sm text-slate-500">{dict.common.empty}</p>}
        {news.map((n) => (
          <div key={n.id} className="card flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              {n.image && <img src={n.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0">
                <div className="text-sm font-medium">{n.title[locale]}</div>
                <div className="mt-0.5 text-xs text-slate-500">{fmtDate(n.date, locale)}</div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button className="btn btn-ghost !px-2 !py-1.5" aria-label={dict.admin.edit} onClick={() => edit(n)}>
                <Pencil size={16} />
              </button>
              <button className="btn btn-ghost !px-2 !py-1.5" aria-label={dict.admin.remove} onClick={() => remove(n.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
