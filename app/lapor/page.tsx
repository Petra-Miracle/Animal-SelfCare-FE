"use client";

/* Form pelaporan multi-step (mobile-first):
   1 foto → 2 lokasi & waktu → 3 kondisi hewan → 4 kontak & kirim.
   Foto dikirim bersama form (multipart/form-data); validasi ukuran/tipe di klien
   dengan pesan & tombol coba-lagi yang jelas untuk jaringan lambat. */

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
  Progress,
  Slider,
  Switch,
  Textarea,
} from "@heroui/react";
import { CalendarDateTime, getLocalTimeZone, now, toCalendarDateTime } from "@internationalized/date";

/* Nilai DatePicker sesuai tipe yang diharapkan komponen HeroUI
   (salinan @internationalized/date milik HeroUI berbeda identitas nominal
   dengan salinan root — konversi dibatasi di helper ini). */
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

const STEPS = ["Foto", "Lokasi & Waktu", "Kondisi Hewan", "Kontak & Kirim"] as const;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Validasi per langkah (ringan; validasi final tetap di backend)
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
          <Card className="border border-emerald-200">
            <CardBody className="items-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100" aria-hidden>
                <Check className="h-7 w-7 text-emerald-700" />
              </span>
              <h1 className="text-xl font-bold text-stone-900">Laporan terkirim. Terima kasih!</h1>
              <p className="text-sm leading-relaxed text-stone-600">
                Laporan Anda sudah diterima dan menunggu verifikasi admin. Pantau statusnya di halaman daftar laporan.
              </p>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button as={Link} href={`/laporan/${doneId}`} color="success" className="font-semibold">
                  Lihat laporan saya
                </Button>
                <Button as={Link} href="/laporan" variant="bordered">
                  Daftar laporan
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pt-6 sm:pt-8">
      <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Laporkan Hewan Terlantar</h1>
      <p className="mt-1 text-sm text-stone-500">4 langkah singkat — bisa diisi dari HP langsung di lokasi.</p>

      {/* Indikator langkah */}
      <div className="mt-5" aria-hidden={false}>
        <Progress value={((step + 1) / STEPS.length) * 100} color="success" aria-label={`Langkah ${step + 1} dari ${STEPS.length}`} />
        <ol className="mt-2 grid grid-cols-4 gap-1 text-center">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={`text-[11px] font-medium leading-tight sm:text-xs ${i === step ? "text-emerald-800" : i < step ? "text-emerald-600" : "text-stone-400"}`}
            >
              <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-current/10 align-middle">
                {i < step ? <Check className="h-3 w-3" aria-hidden /> : <span>{i + 1}</span>}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          {/* LANGKAH 1 — FOTO */}
          {step === 0 ? (
            <Card>
              <CardBody className="gap-4 p-5">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-stone-900">
                    <Camera className="h-5 w-5 text-emerald-700" aria-hidden /> Foto hewan
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Sangat dianjurkan (maks {MAX_FILES} foto, JPEG/PNG/WebP, maks 8MB per file). Boleh dilewati bila
                    kondisi tidak memungkinkan.
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
                <Button
                  variant="bordered"
                  className="w-full border-dashed py-8"
                  startContent={<ImagePlus className="h-5 w-5" aria-hidden />}
                  onPress={() => fileRef.current?.click()}
                >
                  {photos.length === 0 ? "Pilih foto dari galeri / kamera" : "Tambah foto lagi"}
                </Button>
                {photoNotice ? (
                  <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {photoNotice}
                  </p>
                ) : null}
                {photos.length > 0 ? (
                  <ul className="grid grid-cols-3 gap-2" aria-label="Pratinjau foto">
                    {photos.map((p, i) => (
                      <li key={`${p.file.name}-${i}`} className="relative overflow-hidden rounded-xl border border-stone-200">
                        {p.error || !p.preview ? (
                          <div className="flex h-24 flex-col items-center justify-center gap-1 bg-red-50 p-1 text-center">
                            <CircleAlert className="h-5 w-5 text-red-500" aria-hidden />
                            <p className="line-clamp-3 text-[10px] text-red-700">{p.error ?? "Pratinjau gagal"}</p>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.preview} alt={`Foto ${i + 1}`} className="h-24 w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Hapus foto ${i + 1}`}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-xs text-stone-400">Tips: foto dari jarak aman, sertakan patokan lokasi bila bisa.</p>
              </CardBody>
            </Card>
          ) : null}

          {/* LANGKAH 2 — LOKASI & WAKTU */}
          {step === 1 ? (
            <Card>
              <CardBody className="gap-4 p-5">
                <h2 className="flex items-center gap-2 font-bold text-stone-900">
                  <MapPin className="h-5 w-5 text-emerald-700" aria-hidden /> Lokasi & waktu penemuan
                </h2>
                <Input
                  label="Alamat / patokan lokasi"
                  placeholder="cth. Jl. El Tari, dekat Toko Maju, Kel. Oebobo"
                  value={locationText}
                  onValueChange={setLocationText}
                  isRequired
                  aria-label="Alamat atau patokan lokasi"
                />
                <div className="rounded-xl bg-stone-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-stone-600">
                      {coords
                        ? `GPS terkunci: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                        : "GPS opsional — membantu fasilitas menemukan lokasi presisi."}
                    </p>
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      isLoading={locating}
                      spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
                      startContent={locating ? undefined : <Crosshair className="h-4 w-4" aria-hidden />}
                      onPress={useGps}
                    >
                      {coords ? "Perbarui GPS" : "Gunakan GPS saya"}
                    </Button>
                  </div>
                  {locationError ? (
                    <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {locationError}
                    </p>
                  ) : null}
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
                  startContent={<CalendarClock className="h-4 w-4 text-stone-400" aria-hidden />}
                />
              </CardBody>
            </Card>
          ) : null}

          {/* LANGKAH 3 — KONDISI */}
          {step === 2 ? (
            <Card>
              <CardBody className="gap-4 p-5">
                <h2 className="font-bold text-stone-900">Kondisi hewan</h2>
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="space-y-2">
                    <NumberInput
                      label="Jumlah hewan (ekor)"
                      minValue={1}
                      maxValue={50}
                      value={animalCount}
                      onValueChange={setAnimalCount}
                      aria-label="Jumlah hewan"
                    />
                    <Slider
                      aria-label="Geser untuk jumlah hewan"
                      minValue={1}
                      maxValue={10}
                      step={1}
                      value={Math.min(animalCount, 10)}
                      onChange={(v) => setAnimalCount(v as number)}
                      color="success"
                      size="sm"
                      showSteps
                    />
                  </div>
                </div>
                <div>
                  <p id="label-kondisi" className="mb-2 text-sm font-medium text-stone-700">
                    Tanda kondisi (pilih yang terlihat)
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-labelledby="label-kondisi">
                    {CONDITION_SUGGESTIONS.map((t) => {
                      const active = conditionTags.includes(t);
                      return (
                        <Chip
                          key={t}
                          as="button"
                          type="button"
                          variant={active ? "solid" : "bordered"}
                          color={active ? "success" : "default"}
                          onClick={() => toggleTag(t)}
                          aria-pressed={active}
                          className="cursor-pointer"
                        >
                          {t}
                        </Chip>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
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
                  {conditionTags.filter((t) => !CONDITION_SUGGESTIONS.includes(t)).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {conditionTags
                        .filter((t) => !CONDITION_SUGGESTIONS.includes(t))
                        .map((t) => (
                          <Chip key={t} size="sm" color="success" variant="flat" onClose={() => toggleTag(t)}>
                            {t}
                          </Chip>
                        ))}
                    </div>
                  ) : null}
                </div>
                <Textarea
                  label="Catatan tambahan"
                  placeholder="cth. Anjing pincang kaki belakang, jinak, diberi air oleh warga…"
                  value={notes}
                  onValueChange={setNotes}
                  minRows={2}
                  aria-label="Catatan tambahan"
                />
                <Switch isSelected={isEmergency} onValueChange={setIsEmergency} color="danger" aria-label="Tandai sebagai darurat">
                  <span className="text-sm font-medium">Darurat — butuh penanganan segera</span>
                </Switch>
              </CardBody>
            </Card>
          ) : null}

          {/* LANGKAH 4 — KONTAK & KIRIM */}
          {step === 3 ? (
            <Card>
              <CardBody className="gap-4 p-5">
                <h2 className="font-bold text-stone-900">Kontak pelapor & kirim</h2>
                <Alert
                  color="success"
                  variant="faded"
                  title="Tanpa perlu akun — privasi terjaga"
                  description="Kontak Anda hanya terlihat oleh admin & fasilitas penangan, tidak pernah tampil di halaman publik."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Nama pelapor" placeholder="Nama Anda" value={reporterName} onValueChange={setReporterName} isRequired aria-label="Nama pelapor" />
                  <Input label="Nomor HP aktif" placeholder="cth. 0812xxxxxxx" inputMode="tel" value={reporterPhone} onValueChange={setReporterPhone} isRequired aria-label="Nomor HP aktif" />
                </div>
                <Input label="Email" placeholder="cth. nama@email.com" type="email" inputMode="email" value={reporterEmail} onValueChange={setReporterEmail} isRequired aria-label="Email pelapor" />
                <Checkbox isSelected={agree} onValueChange={setAgree} aria-label="Persetujuan penggunaan data">
                  <span className="text-xs leading-relaxed text-stone-600">
                    Saya setuju data laporan & kontak saya digunakan untuk keperluan penanganan hewan ini.
                  </span>
                </Checkbox>
                {submitError ? (
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
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Navigasi langkah */}
      <div className="mt-5 flex items-center justify-between gap-3 pb-4">
        <Button variant="light" startContent={<ArrowLeft className="h-4 w-4" aria-hidden />} onPress={() => setStep((s) => Math.max(s - 1, 0))} isDisabled={step === 0 || submitting}>
          Kembali
        </Button>
        {step < STEPS.length - 1 ? (
          <Button color="success" className="font-semibold" endContent={<ArrowRight className="h-4 w-4" aria-hidden />} onPress={next}>
            Lanjut
          </Button>
        ) : (
          <Button
            color="success"
            className="font-semibold"
            onPress={submit}
            isLoading={submitting}
            spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          >
            {submitting ? "Mengirim…" : "Kirim Laporan"}
          </Button>
        )}
      </div>
      {submitting ? (
        <p role="status" className="pb-6 text-center text-xs text-stone-500">
          Mengunggah {photos.filter((p) => !p.error).length} foto… jangan tutup halaman ini. Jika gagal karena jaringan,
          Anda bisa menekan &quot;Kirim Laporan&quot; lagi.
        </p>
      ) : null}
      <p className="pb-8 text-center text-xs text-stone-400">
        Sudah pernah melapor? <Link href="/laporan" className="font-medium text-emerald-700 underline">Pantau daftar laporan</Link>
      </p>
    </div>
  );
}
