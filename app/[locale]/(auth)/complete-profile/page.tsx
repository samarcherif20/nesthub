"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("tunisia");
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [langInput, setLangInput] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [howFound, setHowFound] = useState("");
  const [role, setRole] = useState("");
const { signOut } = useClerk(); // ✅ ADD THIS

  const availableLanguages = ["Anglais", "Arabe", "Allemand", "Espagnol", "Italien"];

  const handleAddLanguage = (lang: string) => {
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
    }
    setLangInput("");
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const userId = user?.id;
      const response = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName,
          lastName,
          bio,
          address: `${address}, ${city}, ${region}, ${postalCode}, ${country}`,
          phoneNumber: phone,
          languages,
          gender,
          occupation,
        }),
      });
      const data = await response.json();
      console.log("✅ Profil sauvegardé:", data);
      router.push("/fr/dashboard");
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm";
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
  const sectionClass = "bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm";

  return (
    <div className="flex min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">

      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-icons text-lg">home_work</span>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-none">NestHub</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Manage your account</p>
          </div>
        </div>

        <nav className="px-4 flex-1 space-y-1">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium cursor-pointer">
            <span className="material-icons text-lg">person</span>
            <span>Personal Info</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer transition-colors">
            <span className="material-icons text-lg">shield</span>
            <span>Security</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer transition-colors">
            <span className="material-icons text-lg">payments</span>
            <span>Payouts</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer transition-colors">
            <span className="material-icons text-lg">notifications</span>
            <span>Notifications</span>
          </a>
        </nav>

        <div className="p-6 mt-auto border-t border-slate-200 dark:border-slate-800">
          <button className="w-full mb-4 py-3 bg-gradient-to-r from-purple-600 to-primary text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95">
            <span className="material-icons text-lg">workspace_premium</span>
            <span>Upgrade to Mixed Profile</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              {user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Profile" width={40} height={40} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <span className="material-icons">person</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.fullName || "Utilisateur"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <button 
  onClick={async () => {
    await signOut();
    router.push("/fr/login");
  }} 
  className="text-slate-400 hover:text-slate-600 transition-colors"
>
  <span className="material-icons text-sm">logout</span>
</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-10 px-8">

          {/* Header */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Complete My Profile
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
                Finish setting up your identity to build trust within the community and unlock premium features.
              </p>
            </div>
            <div className="w-full md:w-64 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Strength</span>
                <span className="text-sm font-bold text-primary">75%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-3/4"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Almost there! Complete Private Identity to reach 100%.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Form */}
            <div className="lg:col-span-2 space-y-8">

              {/* Photo */}
              <section className={sectionClass}>
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <span className="material-icons text-primary">photo_camera</span>
                  Photo de profil
                </h3>
                <p className="text-xs text-slate-500 mb-6">Optionnel — Ajoutez une photo pour augmenter votre score de confiance.</p>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50 transition-colors cursor-pointer">
                  <span className="material-icons text-4xl text-slate-400 mb-2">cloud_upload</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    <span className="text-primary font-bold">Cliquez pour uploader</span> ou glissez-déposez
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">JPG, PNG (max 5Mo)</p>
                </div>
              </section>

              {/* Infos personnelles */}
              <section className={sectionClass}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-icons text-primary">person</span>
                  Informations Personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Prénom *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ex: Sinda" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nom *</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ex: Ben Hassine" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={user?.emailAddresses[0]?.emailAddress || ""} readOnly className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed outline-none text-sm" />
                  </div>
                  <div>
                    <label className={labelClass}>Numéro de téléphone *</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 -- --- ---" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Date de naissance *</label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
                    <p className="text-[10px] text-slate-400 mt-1">Vous devez avoir au moins 18 ans.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Genre</label>
                    <div className="flex flex-wrap gap-6">
                      {["Homme", "Femme", "Autre", "Préfère ne pas dire"].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} className="text-primary focus:ring-primary border-slate-300" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Infos utilisateur */}
              <section className={sectionClass}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-icons text-primary">badge</span>
                  Informations Utilisateur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Rôle *</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                      <option value="">Sélectionner votre rôle</option>
                      <option value="renter">Locataire</option>
                      <option value="owner">Propriétaire</option>
                      <option value="both">Les deux</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Occupation</label>
                    <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ex: Étudiant, Ingénieur..." className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Langues parlées</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {languages.map((lang) => (
                        <span key={lang} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                          {lang}
                          <span className="material-icons text-xs cursor-pointer hover:text-red-500 transition-colors" onClick={() => handleRemoveLanguage(lang)}>close</span>
                        </span>
                      ))}
                      {availableLanguages.filter((l) => !languages.includes(l)).map((lang) => (
                        <span key={lang} onClick={() => handleAddLanguage(lang)} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                          {lang}
                          <span className="material-icons text-xs">add</span>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddLanguage(langInput); }}
                      placeholder="Ajouter une autre langue... (Entrée pour confirmer)"
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              {/* Infos complémentaires */}
              <section className={sectionClass}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-icons text-primary">description</span>
                  Informations Complémentaires
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Biographie</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 300))}
                      placeholder="Présentez-vous brièvement (Ex: Étudiant passionné, Professionnel en quête de calme...)"
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                    <p className="text-right text-[10px] text-slate-400 mt-1">Max 300 caractères</p>
                  </div>
                  <div>
                    <label className={labelClass}>Comment nous avez-vous connu ?</label>
                    <select value={howFound} onChange={(e) => setHowFound(e.target.value)} className={inputClass}>
                      <option value="">Sélectionner une option</option>
                      <option value="google">Recherche Google</option>
                      <option value="social">Réseaux Sociaux</option>
                      <option value="friend">Recommandation d'un ami</option>
                      <option value="ads">Publicité</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Adresse */}
              <section className={sectionClass}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-icons text-primary">location_on</span>
                  Adresse
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Pays</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                      <option value="france">France</option>
                      <option value="tunisia">Tunisie</option>
                      <option value="belgium">Belgique</option>
                      <option value="switzerland">Suisse</option>
                      <option value="canada">Canada</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Région / Gouvernorat</label>
                    <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Ex: Sfax, Tunis..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Ville</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Paris, Sfax..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Code postal</label>
                    <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Ex: 75001" className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Adresse exacte</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: 123 Rue de la Paix" className={inputClass} />
                  </div>
                </div>
              </section>

              {/* Préférences */}
              <section className={sectionClass}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-icons text-primary">settings_suggest</span>
                  Préférences de communication
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="size-5 rounded text-green-500 focus:ring-green-500 border-slate-300 transition-all" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Recevoir des notifications par email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} className="size-5 rounded text-green-500 focus:ring-green-500 border-slate-300 transition-all" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Recevoir des SMS</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="size-5 rounded text-green-500 focus:ring-green-500 border-slate-300 transition-all" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Recevoir la newsletter</span>
                  </label>
                </div>
              </section>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => router.push("/fr/dashboard")} className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                  Passer
                </button>
                <button onClick={handleSave} disabled={isLoading} className="px-8 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2 text-sm">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar cards */}
            <div className="space-y-6">

              {/* Trust Score */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Trust Score</h3>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">Verified Bronze</span>
                  <span className="text-green-500 font-bold mb-1 flex items-center text-sm">
                    <span className="material-icons text-sm">arrow_upward</span>
                    15%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Boost your ranking to Silver by adding a government-issued ID.
                </p>
                <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all group">
                  <span>Verify Identity</span>
                  <span className="material-icons text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
              </div>

              {/* Vérifications */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Verifications</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <span className="material-icons text-green-500">check_circle</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Email Verified</p>
                      <p className="text-[10px] text-slate-400">{user?.emailAddresses[0]?.emailAddress}</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-icons text-green-500">check_circle</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Phone Connected</p>
                      <p className="text-[10px] text-slate-400">WhatsApp vérifié</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3 opacity-50">
                    <span className="material-icons text-slate-300 dark:text-slate-700">radio_button_unchecked</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Government ID</p>
                      <p className="text-[10px] text-slate-400">Not provided</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="bg-slate-900 dark:bg-primary/10 p-6 rounded-xl text-white border border-transparent">
                <span className="material-icons text-primary mb-3 text-3xl block">contact_support</span>
                <h4 className="font-bold mb-2">Need assistance?</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Our support team is available 24/7 to help with account verification.
                </p>
                <a href="#" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  Contact Support
                  <span className="material-icons text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}