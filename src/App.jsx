/*
THESIS: Un avis client dans une interface d’application Apple, sobre et familière.
OWN-WORLD: Fond iOS gris clair, surfaces blanches, listes groupées, police système et accent or Beaufort.
STORY: Donner son avis, confirmer son enregistrement, puis découvrir un résultat conservé.
FIRST VIEWPORT: Marque en haut, photo du salon, grand titre et bouton Donner mon avis en bas.
FORM: Direction Apple explicitement choisie par le client ; application web mobile, sans faux cadre iPhone.
*/
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { IoLogoWhatsapp } from "react-icons/io";
import { IoChevronBack, IoCheckmark, IoChevronForward, IoGiftOutline, IoCutOutline, IoHeartOutline, IoCopyOutline, IoAlertCircleOutline } from "react-icons/io5";

const PARTICIPATION_KEY = "beaufort-opening-participation-v2";

function loadParticipationId() {
  try { return localStorage.getItem(PARTICIPATION_KEY) || ""; } catch { return ""; }
}

async function participationRequest(payload) {
  const response = await fetch('/api/participation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Impossible de joindre le salon. Réessaie dans un instant.");
  }
  return result;
}

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
  },
  {
    id: 2,
    title: "30% de réduction",
    description: "Boum ! -30% sur ta prochaine coupe !",
    emoji: "🎉",
  },
  {
    id: 3,
    title: "Pigmentation offerte",
    description: "Glow-up activé ! Ta pigmentation est cadeau",
    emoji: "🎨",
  },
  {
    id: 4,
    title: "20% de réduction",
    description: "Un boost pour ton style, un cadeau pour ton portefeuille",
    emoji: "💰",
  },
  {
    id: 5,
    title: "10% de réduction",
    description: "Un petit geste qui fait toujours plaisir",
    emoji: "🎁",
  },
  {
    id: 0,
    title: "Merci pour ta visite !",
    description: "Pas de lot cette fois, mais ton avis nous aide à améliorer ton prochain passage. Bienvenue chez Beaufort !",
    emoji: "💛",
  },
];

const TOTAL_STEPS = 5;

const RATING_CRITERIA = [
  { key: "coupe", label: "Ta coupe", description: "Le résultat te plaît ?" },
  { key: "accueil", label: "L’accueil", description: "Tu t’es senti bien accueilli ?" },
  { key: "attente", label: "Le temps d’attente", description: "L’attente avant ta coupe te convient ?" },
];
const DISCOVERY_SOURCES = ["WhatsApp", "Instagram", "Un ami / bouche-à-oreille", "En passant devant le salon", "Autre"];

const ShareResult = () => {
  const [shareNotice, setShareNotice] = useState("");
  // Share only the public entry point, never a result, contact or gift code.
  const url = new URL('/', window.location.origin).href;
  const text = 'J’ai tenté ma chance chez Le BeauFORT BarberShop ✂️ À toi de jouer !';
  const shareElsewhere = async () => {
    setShareNotice("");
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Le BeauFORT BarberShop', text, url });
      } else {
        await navigator.clipboard.writeText(text + '\n' + url);
        setShareNotice('Lien copié ! Colle-le dans le réseau de ton choix.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareNotice('Partage indisponible. Tu peux utiliser le bouton WhatsApp.');
    }
  };
  return (
    <div className="result-share">
      <p className="field-help">Invite tes amis à tenter leur chance.</p>
      <a className="app-button button-secondary" href={'https://wa.me/?text=' + encodeURIComponent(text + '\n' + url)} target="_blank" rel="noopener noreferrer">
        <IoLogoWhatsapp aria-hidden="true" /> Partager sur WhatsApp
      </a>
      <button type="button" className="text-button" onClick={shareElsewhere}>Partager ailleurs</button>
      <p className="field-help" role="status" aria-live="polite">{shareNotice}</p>
    </div>
  );
};

// --- Composants UI ---

const ProgressBar = ({ step }) => {
  const pct = Math.min(((step - 2) / (TOTAL_STEPS - 1)) * 100, 100);
  return (
    <div className="progress-track" role="progressbar" aria-label="Progression du questionnaire" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div
        className="progress-fill"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
};

const StepHeader = ({ step, onBack }) => (
  <header className="navigation-bar">
    <div className="navigation-row">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="back-button"
        aria-label="Retour"
      >
        <IoChevronBack aria-hidden="true" />
        <span>Retour</span>
      </button>
      <span className="navigation-title">Beaufort</span>
      <span className="step-counter">{step - 1} sur {TOTAL_STEPS}</span>
    </div>
    <ProgressBar step={step} />
  </header>
);

const Confetti = () => {
  const colors = ["#efc44a", "#d7b452", "#d1d1d6", "#ffffff"];
  const [pieces] = useState(() => Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1,
    duration: 1.8 + Math.random() * 2.2,
    color: colors[i % colors.length],
    size: 5 + Math.random() * 7,
    round: i % 3 === 0,
  })));
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
    className={`choice-row ${checked ? "is-selected" : ""}`}
  >
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="choice-input"
    />
    <span>{label}</span>
    <span className="choice-check" aria-hidden="true">{checked && <IoCheckmark />}</span>
  </label>
);

const Input = ({ label, icon, error, ...props }) => (
  <div className="field">
    <label htmlFor={props.name} className="field-label">{label}</label>
    <div className={`input-surface ${error ? "has-error" : ""}`}>
      {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
      <input id={props.name} aria-invalid={Boolean(error)} aria-describedby={error ? `${props.name}-error` : undefined} {...props} />
    </div>
    {error && <span id={`${props.name}-error`} className="field-error">{error}</span>}
  </div>
);

const Textarea = ({ label, error, ...props }) => (
  <div className="field">
    <label htmlFor={props.name} className="field-label">{label || "Un mot pour nous ?"} <span className="optional-label">Facultatif</span></label>
    <textarea
      id={props.name}
      className={`textarea-surface ${error ? "has-error" : ""}`}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${props.name}-error` : undefined}
      {...props}
    />
    {error && <span id={`${props.name}-error`} className="field-error">{error}</span>}
  </div>
);

const Button = ({ children, variant = "primary", ...props }) => (
  <button
    className={`app-button ${variant === "primary" ? "button-primary" : "button-secondary"}`}
    {...props}
  >
    <span>{children}</span>
    <IoChevronForward aria-hidden="true" />
  </button>
);

const EmojiRating = ({ value, onChange, error }) => (
  <div className="rating-control">
    <div className="rating-options">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji.value}
          type="button"
          onClick={() => onChange(emoji.value)}
          className={`rating-option ${value === emoji.value ? "is-selected" : ""}`}
          title={`${emoji.value} sur 5`}
          aria-label={`${emoji.value} sur 5`}
          aria-pressed={value === emoji.value}
        >
          <span className="rating-emoji" aria-hidden="true">{emoji.label}</span>
          <span className="rating-number">{emoji.value}</span>
        </button>
      ))}
    </div>
    <p className={`rating-caption ${value ? "has-rating" : ""}`} aria-live="polite">
      {value ? `${value} / 5 — ${value <= 2 ? "À améliorer" : value === 3 ? "Satisfaisant" : value === 4 ? "Très bien" : "Excellent"}` : "Choisis une note"}
    </p>
    {error && (
      <span className="field-error">{error}</span>
    )}
  </div>
);

const PromoCodeCard = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { setCopied(false); }
  };

  return (
    <div className="promo-card">
      <p className="field-label">Ton code cadeau</p>
      <button
        type="button"
        onClick={handleCopy}
        className="promo-copy"
        aria-label={`Copier le code ${code}`}
      >
        <span className="promo-code">
          {code}
        </span>
        <span className="copy-action" aria-live="polite">
          {copied ? <IoCheckmark aria-hidden="true" /> : <IoCopyOutline aria-hidden="true" />}
          {copied ? "Copié" : "Copier"}
        </span>
      </button>
      <p className="footnote">À présenter au salon lors de ta prochaine visite. Utilisable une seule fois.</p>
    </div>
  );
};

const WinMessage = ({ reward, promoCode }) => {
  const isWin = reward.id !== 0;
  return (
    <>
      {isWin && <Confetti />}
      <div className="result-screen">
        <div className="result-symbol" aria-hidden="true">{isWin ? <IoGiftOutline /> : <IoHeartOutline />}</div>
        <div className="result-heading">
          <p className="section-label">{isWin ? "Un cadeau pour toi" : "Ton avis fait la différence"}</p>
          <h1 className="screen-title">{isWin ? "C’est ton jour." : "Merci à toi."}</h1>
          <h2 className="reward-title">{reward.title}</h2>
          <p className="screen-description">{reward.description}</p>
        </div>
        {isWin ? (
          <PromoCodeCard code={promoCode} />
        ) : (
          <p className="footnote">On sera heureux de te retrouver pour ta prochaine coupe.</p>
        )}
      </div>
    </>
  );
};

function eraseScratch(canvas, brushSize, clientX, clientY) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = ((clientX - rect.left) * canvas.width) / rect.width / dpr;
  const y = ((clientY - rect.top) * canvas.height) / rect.height / dpr;
  ctx.beginPath();
  ctx.arc(x, y, brushSize, 0, Math.PI * 2);
  ctx.fill();
}

const ScratchCard = ({ width = 300, height = 300, finishPercent = 40, onComplete, brushSize = 32, children }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const canvasRef = useRef(null);
  const isCompleteRef = useRef(false);
  const isScratching = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#e8e9ed");
    gradient.addColorStop(0.45, "#f5f5f7");
    gradient.addColorStop(1, "#d5d7dc");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#48484c";
    ctx.font = "500 17px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Glisse pour découvrir", width / 2, height / 2 - 8);
    ctx.font = "13px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "#68686d";
    ctx.fillText("Un cadeau se cache peut-être ici", width / 2, height / 2 + 20);

    ctx.globalCompositeOperation = "destination-out";
  }, [width, height]);

  const handleDown = (e) => {
    if (isCompleteRef.current) return;
    isScratching.current = true;
    if (!hasStarted) setHasStarted(true);
    const touch = e.touches?.[0];
    eraseScratch(canvasRef.current, brushSize, touch ? touch.clientX : e.clientX, touch ? touch.clientY : e.clientY);
  };

  useEffect(() => {
    let timer;
    const checkPercentage = () => {
      if (isCompleteRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      const stride = 16;
      for (let i = 3; i < data.length; i += stride) {
        if (data[i] < 128) transparent++;
      }
      if ((transparent / (data.length / stride)) * 100 >= finishPercent) {
        isCompleteRef.current = true;
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    };
    const handleMove = (e) => {
      if (!isScratching.current || isCompleteRef.current) return;
      e.preventDefault();
      const touch = e.touches?.[0];
      eraseScratch(canvasRef.current, brushSize, touch ? touch.clientX : e.clientX, touch ? touch.clientY : e.clientY);
    };
    const handleUp = () => {
      if (isScratching.current) {
        isScratching.current = false;
        clearTimeout(timer);
        timer = setTimeout(checkPercentage, 80);
      }
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [brushSize, finishPercent]);

  return (
    <div className="scratch-control">
      <p
        className={`scratch-hint ${hasStarted || isComplete ? "is-hidden" : ""}`}
      >
        Gratte avec ton doigt ou ta souris
      </p>
      <div
        className="scratch-surface"
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
          aria-label="Carte à gratter Beaufort. Le bouton ci-dessous permet aussi de découvrir le résultat."
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
      <button type="button" className="text-button" onClick={() => onCompleteRef.current?.()}>Révéler sans gratter</button>
    </div>
  );
};


function App() {
  const [participationId, setParticipationId] = useState(loadParticipationId);
  const [checkingParticipation, setCheckingParticipation] = useState(() => Boolean(loadParticipationId()));
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [revealStarted, setRevealStarted] = useState(false);
  const savingRef = useRef(false);
  const [step, setStep] = useState(1);
  const [selectedGeneration, setSelectedGeneration] = useState("");
  const [ratings, setRatings] = useState({ coupe: null, accueil: null, attente: null });
  const [discoverySource, setDiscoverySource] = useState("");
  const [wonReward, setWonReward] = useState(null);
  const [scratchDone, setScratchDone] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const { register, handleSubmit, formState: { errors }, getValues, reset } = useForm();

  const startNewGame = () => {
    if (savingRef.current || busy) return;
    const id = crypto.randomUUID();
    try { localStorage.setItem(PARTICIPATION_KEY, id); } catch { /* La nouvelle partie reste disponible en mémoire. */ }
    setParticipationId(id);
    reset();
    setSelectedGeneration("");
    setRatings({ coupe: null, accueil: null, attente: null });
    setDiscoverySource("");
    setWonReward(null);
    setPromoCode("");
    setScratchDone(false);
    setRevealStarted(false);
    setRequestError("");
    setStep(1);
  };

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const generations = [
    { id: "-18", label: "Jeune (moins de 18 ans)", value: "Jeune (moins de 18 ans)" },
    { id: "1825", label: "Jeune Adulte (18 - 25 ans)", value: "Jeune Adulte (18 - 25 ans)" },
    { id: "2640", label: "Adulte (26 - 40 ans)", value: "Adulte (26 - 40 ans)" },
    { id: "4155", label: "Adulte Mature (41 - 55 ans)", value: "Adulte Mature (41 - 55 ans)" },
  ];

  useEffect(() => {
    const id = loadParticipationId();
    if (!id) return;
    let cancelled = false;
    participationRequest({ action: 'status', participationId: id }).then((result) => {
      if (cancelled) return;
      if (result.saved) {
        setStep(6);
        if (result.revealed) {
          setWonReward(REWARDS.find((reward) => reward.id === result.rewardId));
          setPromoCode(result.codePromo || "");
          setScratchDone(true);
        }
      }
      setCheckingParticipation(false);
    }).catch((error) => {
      if (!cancelled) setRequestError(error.message);
    });
    return () => { cancelled = true; };
  }, []);

  const handleScratchComplete = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setRevealStarted(true);
    setBusy(true);
    setRequestError("");
    try {
      const result = await participationRequest({ action: 'reveal', participationId });
      const reward = REWARDS.find((item) => item.id === result.rewardId);
      if (!reward) throw new Error("Résultat indisponible. Réessaie.");
      setWonReward(reward);
      setPromoCode(result.codePromo || "");
      setScratchDone(true);
    } catch (error) {
      setRequestError(error.message);
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  };

  const saveFeedback = async () => {
    if (!discoverySource || savingRef.current) return;
    savingRef.current = true;
    setBusy(true);
    setRequestError("");
    const id = participationId || crypto.randomUUID();
    setParticipationId(id);
    try { localStorage.setItem(PARTICIPATION_KEY, id); } catch { /* Sheets conserve chaque partie par identifiant. */ }

    const payload = {
      action: 'save',
      participationId: id,
      nomPrenom: getValues("fullName"),
      contact: getValues("whatsapp"),
      trancheAge: selectedGeneration,
      noteEmoji: EMOJIS.find((e) => e.value === ratings.coupe)?.label ?? "",
      noteCoupe: ratings.coupe,
      noteAccueil: ratings.accueil,
      noteAttente: ratings.attente,
      sourceDecouverte: discoverySource,
      avis: getValues("feedback") ?? "",
    };

    try {
      const result = await participationRequest(payload);
      if (!result.saved) throw new Error("Ton avis n’a pas pu être enregistré. Réessaie.");
      setStep(6);
      if (result.revealed) {
        setWonReward(REWARDS.find((item) => item.id === result.rewardId));
        setPromoCode(result.codePromo || "");
        setScratchDone(true);
      }
    } catch (error) {
      setRequestError(error.message);
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="app-stage">
      <main className="app-shell" aria-label="Satisfaction client Beaufort" aria-busy={busy}>
        {busy && (
          <div className="loading-overlay">
            <div className="loading-panel" role="status" aria-live="polite" aria-atomic="true">
              <span className="loading-spinner" aria-hidden="true" />
              <h2>{step === 6 ? "On prépare ton résultat…" : "On enregistre ton avis…"}</h2>
              <p>{step === 6 ? "Encore un instant pour découvrir ta surprise." : "Encore un instant, ta carte arrive."}</p>
            </div>
          </div>
        )}

        {/* Étape 1 — Accueil */}
        {checkingParticipation ? (
          <div className="connection-state" role="status">
            <div className="loading-placeholder" aria-hidden="true"><span /><span /><span /></div>
            <p>{requestError || "On retrouve ta participation…"}</p>
            {requestError && <Button onClick={() => window.location.reload()}>Réessayer</Button>}
          </div>
        ) : step === 1 && (
          <div className="welcome-screen">
            <header className="welcome-nav">
              <span className="brand-mark" aria-hidden="true"><IoCutOutline /></span>
              <span>Le Beaufort <span className="brand-subtitle">Barbershop</span></span>
            </header>
            <div className="welcome-content">
              <div className="welcome-photo">
                <img className="salon-photo" src="/banner.jpg" alt="Une coupe au barbershop" />
                <img className="photo-logo" src="/logo.png" alt="Le Beaufort Barbershop" />
              </div>
              <div className="welcome-heading">
                <p className="section-label">Bienvenue chez toi</p>
                <h1>Une belle coupe.<br />Ton avis compte.</h1>
                <p className="screen-description">Raconte-nous ta visite. Aide-nous à faire encore mieux, puis tente de gagner un cadeau.</p>
              </div>
              <div className="welcome-gift">
                <IoGiftOutline aria-hidden="true" />
                <div><strong>Une petite surprise t’attend.</strong><span>Donne ton avis, puis gratte ta carte.</span></div>
              </div>
            </div>
            <div className="welcome-action">
              <Button onClick={goNext}>Donner mon avis</Button>
              <p className="footnote">Tu peux participer plusieurs fois.<br />Tes notes n’influencent pas le tirage.</p>
            </div>
          </div>
        )}

        {/* Étapes 2–6 */}
        {!checkingParticipation && step >= 2 && step <= 6 && (
          <div className="flow-screen">
            <StepHeader step={step} onBack={step === 6 || busy ? undefined : goBack} />

            <div key={step} className="flow-content">
              {requestError && <div role="alert" className="error-message"><IoAlertCircleOutline aria-hidden="true" /><p>{requestError}</p></div>}

              {/* Étape 5 — Coordonnées avant le jeu */}
              {step === 5 && (
                <>
                  <div className="screen-heading">
                    <p className="section-label">Avant ta surprise</p>
                    <h1 className="screen-title">À qui envoyer<br />le résultat ?</h1>
                    <p className="screen-description">
                      Ton prénom et ton WhatsApp pour t’envoyer ton résultat et ton code cadeau si tu gagnes.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit(saveFeedback)} className="flow-form">
                    <div className="form-fields">
                    <Input
                      label="Prénom"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Ex : Yao"
                      {...register("fullName", {
                        required: "Ton prénom est requis",
                        minLength: { value: 2, message: "Minimum 2 caractères" },
                      })}
                      error={errors.fullName?.message}
                    />
                    <Input
                      label="Numéro WhatsApp"
                      icon={<IoLogoWhatsapp />}
                      type="tel"
                      autoComplete="tel"
                      placeholder="Ex : +225 05 05 05 05 05"
                      {...register("whatsapp", {
                        required: "Le numéro WhatsApp est requis",
                        validate: (value) => /^\+?[0-9\s\-()]+$/.test(value) && value.replace(/\D/g, '').length >= 8 && value.replace(/\D/g, '').length <= 15 || "Numéro invalide",
                      })}
                      error={errors.whatsapp?.message}
                    />
                    <p className="field-help">Ton résultat sera aussi affiché ici après le grattage.</p>
                    </div>
                    <div className="form-action">
                      <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Envoyer mon avis et jouer"}</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 4 — Tranche d’âge facultative */}
              {step === 4 && (
                <>
                  <div className="screen-heading">
                    <p className="section-label">Un peu de toi</p>
                    <h1 className="screen-title">Ta tranche<br />d’âge.</h1>
                    <p className="screen-description">Facultatif : cela nous aide à mieux connaître les visiteurs du salon.</p>
                  </div>
                  <form
                    onSubmit={(e) => { e.preventDefault(); goNext(); }}
                    className="flow-form"
                  >
                    <div className="grouped-list" role="group" aria-label="Tranche d’âge">
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
                    <div className="form-action">
                      <Button type="submit">Continuer</Button>
                      <button type="button" className="text-button" onClick={() => { setSelectedGeneration(""); goNext(); }}>Je préfère ne pas répondre</button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 2 — Avis en premier */}
              {step === 2 && (
                <>
                  <div className="screen-heading">
                    <p className="section-label">Ton expérience</p>
                    <h1 className="screen-title">Alors,<br />c’était comment ?</h1>
                    <p className="screen-description">De 1 « à améliorer » à 5 « excellent ».<br />Ton ressenti, tout simplement.</p>
                  </div>
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (RATING_CRITERIA.every(({ key }) => ratings[key])) goNext(); }}
                    className="flow-form"
                  >
                    <div className="ratings-group">
                    {RATING_CRITERIA.map(({ key, label, description }) => (
                      <fieldset key={key} className="rating-fieldset">
                        <legend className="rating-label">{label}</legend>
                        <p className="rating-description">{description}</p>
                        <EmojiRating
                          value={ratings[key]}
                          onChange={(value) => setRatings((previous) => ({ ...previous, [key]: value }))}
                        />
                      </fieldset>
                    ))}
                    </div>
                    <div className="form-action">
                      <Button type="submit" disabled={!RATING_CRITERIA.every(({ key }) => ratings[key])}>Continuer</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 3 — Feedback */}
              {step === 3 && (
                <>
                  <div className="screen-heading">
                    <p className="section-label">Un dernier mot</p>
                    <h1 className="screen-title">On t’écoute.</h1>
                    <p className="screen-description">Dis-nous comment tu nous as connus, et ce qu’on peut améliorer.</p>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); if (discoverySource) goNext(); }} className="flow-form">
                    <div className="form-fields">
                    <fieldset className="discovery-fieldset">
                      <legend className="field-label">Comment as-tu connu Beaufort ?</legend>
                      <div className="grouped-list">
                      {DISCOVERY_SOURCES.map((source, index) => (
                        <RadioButton
                          key={source}
                          id={`discovery-${index}`}
                          name="discovery"
                          value={source}
                          label={source}
                          checked={discoverySource === source}
                          onChange={(e) => setDiscoverySource(e.target.value)}
                        />
                      ))}
                      </div>
                    </fieldset>
                    <Textarea
                      placeholder="Ce que tu as aimé, une idée, une petite chose à améliorer…"
                      maxLength={5000}
                      {...register("feedback")}
                    />
                    </div>
                    <div className="form-action">
                      <Button type="submit" disabled={!discoverySource}>Continuer</Button>
                    </div>
                  </form>
                </>
              )}

              {/* Étape 6 — Carte à gratter */}
              {step === 6 && (
                <>
                  {!scratchDone && !revealStarted && (
                    <div className="screen-heading">
                      <p className="saved-label"><IoCheckmark aria-hidden="true" /> Ton avis est enregistré</p>
                      <h1 className="screen-title">À toi<br />de découvrir.</h1>
                      <p className="screen-description">
                        Un geste du doigt, et la surprise se révèle.
                      </p>
                    </div>
                  )}
                  {!scratchDone && revealStarted ? (
                    <div className="connection-state" role="status">
                      <p>{busy ? "On récupère ton résultat…" : "Ton résultat est conservé. Tu peux le récupérer sans refaire de tirage."}</p>
                      {!busy && <Button onClick={handleScratchComplete}>Afficher mon résultat</Button>}
                    </div>
                  ) : !scratchDone ? (
                    <div className="scratch-section">
                      <ScratchCard
                        width={300}
                        height={300}
                        finishPercent={40}
                        brushSize={32}
                        onComplete={handleScratchComplete}
                      >
                        <div className="scratch-underlay"><IoGiftOutline aria-hidden="true" /><span>Ta surprise Beaufort</span></div>
                      </ScratchCard>
                    </div>
                  ) : (
                    wonReward && <>
                      <WinMessage reward={wonReward} promoCode={promoCode} />
                      <ShareResult />
                      <div className="form-action"><Button onClick={startNewGame}>Rejouer</Button></div>
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
