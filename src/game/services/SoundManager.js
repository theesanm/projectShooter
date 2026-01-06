import Phaser from 'phaser';

export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.audioBuffers = new Map(); // Store loaded audio buffers
    this.templates = {
      weapons: null,
      bosses: null,
      powerups: null,
      waves: null
    };

    // Master volume controls
    this.masterVolume = 0.7;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.8;

    // Audio readiness flag
    this.isAudioReady = false;

    // Initialize Web Audio API
    this.initAudioContext();

    // Load templates synchronously
    this.loadTemplatesSync();

    console.log('[SoundManager] Initialized');
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[SoundManager] Audio context initialized');
    } catch (error) {
      console.error('[SoundManager] Failed to initialize audio context:', error);
    }
  }

  unlockAudio() {
    // Unlock audio context on first user interaction
    const unlock = () => {
      console.log('[SoundManager] Unlocking audio context...');
      this.scene.sound.unlock();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }

  loadTemplatesSync() {
    try {
      // For now, we'll use hardcoded templates since fetch is async
      // In a real implementation, you'd load these from files synchronously
      this.templates.weapons = {
        "basicPistol": {
          "name": "Basic Pistol",
          "shoot": "pistol_shot.wav",
          "volume": 0.6,
          "pitch": 1.0
        }
      };

      this.templates.bosses = {
        "normalRed": {
          "name": "Red Dragon",
          "spawn": "dragon_roar.wav",
          "alive": "dragon_roar.wav",
          "death": "dragon_death.wav",
          "spawnVolume": 0.8,
          "aliveVolume": 0.3,
          "deathVolume": 1.0
        },
        "pinkSpecial": {
          "name": "Pink Dragon",
          "spawn": "dragon_roar.wav",
          "alive": "dragon_roar.wav",
          "death": "dragon_death.wav",
          "spawnVolume": 0.8,
          "aliveVolume": 0.3,
          "deathVolume": 1.0
        },
        "purpleLaneSwitcher": {
          "name": "Purple Dragon",
          "spawn": "dragon_roar.wav",
          "alive": "dragon_roar.wav",
          "death": "dragon_death.wav",
          "spawnVolume": 0.8,
          "aliveVolume": 0.3,
          "deathVolume": 1.0
        },
        "goldenTank": {
          "name": "Golden Dragon",
          "spawn": "dragon_roar.wav",
          "alive": "dragon_roar.wav",
          "death": "dragon_death.wav",
          "spawnVolume": 0.8,
          "aliveVolume": 0.3,
          "deathVolume": 1.0
        }
      };

      this.templates.powerups = {
        "lvl1PowerUp": {
          "name": "Speed Boost",
          "collect": "powerup_speed_collect.wav",
          "volume": 0.7,
          "pitch": 1.2
        },
        "lvl2PowerUp": {
          "name": "Damage Boost",
          "collect": "powerup_damage_collect.wav",
          "volume": 0.8,
          "pitch": 1.0
        }
      };

      this.templates.voices = {
        "defaultPlayer": {
          "name": "Default Player",
          "bossDefeat": "yeh.mp3",
          "volume": 0.9
        }
      };

      this.templates.waves = {
        "wave1": {
          "name": "Dragon's Awakening",
          "backgroundMusic": "wave1_background.wav",
          "ambientSound": "wave1_ambient.wav",
          "musicVolume": 0.4,
          "ambientVolume": 0.2
        }
      };

      console.log('[SoundManager] Sound templates loaded synchronously');
      console.log('[SoundManager] Loaded templates:', this.templates);
    } catch (error) {
      console.error('[SoundManager] Failed to load sound templates:', error);
    }
  }

  preloadSounds() {
    console.log('[SoundManager] Starting preloadSounds...');
    console.log('[SoundManager] Templates check - weapons:', !!this.templates.weapons, 'bosses:', !!this.templates.bosses, 'powerups:', !!this.templates.powerups, 'waves:', !!this.templates.waves);
    
    // Collect all sound files to load
    this.soundFiles = [];
    
    if (this.templates.weapons) {
      console.log('[SoundManager] Loading weapons, values:', Object.values(this.templates.weapons));
      Object.values(this.templates.weapons).forEach(weapon => {
        if (weapon.shoot) {
          const key = weapon.shoot.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/weapons/${weapon.shoot}`;
          console.log(`[SoundManager] Loading weapon sound: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'weapon' });
        }
      });
    }

    if (this.templates.bosses) {
      console.log('[SoundManager] Loading bosses, values:', Object.values(this.templates.bosses));
      Object.values(this.templates.bosses).forEach(boss => {
        if (boss.spawn) {
          const key = boss.spawn.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/bosses/${boss.spawn}`;
          console.log(`[SoundManager] Loading boss spawn sound: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'boss' });
        }
        if (boss.death) {
          const key = boss.death.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/bosses/${boss.death}`;
          console.log(`[SoundManager] Loading boss death sound: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'boss' });
        }
      });
    }

    if (this.templates.powerups) {
      console.log('[SoundManager] Loading powerups, values:', Object.values(this.templates.powerups));
      Object.values(this.templates.powerups).forEach(powerup => {
        if (powerup.collect) {
          const key = powerup.collect.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/powerups/${powerup.collect}`;
          console.log(`[SoundManager] Loading powerup sound: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'powerup' });
        }
      });
    }

    if (this.templates.voices) {
      console.log('[SoundManager] Loading voices, values:', Object.values(this.templates.voices));
      Object.values(this.templates.voices).forEach(voice => {
        if (voice.bossDefeat) {
          const key = voice.bossDefeat.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/voices/${voice.bossDefeat}`;
          console.log(`[SoundManager] Loading voice sound: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'voice' });
        }
      });
    }

    if (this.templates.waves) {
      console.log('[SoundManager] Loading waves, values:', Object.values(this.templates.waves));
      Object.values(this.templates.waves).forEach(wave => {
        if (wave.backgroundMusic) {
          const key = wave.backgroundMusic.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/waves/${wave.backgroundMusic}`;
          console.log(`[SoundManager] Loading wave music: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'wave' });
        }
        if (wave.ambientSound) {
          const key = wave.ambientSound.replace(/\.(wav|mp3)$/i, '');
          const path = `/assets/sounds/waves/${wave.ambientSound}`;
          console.log(`[SoundManager] Loading wave ambient: ${key} from ${path}`);
          this.scene.load.binary(key, path);
          this.soundFiles.push({ key, path, type: 'wave' });
        }
      });
    }

    console.log('[SoundManager] Sound files preloaded');
  }

  async decodeLoadedAudio() {
    if (!this.audioContext || !this.soundFiles) {
      console.error('[SoundManager] No audio context or sound files to decode');
      return;
    }

    console.log('[SoundManager] Decoding loaded audio files...');

    for (const soundFile of this.soundFiles) {
      try {
        const binaryData = this.scene.cache.binary.get(soundFile.key);
        if (binaryData) {
          const audioBuffer = await this.audioContext.decodeAudioData(binaryData.slice());
          this.audioBuffers.set(soundFile.key, audioBuffer);
          console.log(`[SoundManager] Decoded audio: ${soundFile.key}`);
        } else {
          console.error(`[SoundManager] No binary data found for: ${soundFile.key}`);
        }
      } catch (error) {
        console.error(`[SoundManager] Failed to decode audio ${soundFile.key}:`, error);
      }
    }

    console.log('[SoundManager] Audio decoding complete');
    this.isAudioReady = true;
  }

  playWeaponSound(weaponId, soundType = 'shoot') {
    if (!this.templates.weapons || !this.templates.weapons[weaponId]) {
      console.warn(`[SoundManager] Weapon ${weaponId} not found in templates`);
      return;
    }

    const weapon = this.templates.weapons[weaponId];
    const soundFile = weapon[soundType];
    const volume = 1.0; // Test with full volume

    if (soundFile) {
      console.log(`[SoundManager] Playing weapon sound: ${weaponId} -> ${soundFile}`);
      this.playSound(soundFile.replace(/\.(wav|mp3)$/i, ''), volume * this.sfxVolume * this.masterVolume);
    }
  }

  playBossSound(bossId, soundType = 'spawn') {
    if (!this.templates.bosses || !this.templates.bosses[bossId]) {
      console.warn(`[SoundManager] Boss ${bossId} not found in templates`);
      return;
    }

    const boss = this.templates.bosses[bossId];
    const soundFile = boss[soundType];
    const volumeKey = `${soundType}Volume`;
    const volume = boss[volumeKey] || 0.7;

    if (soundFile) {
      if (soundType === 'alive') {
        // Loop alive sounds
        this.playSoundLoop(soundFile.replace(/\.(wav|mp3)$/i, ''), volume * this.sfxVolume * this.masterVolume);
      } else {
        this.playSound(soundFile.replace(/\.(wav|mp3)$/i, ''), volume * this.sfxVolume * this.masterVolume);
      }
    }
  }

  stopBossSound(bossId, soundType = 'alive') {
    if (!this.templates.bosses || !this.templates.bosses[bossId]) {
      return;
    }

    const boss = this.templates.bosses[bossId];
    const soundFile = boss[soundType];

    if (soundFile) {
      this.stopSound(soundFile.replace(/\.(wav|mp3)$/i, ''));
    }
  }

  playPowerupSound(powerupId) {
    if (!this.templates.powerups || !this.templates.powerups[powerupId]) {
      console.warn(`[SoundManager] Powerup ${powerupId} not found in templates`);
      return;
    }

    const powerup = this.templates.powerups[powerupId];
    const soundFile = powerup.collect;
    const volume = powerup.volume || 0.7;

    if (soundFile) {
      this.playSound(soundFile.replace(/\.(wav|mp3)$/i, ''), volume * this.sfxVolume * this.masterVolume);
    }
  }

  playPlayerVocal(playerId, vocalType = 'bossDefeat') {
    if (!this.templates.voices || !this.templates.voices[playerId]) {
      console.warn(`[SoundManager] Player ${playerId} not found in voice templates`);
      return;
    }

    const voice = this.templates.voices[playerId];
    const soundFile = voice[vocalType];
    const volume = voice.volume || 0.8;

    if (soundFile) {
      console.log(`[SoundManager] Playing player vocal: ${playerId} -> ${soundFile}`);
      this.playSound(soundFile.replace(/\.(wav|mp3)$/i, ''), volume * this.sfxVolume * this.masterVolume);
    }
  }

  playWaveMusic(waveId) {
    if (!this.templates.waves || !this.templates.waves[waveId]) {
      console.warn(`[SoundManager] Wave ${waveId} not found in templates`);
      return;
    }

    const wave = this.templates.waves[waveId];
    const musicFile = wave.backgroundMusic;
    const volume = wave.musicVolume || 0.5;

    if (musicFile) {
      // Stop any currently playing music first
      this.stopAllMusic();
      this.playSoundLoop(musicFile.replace(/\.(wav|mp3)$/i, ''), volume * this.musicVolume * this.masterVolume);
    }
  }

  playWaveAmbient(waveId) {
    if (!this.templates.waves || !this.templates.waves[waveId]) {
      return;
    }

    const wave = this.templates.waves[waveId];
    const ambientFile = wave.ambientSound;
    const volume = wave.ambientVolume || 0.3;

    if (ambientFile) {
      this.playSoundLoop(ambientFile.replace(/\.(wav|mp3)$/i, ''), volume * this.sfxVolume * this.masterVolume);
    }
  }

  stopWaveSounds(waveId) {
    if (!this.templates.waves || !this.templates.waves[waveId]) {
      return;
    }

    const wave = this.templates.waves[waveId];
    if (wave.backgroundMusic) {
      this.stopSound(wave.backgroundMusic.replace(/\.(wav|mp3)$/i, ''));
    }
    if (wave.ambientSound) {
      this.stopSound(wave.ambientSound.replace(/\.(wav|mp3)$/i, ''));
    }
  }

  playSound(soundKey, volume = 1.0) {
    try {
      const audioBuffer = this.audioBuffers.get(soundKey);
      if (audioBuffer && this.audioContext) {
        console.log(`[SoundManager] Playing sound ${soundKey} with Web Audio API at volume ${volume}`);
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(0);
      } else {
        console.warn(`[SoundManager] Audio buffer ${soundKey} not loaded or no audio context. Available buffers:`, Array.from(this.audioBuffers.keys()));
      }
    } catch (error) {
      console.error(`[SoundManager] Error playing sound ${soundKey}:`, error);
    }
  }

  playSoundLoop(soundKey, volume = 1.0) {
    try {
      const audioBuffer = this.audioBuffers.get(soundKey);
      if (audioBuffer && this.audioContext) {
        console.log(`[SoundManager] Playing looped sound ${soundKey} with Web Audio API at volume ${volume}`);
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.loop = true;
        gainNode.gain.value = volume * this.musicVolume * this.masterVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start(0);
        
        // Store the source for stopping later
        if (!this.sounds.has(soundKey)) {
          this.sounds.set(soundKey, []);
        }
        this.sounds.get(soundKey).push({ source, gainNode });
      } else {
        console.warn(`[SoundManager] Audio buffer ${soundKey} not loaded or no audio context`);
      }
    } catch (error) {
      console.error(`[SoundManager] Error playing looped sound ${soundKey}:`, error);
    }
  }

  stopSound(soundKey) {
    try {
      const soundInstances = this.sounds.get(soundKey);
      if (soundInstances) {
        soundInstances.forEach(instance => {
          try {
            instance.source.stop();
          } catch (error) {
            // Source might already be stopped
          }
        });
        this.sounds.delete(soundKey);
      }
    } catch (error) {
      console.error(`[SoundManager] Error stopping sound ${soundKey}:`, error);
    }
  }

  stopAllMusic() {
    // Stop all looped sounds (music)
    this.sounds.forEach((instances, soundKey) => {
      instances.forEach(instance => {
        try {
          instance.source.stop();
        } catch (error) {
          // Source might already be stopped
        }
      });
    });
    this.sounds.clear();
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  pauseAll() {
    // Web Audio API doesn't have built-in pause, so we'll suspend the context
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resumeAll() {
    // Resume the audio context
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  destroy() {
    this.stopAllMusic();
    this.sounds.clear();
    console.log('[SoundManager] Destroyed');
  }
}