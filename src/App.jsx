import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { IoLogoWhatsapp } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;

const EMOJIS = [
  { value: 1, label: "😤", description: "Mou-mou, c'était pas ça" },
  { value: 2, label: "🙂", description: "Bon, ça peut aller" },
  { value: 3, label: "😎", description: "Frais p'tit-p'tit" },
  { value: 4, label: "🤩", description: "Très très propre !" },
  { value: 5, label: "🔥", description: "La coupe a parlé !" },
];

const REWARDS = [
  {
    id: 1,
    title: "Coupe gratuite",
    description: "La classe ne s'achète pas… mais aujourd'hui elle est gratuite !",
    emoji: "✂️",
    color: "from-purple-500 to-purple-700",
    probability: 0.04,
  },
  {
    id: 2,
    title: "30% de réduction",
    description: "Boum ! -30% sur ta prochaine coupe !",
    emoji: "🎉",
    color: "from-green-500 to-green-700",
    probability: 0.04,
  },
  {
    id: 3,
    title: "Pigmentation offerte",
    description: "Glow-up activé ! Ta pigmentation est cadeau",
    emoji: "🎨",
    color: "from-blue-500 to-blue-700",
    probability: 0.04,
  },
  {
    id: 4,
    title: "20% de réduction",
    description: "Un boost pour ton style, un cadeau pour ton portefeuille",
    emoji: "💰",
    color: "from-yellow-500 to-yellow-700",
    probability: 0.04,
  },
  {
    id: 5,
    title: "10% de réduction",
    description: "Un petit geste qui fait toujours plaisir",
    emoji: "🎁",
    color: "from-orange-500 to-orange-700",
    probability: 0.04,
  },
  {
    id: 0,
    title: "Pas de chance",
    description: "Ce n'est que partie remise ! Reviens tenter ta chance au Beaufort",
    emoji: "😔",
    color: "from-gray-500 to-gray-700",
    probability: 0.8,
  },
];

const TOTAL_STEPS = 5;

const generatePromoCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BBF-${code}`;
};

// --- Composants UI ---

const ProgressBar = ({ step }) => {
  const pct = Math.min(((step - 2) / (TOTAL_STEPS - 1)) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#ffcc00] rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const StepHeader = ({ step, onBack }) => (
  <div className="flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Retour"
      >
        <IoArrowBack className="size-5 text-[#010006]" />
      </button>
      <img
        src="/logo.png"
        alt="Beaufort Barbershop"
        className="h-8 object-contain"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <span className="text-xs font-semibold text-gray-400 tabular-nums">
        {step - 1} / {TOTAL_STEPS}
      </span>
    </div>
    <ProgressBar step={step} />
  </div>
);

const Confetti = () => {
  const colors = ["#ffcc00", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96e6a1", "#ffd93d", "#c084fc"];
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1,
    duration: 1.8 + Math.random() * 2.2,
    color: colors[i % colors.length],
    size: 5 + Math.random() * 7,
    round: i % 3 === 0,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-fall"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

const RadioButton = ({ id, name, value, checked, onChange, label }) => (
  <label
    htmlFor={id}
    className={`flex items-center w-full p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
      checked ? "border-[#ffcc00] bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300"
    }`}
  >
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div
      className={`w-5 h-5 mr-3 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
        checked ? "border-[#ffcc00]" : "border-gray-300"
      }`}
    >
      {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#ffcc00]" />}
    </div>
    <span className={`text-base leading-tight ${checked ? "text-[#010006] font-semibold" : "text-gray-600"}`}>
      {label}
    </span>
  </label>
);

const Input = ({ label, icon, error, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-[#010006]">{label}</label>}
    {icon ? (
      <div
        className={`flex gap-3 items-center border-2 px-4 py-3.5 rounded-xl transition-colors ${
          error
            ? "border-red-400 focus-within:border-red-500"
            : "border-gray-200 focus-within:border-[#ffcc00]"
        }`}
      >
        {icon}
        <input
          className="outline-none flex-1 text-[#010006] placeholder:text-gray-400 bg-transparent text-base"
          {...props}
        />
      </div>
    ) : (
      <input
        className={`w-full border-2 px-4 py-3.5 rounded-xl outline-none transition-colors text-[#010006] placeholder:text-gray-400 text-base ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-200 focus:border-[#ffcc00]"
        }`}
        {...props}
      />
    )}
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
);

const Textarea = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-[#010006]">{label}</label>}
    <textarea
      className={`w-full border-2 px-4 py-3.5 rounded-xl outline-none transition-colors text-[#010006] placeholder:text-gray-400 min-h-[130px] resize-none text-base ${
        error
          ? "border-red-400 focus:border-red-500"
          : "border-gray-200 focus:border-[#ffcc00]"
      }`}
      {...props}
    />
    {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
  </div>
);

const Button = ({ children, variant = "primary", ...props }) => (
  <button
    className={`w-full h-14 px-6 text-base font-bold rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${
      variant === "primary"
        ? "bg-[#ffcc00] text-[#010006] hover:bg-amber-400 shadow-md shadow-amber-200/60"
        : "bg-gray-100 text-[#010006] hover:bg-gray-200"
    }`}
    {...props}
  >
    {children}
  </button>
);

const EmojiRating = ({ value, onChange, error }) => (
  <div className="flex flex-col gap-4">
    <div className="flex justify-between gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji.value}
          type="button"
          onClick={() => onChange(emoji.value)}
          className={`flex-1 text-3xl py-3 rounded-2xl border-2 transition-all duration-200 ${
            value === emoji.value
              ? "border-[#ffcc00] bg-amber-50 scale-110 shadow-sm"
              : "border-gray-200 hover:border-gray-300 hover:scale-105"
          }`}
          title={emoji.description}
        >
          {emoji.label}
        </button>
      ))}
    </div>
    {value && (
      <p className="text-center text-sm font-medium text-gray-500">
        {EMOJIS.find((e) => e.value === value)?.description}
      </p>
    )}
    {error && (
      <span className="text-sm text-red-500 font-medium text-center block">{error}</span>
    )}
  </div>
);

const PromoCodeCard = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="mt-5 rounded-2xl border-2 border-dashed border-[#ffcc00] bg-amber-50 p-5 space-y-3">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-600">
        Ton code promo
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center justify-between gap-3 bg-white hover:bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 transition-colors group"
      >
        <span className="text-2xl font-mono font-bold tracking-[0.15em] text-[#010006]">
          {code}
        </span>
        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            copied
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700"
          }`}
        >
          {copied ? "✓ Copié !" : "Copier"}
        </span>
      </button>
      <p className="text-center text-xs text-gray-500 leading-relaxed">
        Montre ce code à ton coiffeur lors de ta prochaine visite
      </p>
    </div>
  );
};

const WinMessage = ({ reward, promoCode }) => {
  const isWin = reward.id !== 0;
  return (
    <>
      {isWin && <Confetti />}
      <div className="py-2 space-y-4">
        <div
          className={`bg-linear-to-br ${reward.color} text-white rounded-3xl p-8 shadow-xl text-center transition-transform duration-500 ${
            isWin ? "scale-[1.03]" : ""
          }`}
        >
          <div className="text-7xl mb-4">{reward.emoji}</div>
          <h2 className="text-2xl font-bold mb-1">
            {isWin ? "🎉 Félicitations !" : "Dommage !"}
          </h2>
          <p className="text-xl font-bold mb-3">{reward.title}</p>
          <p className="text-sm opacity-90 leading-relaxed">{reward.description}</p>
        </div>
        {isWin ? (
          <PromoCodeCard code={promoCode} />
        ) : (
          <p className="text-center text-sm text-gray-500 pt-2">
            Continue à nous soutenir et tente ta chance la prochaine fois ! 💪
          </p>
        )}
      </div>
    </>
  );
};

const ScratchCard = ({ width = 300, height = 300, finishPercent = 40, onComplete, brushSize = 32, children }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const canvasRef = useRef(null);
  const isCompleteRef = useRef(false);
  const isScratching = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#d4d4d4");
    gradient.addColorStop(0.5, "#b0b0b0");
    gradient.addColorStop(1, "#d4d4d4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 17px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ GRATTE ICI ✨", width / 2, height / 2 - 12);
    ctx.font = "13px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("Découvre ton lot", width / 2, height / 2 + 14);

    ctx.globalCompositeOperation = "destination-out";
  }, [width, height]);

  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = ((clientX - rect.left) * canvas.width) / rect.width / dpr;
    const y = ((clientY - rect.top) * canvas.height) / rect.height / dpr;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkPercentage = () => {
    if (isCompleteRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    const step = 16;
    for (let i = 3; i < data.length; i += step) {
      if (data[i] < 128) transparent++;
    }
    const pct = (transparent / (data.length / step)) * 100;
    if (pct >= finishPercent) {
      isCompleteRef.current = true;
      setIsComplete(true);
      onCompleteRef.current?.();
    }
  };

  const handleDown = (e) => {
    if (isCompleteRef.current) return;
    isScratching.current = true;
    if (!hasStarted) setHasStarted(true);
    const touch = e.touches?.[0];
    scratch(touch ? touch.clientX : e.clientX, touch ? touch.clientY : e.clientY);
  };

  // Enregistre les listeners une seule fois — les fonctions accèdent aux refs, pas à des closures stales
  useEffect(() => {
    const handleMove = (e) => {
      if (!isScratching.current || isCompleteRef.current) return;
      e.preventDefault();
      const touch = e.touches?.[0];
      scratch(touch ? touch.clientX : e.clientX, touch ? touch.clientY : e.clientY);
    };
    const handleUp = () => {
      if (isScratching.current) {
        isScratching.current = false;
        setTimeout(checkPercentage, 80);
      }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p
        className={`text-sm text-gray-400 flex items-center gap-1.5 transition-opacity duration-300 ${
          hasStarted || isComplete ? "opacity-0" : "opacity-100 animate-pulse"
        }`}
      >
        <span>👆</span> Gratte avec ton doigt ou ta souris
      </p>
      <div
        className="border-4 border-gray-200 rounded-2xl shadow-xl overflow-hidden relative"
        style={{
          width: `min(85vw, ${width}px)`,
          height: `min(85vw, ${height}px)`,
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
        }}
      >
        <div className="absolute inset-0">{children}</div>
        <canvas
          ref={canvasRef}
          onMouseDown={handleDown}
          onTouchStart={(e) => { e.preventDefault(); handleDown(e); }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            cursor: "crosshair",
            opacity: isComplete ? 0 : 1,
            transition: "opacity 0.5s ease-out",
            pointerEvents: isComplete ? "none" : "auto",
            touchAction: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        />
      </div>
    </div>
  );
};


function App() {
  const [step, setStep] = useState(1);
  const [selectedGeneration, setSelectedGeneration] = useState("");
  const [rating, setRating] = useState(null);
  const [wonReward, setWonReward] = useState(null);
  const [scratchDone, setScratchDone] = useState(false);
  const [promoCode] = useState(generatePromoCode);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const generations = [
    { id: "-18", label: "Jeune (moins de 18 ans)", value: "Jeune (moins de 18 ans)" },
    { id: "1825", label: "Jeune Adulte (18 - 25 ans)", value: "Jeune Adulte (18 - 25 ans)" },
    { id: "2640", label: "Adulte (26 - 40 ans)", value: "Adulte (26 - 40 ans)" },
    { id: "4155", label: "Adulte Mature (41 - 55 ans)", value: "Adulte Mature (41 - 55 ans)" },
  ];

  const getRandomReward = () => {
    const r = Math.random();
    let cum = 0;
    for (const reward of REWARDS) {
      cum += reward.probability;
      if (r <= cum) return reward;
    }
    return REWARDS[REWARDS.length - 1];
  };

  const handleScratchComplete = async () => {
    const reward = getRandomReward();
    setWonReward(reward);
    setScratchDone(true);

    const payload = {
      nomPrenom: watch("fullName"),
      contact: watch("whatsapp"),
      trancheAge: selectedGeneration,
      noteEmoji: EMOJIS.find((e) => e.value === rating)?.label ?? "",
      avis: watch("feedback") ?? "",
      recompense: reward.title,
      codePromo: reward.id !== 0 ? promoCode : "",
      date: new Date().toISOString(),
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // no-cors : pas de corps de réponse, échec silencieux
    }
  };

  return (
    // Fond sombre sur desktop, blanc sur mobile
    <div className="min-h-screen bg-white md:bg-neutral-950 md:flex md:items-center md:justify-center md:p-6">
      {/* Carte principale */}
      <div className="w-full md:max-w-md md:rounded-4xl md:overflow-hidden md:shadow-2xl md:shadow-black/60 bg-white">

        {/* Étape 1 — Accueil */}
        {step === 1 && (
          <div
            className="relative flex flex-col justify-end bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/banner.jpg')",
              height: "100svh",
            }}
          >
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/88" />
            <div className="relative z-10 px-7 pb-14 pt-8 flex flex-col items-center gap-6">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                  Prêt à tenter<br />ta chance ?
                </h1>
                <p className="text-white/75 text-base leading-relaxed max-w-xs mx-auto">
                  Bienvenue au Beaufort Barbershop. Réponds à quelques questions et tente de gagner des lots.
                </p>
              </div>
              <Button onClick={goNext}>Jouer maintenant</Button>
            </div>
          </div>
        )}

        {/* Étapes 2–6 */}
        {step >= 2 && step <= 6 && (
          <div className="flex flex-col" style={{ minHeight: "100svh" }}>
            <StepHeader step={step} onBack={goBack} />

            <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6 space-y-6">

              {/* Étape 2 — Infos personnelles */}
              {step === 2 && (
                <>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#010006]">Faisons connaissance 👋</h1>
                    <p className="text-sm text-gray-500">
                      Renseigne tes infos pour participer et récupérer ton cadeau.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit(goNext)} className="space-y-4">
                    <Input
                      label="Nom & Prénoms"
                      type="text"
                      placeholder="Ex : Yao Kouamé Junior"
                      {...register("fullName", {
                        required: "Le nom est requis",
                        minLength: { value: 3, message: "Minimum 3 caractères" },
                      })}
                      error={errors.fullName?.message}
                    />
                    <Input
                      label="Numéro WhatsApp"
                      icon={<IoLogoWhatsapp className="size-5 text-green-500 shrink-0" />}
                      type="tel"
                      placeholder="Ex : +225 05 05 05 05 05"
                      {...register("whatsapp", {
                        required: "Le numéro WhatsApp est requis",
                        pattern: { value: /^[0-9+\s\-()]+$/, message: "Numéro invalide" },
                      })}
                      error={errors.whatsapp?.message}
                    />
                    <div className="pt-2">
                      <Button type="submit">Continuer</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 3 — Tranche d'âge */}
              {step === 3 && (
                <>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#010006]">Ta tranche d'âge ?</h1>
                    <p className="text-sm text-gray-500">Sélectionne la catégorie qui te correspond.</p>
                  </div>
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (selectedGeneration) goNext(); }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      {generations.map((g) => (
                        <RadioButton
                          key={g.id}
                          id={g.id}
                          name="generation"
                          value={g.value}
                          label={g.label}
                          checked={selectedGeneration === g.value}
                          onChange={(e) => setSelectedGeneration(e.target.value)}
                        />
                      ))}
                    </div>
                    <div className="pt-2">
                      <Button type="submit" disabled={!selectedGeneration}>Continuer</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 4 — Note emoji */}
              {step === 4 && (
                <>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#010006]">On t'a bien coiffé ? 😎</h1>
                    <p className="text-sm text-gray-500">Dis-nous ce que tu penses de ta nouvelle coupe.</p>
                  </div>
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (rating) goNext(); }}
                    className="space-y-6"
                  >
                    <EmojiRating value={rating} onChange={setRating} />
                    <div className="pt-2">
                      <Button type="submit" disabled={!rating}>Continuer</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 5 — Feedback */}
              {step === 5 && (
                <>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#010006]">Ton opinion compte !</h1>
                    <p className="text-sm text-gray-500">
                      Dis-nous ce qu'on peut améliorer.{" "}
                      <span className="text-gray-400">(facultatif)</span>
                    </p>
                  </div>
                  <form onSubmit={handleSubmit(goNext)} className="space-y-4">
                    <Textarea
                      placeholder="Ex : Le service a été rapide, j'aimerais que vous ajoutiez…"
                      {...register("feedback")}
                    />
                    <div className="pt-2">
                      <Button type="submit">Envoyer</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 6 — Carte à gratter */}
              {step === 6 && (
                <>
                  {!scratchDone && (
                    <div className="space-y-1">
                      <h1 className="text-2xl font-bold text-[#010006]">Gratte et découvre !</h1>
                      <p className="text-sm text-gray-500">
                        Il suffit de gratter… et peut-être repartir avec un lot.
                      </p>
                    </div>
                  )}
                  {!scratchDone ? (
                    <div className="flex justify-center py-4">
                      <ScratchCard
                        width={300}
                        height={300}
                        finishPercent={40}
                        brushSize={32}
                        onComplete={handleScratchComplete}
                      >
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-amber-400 to-yellow-500 text-7xl">
                          🎁
                        </div>
                      </ScratchCard>
                    </div>
                  ) : (
                    wonReward && <WinMessage reward={wonReward} promoCode={promoCode} />
                  )}
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
