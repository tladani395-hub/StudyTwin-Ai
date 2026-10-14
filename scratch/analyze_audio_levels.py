import os
import sys
import wave
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUTPUT_DIR = r"C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5"

CUE_WINDOWS = [
    ("Star Chimes (0.15-1.8s)", 0.15, 1.8),
    ("Fly-through Whoosh (3.0-4.6s)", 3.0, 4.6),
    ("Orb Chime (4.6-5.5s)", 4.6, 5.5),
    ("Smile Chime (5.6-6.3s)", 5.6, 6.3),
    ("Letters & Chord (6.4-7.2s)", 6.4, 7.2),
    ("Grand Whoosh (7.3-8.2s)", 7.3, 8.2),
]

def analyze_wav(wav_path, plot_output=None):
    if not os.path.exists(wav_path):
        print(f"Error: {wav_path} not found")
        return None

    with wave.open(wav_path, 'rb') as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        raw_data = wf.readframes(n_frames)

    duration = n_frames / float(framerate)
    
    if sampwidth == 2:
        samples = np.frombuffer(raw_data, dtype=np.int16).astype(np.float64) / 32768.0
    elif sampwidth == 4:
        samples = np.frombuffer(raw_data, dtype=np.int32).astype(np.float64) / 2147483648.0
    else:
        samples = np.frombuffer(raw_data, dtype=np.uint8).astype(np.float64) / 128.0 - 1.0

    if len(samples) == 0:
        return None

    peak = np.max(np.abs(samples))
    rms = np.sqrt(np.mean(samples ** 2))

    peak_dbfs = 20 * np.log10(peak) if peak > 1e-9 else -99.0
    rms_dbfs = 20 * np.log10(rms) if rms > 1e-9 else -99.0

    print(f"\n========================================================")
    print(f"--- Audio Analysis for: {os.path.basename(wav_path)} ---")
    print(f"========================================================")
    print(f"  Channels:       {n_channels}")
    print(f"  Sample Rate:    {framerate} Hz")
    print(f"  Duration:       {duration:.2f} s")
    print(f"  Total Samples:  {len(samples)}")
    print(f"  Overall Peak:   {peak:.4f} ({peak_dbfs:.2f} dBFS) [Target: -3 to -1 dBFS]")
    print(f"  Overall RMS:    {rms:.4f} ({rms_dbfs:.2f} dBFS) [Target: -22 to -14 dBFS, ~ -18 dBFS]")
    
    window_results = []
    print("\n--- Measured Cue Windows Energy ---")
    for name, start_t, end_t in CUE_WINDOWS:
        idx_start = int(start_t * framerate)
        idx_end = min(len(samples), int(end_t * framerate))
        win_samples = samples[idx_start:idx_end]
        if len(win_samples) > 0:
            win_peak = np.max(np.abs(win_samples))
            win_rms = np.sqrt(np.mean(win_samples ** 2))
            w_peak_db = 20 * np.log10(win_peak) if win_peak > 1e-9 else -99.0
            w_rms_db = 20 * np.log10(win_rms) if win_rms > 1e-9 else -99.0
            status = "PASS (Real Energy)" if w_rms_db > -35.0 else "FAIL (Silence)"
            print(f"  {name:30}: Peak={w_peak_db:6.2f} dBFS | RMS={w_rms_db:6.2f} dBFS -> {status}")
            window_results.append({
                "name": name,
                "start": start_t,
                "end": end_t,
                "peak_db": w_peak_db,
                "rms_db": w_rms_db,
                "status": status
            })

    if plot_output:
        plot_waveform(samples, framerate, duration, peak_dbfs, rms_dbfs, window_results, plot_output)

    return {
        "channels": n_channels,
        "sample_rate": framerate,
        "duration": duration,
        "peak_dbfs": peak_dbfs,
        "rms_dbfs": rms_dbfs,
        "windows": window_results
    }

def plot_waveform(samples, framerate, duration, peak_dbfs, rms_dbfs, window_results, output_path):
    time_axis = np.linspace(0, duration, len(samples))
    
    # Subsample for smooth plotting if > 100k samples
    step = max(1, len(samples) // 80000)
    t_sub = time_axis[::step]
    s_sub = samples[::step]

    fig, ax = plt.subplots(figsize=(14, 6), facecolor='#0B0914')
    ax.set_facecolor('#0E0C1A')

    # Plot waveform
    ax.plot(t_sub, s_sub, color='#7B4BFF', alpha=0.75, linewidth=0.8, label='Waveform (Float32 PCM)')
    ax.plot(t_sub, -np.abs(s_sub), color='#FF6B57', alpha=0.35, linewidth=0.5)

    # Limiter ceiling (+/- 0.86 = -1.31 dBFS)
    ax.axhline(0.86, color='#FFD166', linestyle='--', linewidth=1.2, label='Limiter Ceiling (0.86 / -1.31 dBFS)')
    ax.axhline(-0.86, color='#FFD166', linestyle='--', linewidth=1.2)

    # Cue window highlights
    colors = ['#38BDF8', '#818CF8', '#F472B6', '#34D399', '#FBBF24', '#F87171']
    for idx, (name, start_t, end_t) in enumerate(CUE_WINDOWS):
        c = colors[idx % len(colors)]
        ax.axvspan(start_t, end_t, alpha=0.15, color=c)
        ax.text((start_t + end_t) / 2, 0.95, f"{name.split('(')[0].strip()}\n[{window_results[idx]['rms_db']:.1f} dBFS]",
                color=c, fontsize=8, ha='center', va='top', weight='bold',
                bbox=dict(boxstyle='round,pad=0.2', facecolor='#0B0914', edgecolor=c, alpha=0.8))

    ax.set_title(f"Aanvi 3D Intro — Calibrated Audio Waveform\nOverall Peak: {peak_dbfs:.2f} dBFS (Target: -3 to -1) | RMS: {rms_dbfs:.2f} dBFS (Target: ~-18 dBFS)",
                 color='#FFFFFF', fontsize=12, weight='bold', pad=15)
    ax.set_xlabel("Timeline (Seconds)", color='#94A3B8', fontsize=10)
    ax.set_ylabel("Linear Amplitude [-1.0, 1.0]", color='#94A3B8', fontsize=10)
    ax.set_xlim(0, max(8.5, duration))
    ax.set_ylim(-1.15, 1.15)
    ax.grid(True, color='#1E1B2E', linestyle=':', alpha=0.7)
    ax.tick_params(colors='#94A3B8')

    ax.legend(loc='lower right', facecolor='#0B0914', edgecolor='#334155', labelcolor='#FFFFFF')
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=200, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated waveform visualization artifact: {output_path}")

if __name__ == "__main__":
    desktop_wav = r"D:\StudyTwin-AI\scratch\live_capture_desktop.wav"
    mobile_wav = r"D:\StudyTwin-AI\scratch\live_capture_mobile.wav"
    waveform_artifact = os.path.join(OUTPUT_DIR, "part_a6_audio_waveform.png")

    if os.path.exists(desktop_wav):
        analyze_wav(desktop_wav, waveform_artifact)
    if os.path.exists(mobile_wav):
        analyze_wav(mobile_wav)
