"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  User,
  CreditCard,
  Camera,
  MapPin,
  Languages,
  FileText,
  X,
  Save,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";

const AVAILABLE_LANGUAGES = [
  "Français",
  "Anglais",
  "Arabe",
  "Allemand",
  "Espagnol",
  "Italien",
  "Chinois",
  "Russe",
  "Portugais",
  "Néerlandais",
  "Turc",
  "Japonais",
];

const HOW_FOUND_OPTIONS = [
  { value: "", label: "Sélectionner..." },
  { value: "google", label: "Google" },
  { value: "social", label: "Réseaux sociaux" },
  { value: "friend", label: "Recommandation" },
  { value: "ads", label: "Publicité" },
  { value: "other", label: "Autre" },
];

function HalfGauge({ pct }: { pct: number }) {
  const r = 40;
  const circ = Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <svg width="96" height="56" viewBox="0 0 96 56">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d={`M 8 48 A ${r} ${r} 0 0 1 88 48`}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-slate-200 dark:stroke-slate-700"
      />
      <path
        d={`M 8 48 A ${r} ${r} 0 0 1 88 48`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        className="transition-all duration-700"
      />
      <text
        x="48"
        y="38"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        className="fill-slate-800 dark:fill-slate-100"
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function CompleteProfilePage() {
  const [firstName] = useState("Mohamed");
  const [lastName] = useState("Ben Ali");
  const [email] = useState("mohamed.benali@email.com");
  const [phone] = useState("+216 98 765 432");
  const [birthDate] = useState("1992-03-15");
  const [cinNumber] = useState("09876543");
  const [profession] = useState("Ingénieur informatique");
  const [governorate] = useState("Tunis");
  const [delegation] = useState("Bab Bhar");

  const [gender, setGender] = useState("Homme");
  const [bio, setBio] = useState(
    "Je m'appelle Mohamed Ben Ali, Ingénieur informatique de profession. Passionné par la technologie et l'innovation.",
  );
  const [howFound, setHowFound] = useState("google");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "Français",
    "Anglais",
    "Arabe",
  ]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const [isLandlord] = useState(true);
  const [rib, setRib] = useState("TN59 1234 5678 9012 3456 78");
  const [bankName, setBankName] = useState("BIAT");
  const [accountHolder, setAccountHolder] = useState("Mohamed Ben Ali");

  const [langSearch, setLangSearch] = useState("");
  const [langFocused, setLangFocused] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemoveLanguage = useCallback((lang: string) => {
    setSelectedLanguages((prev) => prev.filter((l) => l !== lang));
  }, []);

  const addLanguage = useCallback((lang: string) => {
    setSelectedLanguages((prev) => (prev.includes(lang) ? prev : [...prev, lang]));
    setLangSearch("");
    setLangFocused(false);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoUrl(URL.createObjectURL(file));
  };

  const filteredLanguages = AVAILABLE_LANGUAGES.filter(
    (l) => !selectedLanguages.includes(l) && l.toLowerCase().includes(langSearch.toLowerCase()),
  );

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2500);
  };

  const pct = Math.min(
    70 + [howFound !== "", selectedLanguages.length > 0, gender !== ""].filter(Boolean).length * 10,
    100,
  );

  const steps = [
    { id: 1, label: "Informations", done: true },
    { id: 2, label: "Photo", done: !!profilePhotoUrl },
    { id: 3, label: "Adresse", done: true },
    { id: 4, label: "Biographie", done: !!bio },
    { id: 5, label: "Source", done: howFound !== "" },
    { id: 6, label: "Langues", done: selectedLanguages.length > 0 },
    ...(isLandlord ? [{ id: 7, label: "Bancaire", done: !!(rib && bankName) }] : []),
  ];

  const lbl =
    "mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500";
  const ro =
    "w-full rounded-lg border border-slate-200 bg-slate-50/95 px-3.5 py-2 text-sm text-slate-600 outline-none cursor-not-allowed dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
  const ed =
    "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20";
  const card =
    "rounded-2xl border border-white/80 bg-white/94 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-blue-50 dark:bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fbff] via-[#e6f2ff] to-[#efe9ff] dark:from-slate-950 dark:via-[#0f172a] dark:to-[#111827]" />
      <div className="absolute -top-24 left-[-6rem] h-72 w-72 rounded-full bg-white/70 blur-3xl dark:bg-blue-500/10" />
      <div className="absolute top-8 right-16 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl dark:bg-purple-500/10" />
      <div
        className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 shadow-[0_-18px_50px_rgba(59,130,246,0.22)] dark:from-[#172554] dark:via-[#1d4ed8] dark:to-[#581c87] dark:shadow-[0_-18px_50px_rgba(37,99,235,0.18)]"
        style={{ clipPath: "polygon(0 32%, 100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="absolute inset-x-0 bottom-[41.5%] h-px rotate-[-5deg] bg-white/40 dark:bg-white/10" />

      <div className="relative z-10 flex h-full flex-col px-12 py-7">
        <div className="mb-5 flex flex-shrink-0 items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 via-sky-500 to-purple-500 bg-clip-text text-xl font-bold text-transparent">
              Compléter mon profil
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Remplissez vos informations pour activer votre compte
            </p>
          </div>
          <div className="flex items-center gap-5">
            <HalfGauge pct={pct} />
            {showSaved && (
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Enregistré
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-400 px-6 text-sm font-bold text-black shadow-md transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
              Enregistrer
            </button>
          </div>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-[210px_minmax(0,1fr)_minmax(0,1fr)] gap-5">
          <div className={`${card} h-full bg-white/88 p-5 dark:bg-slate-900/72`}>
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Progression
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                Étapes du profil
              </p>
            </div>
            <div className="relative flex h-[calc(100%-3rem)] flex-col justify-center gap-5">
              <div className="absolute left-[14px] top-3 bottom-3 w-px bg-slate-200 dark:bg-white/10" />
              {steps.map((step) => (
                <div key={step.id} className="relative flex items-center gap-3">
                  <div
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                      step.done
                        ? "border-blue-500 bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 text-white shadow-md shadow-blue-200/70 dark:shadow-blue-950/40"
                        : "border-slate-300 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500"
                    }`}
                  >
                    {step.done ? "✓" : step.id}
                  </div>
                  <span
                    className={`text-[13px] ${
                      step.done
                        ? "font-medium text-slate-700 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-full flex-col gap-4">
            <div className={`${card} flex-1 p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                  Informations personnelles
                </h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Prénom</label>
                    <input value={firstName} readOnly className={ro} />
                  </div>
                  <div>
                    <label className={lbl}>Nom</label>
                    <input value={lastName} readOnly className={ro} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input value={email} readOnly className={ro} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Date de naissance</label>
                    <input value={birthDate} readOnly className={ro} />
                  </div>
                  <div>
                    <label className={lbl}>CIN</label>
                    <input value={cinNumber} readOnly className={ro} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Téléphone</label>
                  <input value={phone} readOnly className={ro} />
                </div>
                <div>
                  <label className={lbl}>Profession</label>
                  <input value={profession} readOnly className={ro} />
                </div>
                <div>
                  <label className={lbl}>Genre</label>
                  <div className="flex h-[36px] items-center gap-5">
                    {["Homme", "Femme", "Autre"].map((g) => (
                      <label
                        key={g}
                        className="flex cursor-pointer items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300"
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={() => setGender(g)}
                          className="h-3.5 w-3.5 accent-blue-500"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${card} p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Adresse</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Gouvernorat</label>
                  <input value={governorate} readOnly className={ro} />
                </div>
                <div>
                  <label className={lbl}>Délégation</label>
                  <input value={delegation} readOnly className={ro} />
                </div>
              </div>
            </div>

            {isLandlord && (
              <div className={`${card} p-6`}>
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-500 dark:text-purple-400" />
                  <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                    Coordonnées bancaires
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>RIB / IBAN</label>
                    <input
                      value={rib}
                      onChange={(e) => setRib(e.target.value)}
                      className={ed}
                      placeholder="TN59 1234..."
                    />
                  </div>
                  <div>
                    <label className={lbl}>Banque</label>
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={ed}
                      placeholder="BIAT, Attijari..."
                    />
                  </div>
                  <div>
                    <label className={lbl}>Titulaire</label>
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className={ed}
                      placeholder="Nom complet"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex h-full flex-col gap-4">
            <div className={`${card} p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <Camera size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                  Photo de profil
                </h2>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-[3px] border-blue-100 bg-slate-100 dark:border-blue-500/20 dark:bg-slate-800">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User size={26} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-md transition-colors hover:bg-indigo-600"
                  >
                    <Camera size={11} />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {firstName} {lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{profession}</p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">JPG, PNG • Max 5 Mo</p>
                </div>
              </div>
            </div>

            <div className={`${card} flex flex-1 flex-col p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Biographie</h2>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 300))}
                className="flex-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                placeholder="Parlez-nous de vous..."
              />
              <p className="mt-1.5 text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {bio.length}/300
              </p>
            </div>

            <div className={`${card} p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <Search size={16} className="text-purple-500 dark:text-purple-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                  Comment nous avez-vous connu ?
                </h2>
              </div>
              <div className="relative">
                <select
                  value={howFound}
                  onChange={(e) => setHowFound(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  {HOW_FOUND_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className={`${card} p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <Languages size={16} className="text-purple-500 dark:text-purple-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Langues parlées</h2>
              </div>
              {selectedLanguages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="flex h-7 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200"
                    >
                      {lang}
                      <X
                        size={11}
                        className="cursor-pointer transition-colors hover:text-red-500"
                        onClick={() => handleRemoveLanguage(lang)}
                      />
                    </span>
                  ))}
                </div>
              )}
              <div className="relative" ref={langRef}>
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  onFocus={() => setLangFocused(true)}
                  placeholder="Rechercher une langue..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                />
                {langFocused && filteredLanguages.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => addLanguage(lang)}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300"
                      >
                        <Languages size={12} className="text-slate-400" />
                        {langSearch
                          ? lang
                              .split(new RegExp(`(${langSearch})`, "gi"))
                              .map((part, i) =>
                                part.toLowerCase() === langSearch.toLowerCase() ? (
                                  <strong key={i} className="text-blue-600 dark:text-blue-300">
                                    {part}
                                  </strong>
                                ) : (
                                  <span key={i}>{part}</span>
                                ),
                              )
                          : lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
