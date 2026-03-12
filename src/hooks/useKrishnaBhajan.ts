// Krishna Bhajan audio synthesizer using Web Audio API
// Creates a melodic "Hare Krishna" style instrumental

export const createKrishnaBhajanAudio = (): { play: () => void; pause: () => void; stop: () => void; isPlaying: () => boolean } => {
  let audioContext: AudioContext | null = null;
  let playing = false;
  let intervalIds: ReturnType<typeof setInterval>[] = [];
  let gainNode: GainNode | null = null;

  // Indian pentatonic scale notes (Sa Re Ga Ma Pa Dha Ni Sa)
  const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  
  // Melody pattern for Hare Krishna mantra rhythm
  const melodyPattern = [
    0, 2, 4, 5, 4, 2, 0, 2,  // Hare Krishna
    4, 5, 7, 5, 4, 2, 4, 2,  // Hare Krishna
    5, 4, 2, 0, 2, 4, 5, 4,  // Krishna Krishna
    2, 0, 2, 4, 2, 0, 2, 0,  // Hare Hare
  ];

  const playNote = (ctx: AudioContext, freq: number, startTime: number, duration: number, gain: GainNode) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);
    
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    noteGain.gain.setValueAtTime(0.15, startTime + duration * 0.7);
    noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(noteGain);
    noteGain.connect(gain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const playDrone = (ctx: AudioContext, gain: GainNode) => {
    // Tanpura-like drone on Sa
    const drone1 = ctx.createOscillator();
    drone1.type = "sine";
    drone1.frequency.value = 130.81; // Low Sa
    
    const drone2 = ctx.createOscillator();
    drone2.type = "sine";
    drone2.frequency.value = 196.00; // Pa
    
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.06;
    
    drone1.connect(droneGain);
    drone2.connect(droneGain);
    droneGain.connect(gain);
    
    drone1.start();
    drone2.start();
    
    return { stop: () => { drone1.stop(); drone2.stop(); } };
  };

  const playMelodyCycle = (ctx: AudioContext, gain: GainNode) => {
    const noteDuration = 0.35;
    let noteIndex = 0;
    
    const interval = setInterval(() => {
      if (!playing) return;
      
      const patternIndex = noteIndex % melodyPattern.length;
      const noteFreq = notes[melodyPattern[patternIndex]];
      
      playNote(ctx, noteFreq, ctx.currentTime, noteDuration * 0.9, gain);
      
      // Add tabla-like rhythm every 4 notes
      if (noteIndex % 4 === 0) {
        const tablaOsc = ctx.createOscillator();
        tablaOsc.type = "triangle";
        tablaOsc.frequency.setValueAtTime(200, ctx.currentTime);
        tablaOsc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
        
        const tablaGain = ctx.createGain();
        tablaGain.gain.setValueAtTime(0.1, ctx.currentTime);
        tablaGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        tablaOsc.connect(tablaGain);
        tablaGain.connect(gain);
        tablaOsc.start(ctx.currentTime);
        tablaOsc.stop(ctx.currentTime + 0.15);
      }
      
      noteIndex++;
    }, noteDuration * 1000);
    
    intervalIds.push(interval);
  };

  let droneRef: { stop: () => void } | null = null;

  return {
    play: () => {
      if (playing) return;
      playing = true;
      
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      
      gainNode = audioContext.createGain();
      gainNode.gain.value = 0.5;
      gainNode.connect(audioContext.destination);
      
      droneRef = playDrone(audioContext, gainNode);
      playMelodyCycle(audioContext, gainNode);
    },
    pause: () => {
      playing = false;
      intervalIds.forEach(clearInterval);
      intervalIds = [];
      if (droneRef) { try { droneRef.stop(); } catch {} droneRef = null; }
    },
    stop: () => {
      playing = false;
      intervalIds.forEach(clearInterval);
      intervalIds = [];
      if (droneRef) { try { droneRef.stop(); } catch {} droneRef = null; }
      if (audioContext) { audioContext.close(); audioContext = null; }
    },
    isPlaying: () => playing,
  };
};
