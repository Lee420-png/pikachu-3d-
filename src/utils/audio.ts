export const playThunderSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Function to create a short crackle/zap sound
    const createZap = (timeOffset: number) => {
      // Noise buffer for the crackle
      const bufferSize = audioCtx.sampleRate * 0.15; // 150ms length
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.8; 
      }
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Bandpass filter to make it sound "sparky" and electric
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 4000 + Math.random() * 2000; // randomize frequency

      // Volume envelope for the zap
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + timeOffset);
      gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + timeOffset + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + timeOffset + 0.15);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseSource.start(audioCtx.currentTime + timeOffset);
    };

    // Create a sequence of zaps for an erratic electric crackle effect
    createZap(0);
    createZap(0.04);
    createZap(0.12);
    createZap(0.18);
    createZap(0.3);
    
    // Deeper thunder "boom" to accompany the zaps
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5); // pitch drop
    
    // Apply lowpass filter to muffle the square wave into a bass rumble
    const rumbleFilter = audioCtx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 400;

    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
    oscGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.connect(rumbleFilter);
    rumbleFilter.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
    
  } catch (e) {
    console.error("Web Audio API not supported or blocked", e);
  }
};
