import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { IoLogoWhatsapp } from "react-icons/io";


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
    description: "Ta prochaine coupe est offerte !", 
    emoji: "✂️",
    color: "from-purple-500 to-purple-700",
    probability: 0.04
  },
  { 
    id: 2, 
    title: "30% de réduction", 
    description: "Sur ta prochaine visite", 
    emoji: "🎉",
    color: "from-green-500 to-green-700",
    probability: 0.04
  },
  { 
    id: 3, 
    title: "Pigmentation offerte", 
    description: "Valable sur ta prochaine coupe", 
    emoji: "🎨",
    color: "from-blue-500 to-blue-700",
    probability: 0.04
  },
  { 
    id: 4, 
    title: "20% de réduction", 
    description: "À utiliser dans les 30 jours", 
    emoji: "💰",
    color: "from-yellow-500 to-yellow-700",
    probability: 0.04
  },
  { 
    id: 5, 
    title: "10% de réduction", 
    description: "Sur ta prochaine prestation", 
    emoji: "🎁",
    color: "from-orange-500 to-orange-700",
    probability: 0.04
  },
  {
    id: 0,
    title: "Pas de chance cette fois !",
    description: "Reviens nous voir bientôt pour une nouvelle chance 🙏",
    emoji: "😔",
    color: "from-gray-500 to-gray-700",
    probability: 0.80 // 80% de chance de ne rien gagner
  }
];



const WinMessage = ({ reward }) => {
  const [confetti, setConfetti] = useState([]);
  const isWin = reward.id !== 0; // Si c'est pas l'ID 0, c'est un gain

  useEffect(() => {
    if (isWin) {
      const pieces = [];
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
        });
      }
      setConfetti(pieces);
    }
  }, [isWin]);

  return (
    <>
      {isWin && (
        <>
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {confetti.map((piece) => (
              <div
                key={piece.id}
                className="absolute w-2 h-2 animate-fall"
                style={{
                  left: `${piece.x}%`,
                  top: '-10px',
                  backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][piece.id % 5],
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes fall {
              to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
              }
            }
            .animate-fall {
              animation: fall linear forwards;
            }
          `}</style>
        </>
      )}
      <div className="text-center space-y-6 py-6">
        <div className={`bg-linear-to-r ${reward.color} text-white rounded-lg p-8 shadow-2xl transform ${isWin ? 'scale-105' : ''}`}>
          <div className="text-6xl mb-4">{reward.emoji}</div>
          <h2 className="text-3xl font-bold mb-2">
            {isWin ? '🎉 Félicitations !' : 'Dommage !'}
          </h2>
          <div className="text-2xl font-bold mb-2">{reward.title}</div>
          <p className="text-lg opacity-90">{reward.description}</p>
        </div>
        {!isWin && (
          <p className="text-gray-600 text-sm">
            Continue à nous soutenir et tente ta chance la prochaine fois ! 💪
          </p>
        )}
      </div>
    </>
  );
};


// Radio Button Component
const RadioButton = ({ id, name, value, checked, onChange, label }) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-center w-full p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        checked
          ? 'border-[#ffcc00] bg-[#ffcc00]/5'
          : 'border-gray-200 bg-white hover:border-gray-300'
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
      <div className="flex items-center justify-center w-5 h-5 mr-3 shrink-0">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            checked ? 'border-[#ffcc00]' : 'border-gray-300'
          }`}
        >
          {checked && (
            <div className="w-3 h-3 rounded-full bg-[#ffcc00]"></div>
          )}
        </div>
      </div>
      <span className={`text-base ${checked ? 'text-[#010006] font-semibold' : 'text-gray-600'}`}>
        {label}
      </span>
    </label>
  );
};

// Input Component
const Input = ({ label, icon, error, ...props }) => (
  <div className="flex flex-col gap-y-2">
    {label && <label className="text-sm font-semibold text-[#010006]">{label}</label>}
    {icon ? (
      <div className={`flex gap-3 items-center border-2 px-4 py-3 rounded-xl transition-all ${
        error 
          ? 'border-red-500 focus-within:border-red-600' 
          : 'border-gray-200 focus-within:border-[#ffcc00]'
      }`}>
        {icon}
        <input
          className="outline-none flex-1 text-[#010006] placeholder:text-gray-400"
          {...props}
        />
      </div>
    ) : (
      <input
        className={`w-full border-2 px-4 py-3 rounded-xl outline-none transition-all text-[#010006] placeholder:text-gray-400 ${
          error 
            ? 'border-red-500 focus:border-red-600' 
            : 'border-gray-200 focus:border-[#ffcc00]'
        }`}
        {...props}
      />
    )}
    {error && <span className="text-sm text-red-500 font-medium">{error}</span>}
  </div>
);

// Textarea Component
const Textarea = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-y-2">
    {label && <label className="text-sm font-semibold text-[#010006]">{label}</label>}
    <textarea
      className={`w-full border-2 px-4 py-3 rounded-xl outline-none transition-all text-[#010006] placeholder:text-gray-400 min-h-[120px] resize-none ${
        error 
          ? 'border-red-500 focus:border-red-600' 
          : 'border-gray-200 focus:border-[#ffcc00]'
      }`}
      {...props}
    />
    {error && <span className="text-sm text-red-500 font-medium">{error}</span>}
  </div>
);

// Button Component
const Button = ({ children, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-[#ffcc00] text-[#010006] hover:bg-[#e6b800] active:scale-98",
    secondary: "bg-gray-100 text-[#010006] hover:bg-gray-200 active:scale-98"
  };

  return (
    <button 
      className={`
        w-full h-12 px-6 text-sm font-bold rounded-full
        transition-all duration-200 shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Emoji Rating Component
const EmojiRating = ({ value, onChange, error }) => {
  const EMOJIS = [
    { value: 1, label: "😤", description: "Mou-mou, c'était pas ça" },
    { value: 2, label: "🙂", description: "Bon, ça peut aller" },
    { value: 3, label: "😎", description: "Frais p'tit-p'tit" },
    { value: 4, label: "🤩", description: "Très très propre !" },
    { value: 5, label: "🔥", description: "La coupe a parlé !" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center flex-wrap gap-3">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji.value}
            onClick={() => onChange(emoji.value)}
            type="button"
            className={`
              text-4xl transition-all p-4 rounded-2xl border-2
              ${value === emoji.value 
                ? 'border-[#ffcc00] bg-[#ffcc00]/10 scale-110' 
                : 'border-gray-200 hover:border-gray-300 hover:scale-105'
              }
            `}
            title={emoji.description}
          >
            {emoji.label}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-center text-sm font-medium text-gray-600">
          {EMOJIS.find(e => e.value === value)?.description}
        </p>
      )}
      {error && <span className="text-sm text-red-500 font-medium text-center">{error}</span>}
    </div>
  );
};

// Page Container Component
const PageContainer = ({ children, className = "" }) => (
  <div className={`min-h-screen max-w-md mx-auto bg-white ${className}`}>
    {children}
  </div>
);

// Page Header Component
const PageHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-[#010006] leading-tight mb-2">
      {title}
    </h1>
    {subtitle && (
      <p className="text-gray-600 text-sm leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);
// 🎨 COMPOSANT SCRATCH CARD CANVAS AVEC SUPPORT TACTILE
const ScratchCard = ({ width = 280, height = 280, finishPercent = 40, onComplete, brushSize = 25, children }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isCompleteRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Draw scratch layer with silver color
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRATTE ICI', width / 2, height / 2);
    
    ctx.globalCompositeOperation = 'destination-out';
  }, [width, height]);

  // Check scratch percentage
  const checkScratchPercentage = useCallback(() => {
    if (isCompleteRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let transparent = 0;
    const total = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) {
        transparent++;
      }
    }

    const percentage = (transparent / total) * 100;

    if (percentage >= finishPercent) {
      isCompleteRef.current = true;
      setIsComplete(true);
      
      if (onComplete) {
        onComplete({ percentage, canvas });
      }
    }
  }, [finishPercent, onComplete]);

  // Scratch function with better mobile support
  const scratch = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const x = (clientX - rect.left) * (canvas.width / rect.width) / dpr;
    const y = (clientY - rect.top) * (canvas.height / rect.height) / dpr;

    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.fill();
  }, [brushSize]);

  // Event handlers
  const handlePointerDown = useCallback((e) => {
    if (isCompleteRef.current) return;
    
    setIsScratching(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    scratch(clientX, clientY);
  }, [scratch]);

  const handlePointerMove = useCallback((e) => {
    if (!isScratching || isCompleteRef.current) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    scratch(clientX, clientY);
  }, [isScratching, scratch]);

  const handlePointerUp = useCallback(() => {
    if (isScratching) {
      setIsScratching(false);
      setTimeout(checkScratchPercentage, 100);
    }
  }, [isScratching, checkScratchPercentage]);

  // Setup global event listeners
  useEffect(() => {
    if (isScratching) {
      const handleMove = (e) => {
        e.preventDefault();
        handlePointerMove(e);
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);

      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [isScratching, handlePointerMove, handlePointerUp]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
        }}
        className="border-4 border-gray-300 rounded-lg shadow-xl overflow-hidden"
      >
        {/* Content underneath */}
        <div className="absolute inset-0 w-full h-full">
          {children}
        </div>

        {/* Scratch canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onTouchStart={(e) => {
            e.preventDefault();
            handlePointerDown(e);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: isScratching ? 'grabbing' : 'grab',
            opacity: isComplete ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
            pointerEvents: isComplete ? 'none' : 'auto',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'none',
          }}
        />
      </div>
    </div>
  );
};



function App() {
  const [step, setStep] = useState(1);
  const [selectedGeneration, setSelectedGeneration] = useState('');
  const [rating, setRating] = useState(null);
  const [wonReward, setWonReward] = useState(null);
  const [result, setResult] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();


  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const onSubmitStep2 = (data) => {
    console.log("Step 2:", data);
    handleNext();
  };

  const onSubmitStep3 = (e) => {
    e.preventDefault();
    if (!selectedGeneration) return;
    console.log("Step 3:", selectedGeneration);
    handleNext();
  };

  const onSubmitStep4 = (e) => {
    e.preventDefault();
    if (!rating) return;
    console.log("Step 4:", rating);
    handleNext();
  };

  const onSubmitStep5 = (data) => {
    console.log("Step 5:", data);
    handleNext();
  };

  const generations = [
    { id: 'gen-z', label: 'Génération Z (1997-2012)', value: 'gen-z' },
    { id: 'millennial', label: 'Millennials (1981-1996)', value: 'millennial' },
    { id: 'gen-x', label: 'Génération X (1965-1980)', value: 'gen-x' },
    { id: 'boomer', label: 'Baby Boomers (1946-1964)', value: 'boomer' },
  ];

  const getRandomReward = () => {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const reward of REWARDS) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        return reward;
      }
    }
    return REWARDS[REWARDS.length - 1];
  };

  const handleScratchComplete = async () => {
    const reward = getRandomReward();
    setWonReward(reward);
    setResult('win');
    
    const collectedData = {
      nomPrenom: watch("fullName"),       // Step 2
      contact: watch("whatsapp"),         // Step 2
      trancheAge: selectedGeneration,     // Step 3
      noteEmoji: EMOJIS.find((e) => e.value === rating)?.label,                  // Step 4
      avis: watch("feedback"),            // Step 5
      recompense: reward.title,
      date: new Date().toISOString(),
    };
    
    // Envoyer à Google Sheets
    try {
      console.log(collectedData);
      
      const response = await fetch('https://script.google.com/macros/s/AKfycbwoR5nE2uETkJ4Xl9h68JA-4rr_UTYfPZ4X2NHzSwMppHSD3j5fgPIiIpw33zn5QJ2DzA/exec', {
        method: 'POST',
        mode: 'no-cors', // Important pour Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectedData)
      });
      //console.log('✅ Données envoyées à Google Sheets');
    } catch (error) {
      //console.error('❌ Erreur lors de l\'envoi:', error);
    }
  };


  return (
    <>
      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="
          h-screen w-full bg-[url('/banner.jpg')] bg-cover bg-no-repeat bg-center relative
          max-w-md mx-auto
          after:absolute after:inset-0 after:content-['']
          after:bg-[linear-gradient(180deg,rgba(0,0,0,0)_27.47%,rgba(0,0,0,.9)_40.04%)]
        ">
          <div className="absolute bottom-20 z-10 flex justify-center left-0 right-0 px-6">
            <div className="flex flex-col items-center justify-center w-full">
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-4xl font-bold text-white">
                  Skip the Wait
                </h2>
                <p className="text-white/90 text-base leading-relaxed max-w-sm">
                  Track queues, reach your stylist faster with our app
                </p>
              </div>
              <Button onClick={handleNext}>
                Jouer maintenant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Personal Info */}
      {step === 2 && (
        <PageContainer className="px-6 py-8">
          <PageHeader 
            title="Faisons connaissance"
            subtitle="Partagez vos informations pour commencer"
          />
          
          <form onSubmit={handleSubmit(onSubmitStep2)} className="space-y-5">
            <Input
              label="Nom & Prénoms"
              type="text"
              placeholder="Ex: Jean Kouassi"
              {...register("fullName", { 
                required: "Le nom est requis",
                minLength: { value: 3, message: "Le nom doit contenir au moins 3 caractères" }
              })}
              error={errors.fullName?.message}
            />
            
            <Input
              label="Numéro WhatsApp"
              icon={<IoLogoWhatsapp className='size-6 text-green-500' />}
              type="tel"
              placeholder="Ex: +225 07 07 07 07 07"
              {...register("whatsapp", { 
                required: "Le numéro WhatsApp est requis",
                pattern: { 
                  value: /^[0-9+\s-()]+$/, 
                  message: "Numéro invalide" 
                }
              })}
              error={errors.whatsapp?.message}
            />

            <div className="pt-4">
              <Button type="submit">
                Continuer
              </Button>
            </div>
          </form>
        </PageContainer>
      )}

      {/* Step 3: Generation */}
      {step === 3 && (
        <PageContainer className="px-6 py-8">
          <PageHeader 
            title="À quelle génération appartenez-vous ?"
            subtitle="Sélectionnez votre tranche d'âge"
          />
          
          <form onSubmit={onSubmitStep3} className="space-y-5">
            <div className="space-y-3">
              {generations.map((option) => (
                <RadioButton
                  key={option.id}
                  id={option.id}
                  name="generation"
                  value={option.value}
                  label={option.label}
                  checked={selectedGeneration === option.value}
                  onChange={(e) => setSelectedGeneration(e.target.value)}
                />
              ))}
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={!selectedGeneration}>
                Continuer
              </Button>
            </div>
          </form>
        </PageContainer>
      )}

      {/* Step 4: Rating */}
      {step === 4 && (
        <PageContainer className="px-6 py-8">
          <PageHeader 
            title="Note ta nouvelle coupe"
            subtitle="Comment trouves-tu ta coupe ?"
          />
          
          <form onSubmit={onSubmitStep4} className="space-y-8">
            <EmojiRating 
              value={rating} 
              onChange={setRating}
              error={!rating && "Veuillez sélectionner une note"}
            />

            <div className="pt-4">
              <Button type="submit" disabled={!rating}>
                Continuer
              </Button>
            </div>
          </form>
        </PageContainer>
      )}

      {/* Step 5: Feedback */}
      {step === 5 && (
        <PageContainer className="px-6 py-8">
          <PageHeader 
            title="Avis / Suggestion"
            subtitle="Dites-nous ce que vous pensez"
          />
          
          <form onSubmit={handleSubmit(onSubmitStep5)} className="space-y-5">
            <Textarea
              label="Votre message"
              placeholder="Partagez votre expérience, vos suggestions..."
              {...register("feedback", { 
                required: "Un message est requis",
                minLength: { value: 10, message: "Le message doit contenir au moins 10 caractères" }
              })}
              error={errors.feedback?.message}
            />

            <div className="pt-4">
              <Button type="submit">
                Envoyer
              </Button>
            </div>
          </form>
        </PageContainer>
      )}


      {step === 6 && (
        <PageContainer className="px-6 py-8">
            <PageHeader 
              title="Grattez et gagnez"
              subtitle="Gratte pour découvrir ton prix !"
            />
            {!result && (
            <ScratchCard
              width={280}
              height={280}
              finishPercent={40}
              brushSize={25}
              onComplete={handleScratchComplete}
            >
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-yellow-400 to-yellow-600 text-6xl">
                🎁
              </div>
            </ScratchCard>
            )}
            {result === 'win' && wonReward && <WinMessage reward={wonReward} />}
        </PageContainer>
      )}
    </>
  );
}

export default App;