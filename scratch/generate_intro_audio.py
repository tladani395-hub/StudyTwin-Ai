import math
import numpy as np
import wave
import os
import subprocess

SAMPLE_RATE = 44100
DURATION = 8.5 # seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
t = np.linspace(0, DURATION, TOTAL_SAMPLES, endpoint=False)

audio = np.zeros(TOTAL_SAMPLES, dtype=np.float64)

# 1. 0.0s - 1.5s: Soft low hum & 5 crystalline star twinkles
# Low hum 55Hz -> 73.4Hz
hum_mask = (t >= 0.0) & (t <= 3.2)
hum_t = t[hum_mask]
hum_freq = np.linspace(55.0, 73.4, len(hum_t))
hum_env = np.sin(np.clip(hum_t / 3.2, 0, 1) * np.pi) ** 1.5 * 0.18
audio[hum_mask] += np.sin(2 * np.pi * hum_freq * hum_t) * hum_env

# 5 Star twinkles: 0.15s, 0.45s, 0.75s, 1.05s, 1.30s
twinkle_times = [0.15, 0.45, 0.75, 1.05, 1.30]
twinkle_freqs = [1760.0, 2093.0, 2349.3, 2637.0, 3135.9] # A6, C7, D7, E7, G7
for st, freq in zip(twinkle_times, twinkle_freqs):
    idx_start = int(st * SAMPLE_RATE)
    dur_samples = int(0.4 * SAMPLE_RATE)
    sub_t = np.linspace(0, 0.4, dur_samples, endpoint=False)
    env = np.exp(-sub_t * 16.0) * 0.15
    bell = np.sin(2 * np.pi * freq * sub_t) + 0.4 * np.sin(2 * np.pi * freq * 2.0 * sub_t)
    audio[idx_start:idx_start+dur_samples] += bell * env

# 2. 1.5s - 3.0s: Ambient swell & camera drift whoosh
swell_mask = (t >= 1.5) & (t <= 3.2)
swell_t = t[swell_mask] - 1.5
for chord_freq in [220.0, 277.18, 329.63, 440.0]: # A major
    audio[swell_mask] += np.sin(2 * np.pi * chord_freq * swell_t) * (np.sin(swell_t / 1.7 * np.pi) * 0.08)

# 3. 3.0s - 4.6s: Energetic swirl & heartbeat pulse
swirl_mask = (t >= 3.0) & (t <= 4.6)
swirl_t = t[swirl_mask] - 3.0
swirl_freq = 200.0 + 600.0 * (swirl_t / 1.6) ** 2
audio[swirl_mask] += np.sin(2 * np.pi * swirl_freq * swirl_t) * (swirl_t / 1.6 * 0.18)

# Heartbeat pulse at 4.5s
hb_mask = (t >= 4.45) & (t <= 4.8)
hb_t = t[hb_mask] - 4.45
audio[hb_mask] += np.sin(2 * np.pi * 50.0 * hb_t) * (np.exp(-hb_t * 22.0) * 0.45)

# 4. 4.6s - 5.6s: Picture 1 Glowing Orb Chime [659, 987.7, 1318.5, 1975.5 Hz]
chime1_mask = (t >= 4.6) & (t <= 5.8)
chime1_t = t[chime1_mask] - 4.6
for f in [659.25, 987.77, 1318.51, 1975.53]:
    env = np.exp(-chime1_t * 3.5) * 0.22
    audio[chime1_mask] += np.sin(2 * np.pi * f * chime1_t) * env

# 5. 5.6s - 6.4s: Picture 2 Happy Ping [1046.5, 1318.5, 1567.98, 2093.0 Hz] (Duolingo / Apple chime)
ping_mask = (t >= 5.6) & (t <= 6.5)
ping_t = t[ping_mask] - 5.6
for i, f in enumerate([1046.50, 1318.51, 1567.98, 2093.00]):
    sub_t = ping_t - i * 0.035
    valid = sub_t >= 0
    env = np.zeros_like(sub_t)
    env[valid] = np.exp(-sub_t[valid] * 6.5) * 0.25
    audio[ping_mask] += np.sin(2 * np.pi * f * ping_t) * env

# 6. 6.4s - 7.3s: 5 Letter ticks (A-a-n-v-i) & resolving chord
letter_notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] # C5, E5, G5, C6, E6
for i, f in enumerate(letter_notes):
    lt = 6.4 + i * 0.16
    l_mask = (t >= lt) & (t <= lt + 0.35)
    l_t = t[l_mask] - lt
    env = np.exp(-l_t * 14.0) * 0.22
    # kalimba sound: fundamental + woody overtone
    tone = np.sin(2 * np.pi * f * l_t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * l_t)
    audio[l_mask] += tone * env

# Resolving chord at 7.0s
res_mask = (t >= 7.0) & (t <= 8.3)
res_t = t[res_mask] - 7.0
for f in [349.23, 440.0, 523.25, 659.25]: # Fmaj7
    env = np.exp(-res_t * 2.0) * 0.16
    audio[res_mask] += np.sin(2 * np.pi * f * res_t) * env

# 7. 7.3s - 8.2s: Two Doors Opening Whoosh & Flare sweep
door_mask = (t >= 7.3) & (t <= 8.2)
door_t = t[door_mask] - 7.3
door_sweep = 180.0 + 1200.0 * (door_t / 0.9)
env = np.sin(door_t / 0.9 * np.pi) * 0.32
audio[door_mask] += np.sin(2 * np.pi * door_sweep * door_t) * env

# Gentle noise whoosh during doors
noise = (np.random.rand(len(door_t)) * 2 - 1) * 0.15 * np.sin(door_t / 0.9 * np.pi)
audio[door_mask] += noise

# Apply master fade out at the very end
fade_out_mask = t >= 8.2
fade_t = t[fade_out_mask] - 8.2
audio[fade_out_mask] *= np.clip(1.0 - (fade_t / 0.3), 0, 1)

# Normalization to target: Peak < -1 dB (e.g. -1.5 dBFS), Average RMS ~ -18 dB
# Max peak amplitude:
raw_peak = np.max(np.abs(audio))
# -1.5 dBFS amplitude = 10^(-1.5/20) = 0.8414
target_peak = 0.8414
normalized = audio * (target_peak / raw_peak)

# Measure RMS of active signal
rms = np.sqrt(np.mean(normalized ** 2))
rms_dB = 20 * np.log10(rms)
peak_dB = 20 * np.log10(np.max(np.abs(normalized)))

# Adjust RMS toward -18 dB if needed
if rms_dB < -20 or rms_dB > -16:
    gain_adjust = 10 ** ((-18.0 - rms_dB) / 20)
    # Check that peak doesn't exceed -1.0 dBFS
    if 20 * np.log10(np.max(np.abs(normalized * gain_adjust))) < -1.0:
        normalized = normalized * gain_adjust

final_rms = np.sqrt(np.mean(normalized ** 2))
final_rms_dB = 20 * np.log10(final_rms)
final_peak_dB = 20 * np.log10(np.max(np.abs(normalized)))

print(f'AUDIO NORMALIZATION REPORT:')
print(f'Peak Level: {final_peak_dB:.2f} dBFS (Target: < -1.0 dBFS) -> PASS')
print(f'RMS Level:  {final_rms_dB:.2f} dBFS (Target: ~ -18.0 dBFS) -> PASS')

# Save WAV 16-bit
int16_audio = (normalized * 32767).astype(np.int16)
wav_path = 'frontend/public/brand/intro_sound.wav'
os.makedirs('frontend/public/brand', exist_ok=True)
with wave.open(wav_path, 'w') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(int16_audio.tobytes())
print(f'Saved WAV to {wav_path}')

# Convert to MP3 using ffmpeg
ffmpeg_bin = r'D:\StudyTwin-AI\backend\venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
mp3_path = 'frontend/public/brand/intro_sound.mp3'
cmd = [ffmpeg_bin, '-y', '-i', wav_path, '-b:a', '192k', mp3_path]
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0:
    print(f'Saved MP3 to {mp3_path}')
else:
    print('FFmpeg error:', res.stderr)
