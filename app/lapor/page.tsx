"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Camera,
  Check,
  CircleAlert,
  Crosshair,
  ImagePlus,
  Lightbulb,
  LoaderCircle,
  MapPin,
  X,
} from "lucide-react";
import {
  Alert,
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Code,
  DatePicker,
  Input,
  NumberInput,
  Switch,
  Textarea,
} from "@heroui/react";
import { CalendarDateTime, getLocalTimeZone, now, toCalendarDateTime } from "@internationalized/date";

type PickerValue = ComponentProps<typeof DatePicker>["value"];
const toPickerValue = (v: CalendarDateTime | null): PickerValue =>
  (v ?? null) as unknown as PickerValue;
const fromPickerValue = (v: PickerValue): CalendarDateTime | null =>
  (v ?? null) as unknown as CalendarDateTime | null;
import { ApiError } from "@/lib/types";
import { apiErrorMessage, createReport, listAnimalClasses } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { AnimalClass } from "@/lib/types";

const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const CONDITION_SUGGESTIONS = ["terluka", "lemah", "terjebak", "agresif", "kurus", "basah", "berdarah", "pincang"];

const STEPS = ["Foto", "Lokasi & Waktu", "Kondisi", "Kontak & Kirim"] as const;

interface PhotoItem {
  file: File;
  preview: string;
  error?: string;
}

export default function LaporPage() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  const [locationText, setLocationText] = useState("");
  const [foundAt, setFoundAt] = useState<CalendarDateTime | null>(() =>
    toCalendarDateTime(now(getLocalTimeZone()))
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [animalTypeKey, setAnimalTypeKey] = useState<string | number | null>(null);
  const [animalTypeInput, setAnimalTypeInput] = useState("");
  const [animalClasses, setAnimalClasses] = useState<AnimalClass[]>([]);
  const [conditionTags, setConditionTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [animalCount, setAnimalCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [agree, setAgree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitCode, setSubmitCode] = useState<string | undefined>(undefined);
  const [doneId, setDoneId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAnimalClasses()
      .then((names) => setAnimalClasses(names))
      .catch(() => setAnimalClasses([]));
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const classItems = animalClasses.map((c) => ({ key: c.name, label: c.name }));

  const addFiles = (files: FileList | File[]) => {
    setPhotoNotice(null);
    const list = Array.from(files);
    if (photos.length + list.length > MAX_FILES) {
      setPhotoNotice(`Maksimal ${MAX_FILES} foto. ${list.length} file dipilih, hanya sebagian yang bisa ditambahkan.`);
    }
    const room = MAX_FILES - photos.length;
    const next: PhotoItem[] = [];
    for (const f of list.slice(0, room)) {
      if (!ACCEPTED.includes(f.type)) {
        next.push({ file: f, preview: "", error: `${f.name}: format harus JPEG/PNG/WebP.` });
        continue;
      }
      if (f.size > MAX_BYTES) {
        next.push({ file: f, preview: "", error: `${f.name}: ukuran melebihi 8MB.` });
        continue;
      }
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      const item = prev[idx];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const useGps = () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Perangkat Anda tidak mendukung GPS browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Lokasi GPS berhasil dibaca.");
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Anda tetap bisa mengisi alamat/patokan manual."
            : "Gagal membaca GPS. Periksa sinyal lalu coba lagi, atau isi alamat manual."
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const toggleTag = (tag: string) => {
    setConditionTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const stepError = (): string | null => {
    if (step === 1) {
      if (!locationText.trim()) return "Isi alamat/patokan lokasi penemuan.";
      if (!foundAt) return "Isi kapan hewan ditemukan.";
    }
    if (step === 2) {
      if (!Number.isInteger(animalCount) || animalCount < 1 || animalCount > 50)
        return "Jumlah hewan harus 1–50 ekor.";
    }
    if (step === 3) {
      if (reporterName.trim().length < 2) return "Isi nama pelapor (min. 2 huruf).";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail.trim())) return "Isi email yang valid.";
      if (reporterPhone.trim().length < 8) return "Isi nomor HP aktif (min. 8 digit).";
      if (!agree) return "Centang persetujuan penggunaan data untuk penanganan laporan.";
    }
    return null;
  };

  const next = () => {
    const err = stepError();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const err = stepError();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitCode(undefined);
    try {
      const validPhotos = photos.filter((p) => !p.error).map((p) => p.file);
      if (!foundAt) throw new Error("Isi kapan hewan ditemukan.");
      const res = await createReport({
        photos: validPhotos,
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim(),
        reporterPhone: reporterPhone.trim(),
        locationText: locationText.trim(),
        locationLat: coords?.lat,
        locationLng: coords?.lng,
        foundAt: foundAt.toDate(getLocalTimeZone()).toISOString(),
        animalTypeGuess: animalTypeInput.trim() || undefined,
        conditionTags,
        animalCount,
        notes: notes.trim() || undefined,
        isEmergency,
      });
      setDoneId(res.report.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const msg = apiErrorMessage(e, "Laporan gagal dikirim.");
      const code = e instanceof ApiError ? e.code : undefined;
      setSubmitError(code ? `${msg}` : msg);
      setSubmitCode(code);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (doneId) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center shadow-card">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-bg" aria-hidden>
              <Check className="h-10 w-10 text-success" />
            </span>
            <h1 className="text-xl font-bold text-txt-primary font-heading">Laporan Berhasil Dikirim!</h1>
            <p className="text-sm leading-relaxed text-txt-secondary">
              Tim kami akan segera meninjau laporan Anda. Anda dapat memantau perkembangan status penanganan kapan saja.
            </p>
            <div className="w-full rounded-xl border border-border bg-subtle p-4">
              <p className="text-xs text-txt-muted">ID Laporan</p>
              <p className="text-lg font-bold text-primary font-heading">#{doneId}</p>
            </div>
            <Button as={Link} href={`/laporan/${doneId}`} className="w-full bg-primary font-bold text-white" size="lg">
              Lihat Status Laporan
            </Button>
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              Kembali ke Beranda
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || submitting}
          className="rounded-lg p-2 text-txt-secondary hover:bg-subtle disabled:opacity-50"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-txt-primary font-heading">Buat Laporan</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between py-6" aria-label={`Langkah ${step + 1} dari ${STEPS.length}`}>
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  i === step
                    ? "bg-primary text-white"
                    : i < step
                    ? "bg-primary text-white"
                    : "border-2 border-border text-txt-muted"
                }`}
              >
                {i < step ? <Check className="h-5 w-5" /> : i + 1}
              </span>
              <span className={`mt-1 text-[11px] font-medium ${i === step ? "text-primary" : "text-txt-muted"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 w-12 sm:w-20 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1 - Foto */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-txt-primary font-heading">Foto Hewan</h2>
                <p className="mt-1 text-sm text-txt-secondary">
                  Unggah minimal 1 foto agar tim dapat menilai kondisi hewan dengan cepat.
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                aria-label="Pilih foto hewan"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              <div className="grid grid-cols-3 gap-3">
                {photos.map((p, i) => (
                  <div key={`${p.file.name}-${i}`} className="relative overflow-hidden rounded-xl border border-border">
                    {p.error || !p.preview ? (
                      <div className="flex h-28 flex-col items-center justify-center gap-1 bg-emergency-bg p-2 text-center">
                        <CircleAlert className="h-5 w-5 text-emergency" aria-hidden />
                        <p className="line-clamp-2 text-[10px] text-emergency">{p.error ?? "Pratinjau gagal"}</p>
                      </div>
                    ) : (
                      <img src={p.preview} alt={`Foto ${i + 1}`} className="h-28 w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label={`Hapus foto ${i + 1}`}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-txt-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera className="h-6 w-6" aria-hidden />
                    <span className="text-xs font-medium">Tambah</span>
                  </button>
                )}
              </div>

              {photoNotice && (
                <p role="status" className="rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning">
                  {photoNotice}
                </p>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-primary-light p-3">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
                <p className="text-sm text-primary">
                  Foto yang jelas membantu tim memverifikasi kondisi hewan lebih cepat.
                </p>
              </div>
            </div>
          )}

          {/* Step 2 - Lokasi & Waktu */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-txt-primary font-heading">Lokasi & Waktu Penemuan</h2>
                <p className="mt-1 text-sm text-txt-secondary">
                  Isi lokasi dan kapan hewan ditemukan.
                </p>
              </div>

              <Input
                label="Alamat / patokan lokasi"
                placeholder="cth. Jl. El Tari, dekat Toko Maju, Kel. Oebobo"
                value={locationText}
                onValueChange={setLocationText}
                isRequired
                aria-label="Alamat atau patokan lokasi"
              />

              <div className="rounded-xl bg-subtle p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-txt-secondary">
                    {coords
                      ? `GPS terkunci: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                      : "GPS opsional — membantu fasilitas menemukan lokasi presisi."}
                  </p>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    isLoading={locating}
                    spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
                    startContent={locating ? undefined : <Crosshair className="h-4 w-4" aria-hidden />}
                    onPress={useGps}
                  >
                    {coords ? "Perbarui GPS" : "Gunakan GPS saya"}
                  </Button>
                </div>
                {locationError && (
                  <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-emergency">
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {locationError}
                  </p>
                )}
              </div>

              <DatePicker
                label="Kapan hewan ditemukan"
                granularity="minute"
                hourCycle={24}
                showMonthAndYearPickers
                maxValue={toPickerValue(toCalendarDateTime(now(getLocalTimeZone())))}
                value={toPickerValue(foundAt)}
                onChange={(v) => setFoundAt(fromPickerValue(v))}
                isRequired
                aria-label="Kapan hewan ditemukan"
                startContent={<CalendarClock className="h-4 w-4 text-txt-muted" aria-hidden />}
              />
            </div>
          )}

          {/* Step 3 - Kondisi */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-txt-primary font-heading">Kondisi Hewan</h2>
                <p className="mt-1 text-sm text-txt-secondary">
                  Identifikasi jenis hewan dan kondisi yang terlihat.
                </p>
              </div>

              <Autocomplete
                label="Perkiraan jenis hewan"
                placeholder="Ketik atau pilih… (cth. Anjing)"
                defaultItems={classItems}
                allowsCustomValue
                selectedKey={animalTypeKey}
                onSelectionChange={(k) => {
                  const key = k as string | number | null;
                  setAnimalTypeKey(key);
                  if (key !== null) setAnimalTypeInput(String(key));
                }}
                inputValue={animalTypeInput}
                onInputChange={setAnimalTypeInput}
                aria-label="Perkiraan jenis hewan"
              >
                {(item) => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
              </Autocomplete>

              <div>
                <p id="label-kondisi" className="mb-2 text-sm font-medium text-txt-primary">
                  Tanda kondisi (pilih yang terlihat)
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="label-kondisi">
                  {CONDITION_SUGGESTIONS.map((t) => {
                    const active = conditionTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        aria-pressed={active}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary text-white"
                            : "border border-border bg-surface text-txt-secondary hover:border-primary hover:text-primary"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    size="sm"
                    placeholder="Tanda lain… (cth. dehidrasi)"
                    value={customTag}
                    onValueChange={setCustomTag}
                    aria-label="Tanda kondisi lain"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = customTag.trim().toLowerCase();
                        if (v && !conditionTags.includes(v)) setConditionTags((p) => [...p, v]);
                        setCustomTag("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      const v = customTag.trim().toLowerCase();
                      if (v && !conditionTags.includes(v)) setConditionTags((p) => [...p, v]);
                      setCustomTag("");
                    }}
                  >
                    Tambah
                  </Button>
                </div>
                {conditionTags.filter((t) => !CONDITION_SUGGESTIONS.includes(t)).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {conditionTags
                      .filter((t) => !CONDITION_SUGGESTIONS.includes(t))
                      .map((t) => (
                        <Chip key={t} size="sm" color="primary" variant="flat" onClose={() => toggleTag(t)}>
                          {t}
                        </Chip>
                      ))}
                  </div>
                )}
              </div>

              <Textarea
                label="Catatan tambahan"
                placeholder="cth. Anjing pincang kaki belakang, jinak, diberi air oleh warga…"
                value={notes}
                onValueChange={setNotes}
                minRows={2}
                aria-label="Catatan tambahan"
              />

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="font-medium text-txt-primary">Darurat</p>
                  <p className="text-sm text-txt-secondary">Tandai jika butuh penanganan segera</p>
                </div>
                <Switch isSelected={isEmergency} onValueChange={setIsEmergency} color="danger" aria-label="Tandai sebagai darurat" />
              </div>
            </div>
          )}

          {/* Step 4 - Kontak & Kirim */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-txt-primary font-heading">Kontak & Kirim</h2>
                <p className="mt-1 text-sm text-txt-secondary">
                  Isi kontak pelapor untuk verifikasi.
                </p>
              </div>

              <Alert
                color="primary"
                variant="faded"
                title="Tanpa perlu akun — privasi terjaga"
                description="Kontak Anda hanya terlihat oleh admin & fasilitas penangan, tidak pernah tampil di halaman publik."
              />

              <Input label="Nama pelapor" placeholder="Nama Anda" value={reporterName} onValueChange={setReporterName} isRequired aria-label="Nama pelapor" />
              <Input label="Email" placeholder="cth. nama@email.com" type="email" inputMode="email" value={reporterEmail} onValueChange={setReporterEmail} isRequired aria-label="Email pelapor" />
              <Input label="Nomor HP aktif" placeholder="cth. 0812xxxxxxx" inputMode="tel" value={reporterPhone} onValueChange={setReporterPhone} isRequired aria-label="Nomor HP aktif" />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-txt-secondary">
                  Saya setuju data laporan & kontak saya digunakan untuk keperluan penanganan hewan ini.
                </span>
              </label>

              {submitError && (
                <Alert
                  color="danger"
                  variant="faded"
                  title="Laporan gagal dikirim"
                  description={
                    <span className="flex flex-wrap items-center gap-2">
                      {submitError}
                      {submitCode ? <Code color="danger" size="sm">{submitCode}</Code> : null}
                    </span>
                  }
                />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
        {step > 0 && (
          <Button
            variant="bordered"
            startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}
            onPress={() => setStep((s) => s - 1)}
            isDisabled={submitting}
            className="flex-1"
          >
            Kembali
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            className="flex-1 bg-primary font-bold text-white"
            endContent={<ArrowRight className="h-4 w-4" aria-hidden />}
            onPress={next}
          >
            Lanjut
          </Button>
        ) : (
          <Button
            className="flex-1 bg-primary font-bold text-white"
            onPress={submit}
            isLoading={submitting}
            spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          >
            {submitting ? "Mengirim…" : "Kirim Laporan"}
          </Button>
        )}
      </div>

      {submitting && (
        <p role="status" className="mt-4 text-center text-xs text-txt-secondary">
          Mengunggah {photos.filter((p) => !p.error).length} foto… jangan tutup halaman ini.
        </p>
      )}
    </div>
  );
}
