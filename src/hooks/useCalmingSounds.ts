import { useRef, useState, useEffect } from "react";

// Generate ambient sounds using Web Audio API
export const useCalmingSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Create white noise buffer (base for ocean/rain)
  const createNoiseBuffer = (ctx: AudioContext, duration: number): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  };

  // Create ocean wave effect
  const playOcean = (ctx: AudioContext, gainNode: GainNode) => {
    const noiseBuffer = createNoiseBuffer(ctx, 4);
    
    const playWave = () => {
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 500;
      
      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0, ctx.currentTime);
      waveGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);
      waveGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
      
      source.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(gainNode);
      
      source.start(ctx.currentTime);
      sourceNodesRef.current.push(source);
      
      source.onended = () => {
        const index = sourceNodesRef.current.indexOf(source);
        if (index > -1) sourceNodesRef.current.splice(index, 1);
      };
    };

    playWave();
    intervalRef.current = setInterval(playWave, 3500);
  };

  // Create rain effect
  const playRain = (ctx: AudioContext, gainNode: GainNode) => {
    const noiseBuffer = createNoiseBuffer(ctx, 2);
    
    const playDrop = () => {
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;
      
      const dropGain = ctx.createGain();
      dropGain.gain.value = 0.15;
      
      source.connect(filter);
      filter.connect(dropGain);
      dropGain.connect(gainNode);
      
      source.loop = true;
      source.start();
      sourceNodesRef.current.push(source);
    };

    playDrop();
  };

  // Create fire/crackling effect
  const playFire = (ctx: AudioContext, gainNode: GainNode) => {
    const playCrackle = () => {
      const osc = ctx.createOscillator();
      osc.frequency.value = 100 + Math.random() * 200;
      osc.type = "sawtooth";
      
      const crackleGain = ctx.createGain();
      crackleGain.gain.setValueAtTime(0.2, ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.connect(crackleGain);
      crackleGain.connect(gainNode);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    };

    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.3) playCrackle();
    }, 100);
    
    // Base rumble
    const noiseBuffer = createNoiseBuffer(ctx, 2);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 200;
    
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.1;
    
    source.connect(filter);
    filter.connect(baseGain);
    baseGain.connect(gainNode);
    
    source.loop = true;
    source.start();
    sourceNodesRef.current.push(source);
  };

  // Create bird songs effect
  const playBirds = (ctx: AudioContext, gainNode: GainNode) => {
    const playChirp = () => {
      const osc = ctx.createOscillator();
      const baseFreq = 2000 + Math.random() * 2000;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, ctx.currentTime + 0.1);
      
      const chirpGain = ctx.createGain();
      chirpGain.gain.setValueAtTime(0, ctx.currentTime);
      chirpGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(chirpGain);
      chirpGain.connect(gainNode);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    };

    const randomChirps = () => {
      if (Math.random() > 0.6) {
        const chirps = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < chirps; i++) {
          setTimeout(playChirp, i * 100);
        }
      }
    };

    intervalRef.current = setInterval(randomChirps, 800);
  };

  const playSound = (soundKey: string) => {
    // Stop current sound if any
    stopSound();

    if (playingSound === soundKey) {
      return; // Toggle off
    }

    setIsLoading(true);
    
    try {
      const ctx = getAudioContext();
      
      // Resume context if suspended
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.5;
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      switch (soundKey) {
        case "ocean":
          playOcean(ctx, gainNode);
          break;
        case "rain":
          playRain(ctx, gainNode);
          break;
        case "fire":
          playFire(ctx, gainNode);
          break;
        case "birds":
          playBirds(ctx, gainNode);
          break;
      }

      setPlayingSound(soundKey);
    } catch (error) {
      console.error("Error playing sound:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSound = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    sourceNodesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    });
    sourceNodesRef.current = [];

    setPlayingSound(null);
  };

  useEffect(() => {
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { playSound, stopSound, playingSound, isLoading };
};
