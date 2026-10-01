"""Create private streaming derivatives and real peaks, preserving supplied WAVs.

Run: python scripts/prepare-cd-audio.py [--ffmpeg /path/to/ffmpeg]
Uses an installed FFmpeg or the existing imageio_ffmpeg binary; never installs tools.
"""
import argparse
import array
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [
    "WOODSTOCK - YTA  (Prodby,MB).wav",
    "ADITIVO - YTA  (Prodby,MB).wav",
    "SILENCIO - YTA  (Prodby,MB).wav",
    "QUIMICO - YTA  (Prodby,MB).wav",
    "IN VERSO - YTA  (Prodby,MB).wav",
    "CONHECIDA ILUSAO - YTA  (Prodby,MB).wav",
    "NAO ME DIZEM NADA - YTA  (Prodby,MB).wav",
    "SUBLIME - YTA  (Prodby,MB).wav",
    "PSICHO Z - YTA  (Prodby,MB).wav",
    "PSICOSE - YTA  ft . NOBRE (Prodby,MB).wav",
    "ASSUMINDO O RISCO - YTA  (Prodby,MB).wav",
    "ACAPELLA - YTA  (Prodby,MB).wav",
    "CIDADE CINZA - YTA  (Prodby,MB).wav",
    "NAO POSSO ERRAR - YTA  (Prodby,MB).wav",
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg')
    args = parser.parse_args()
    ffmpeg = args.ffmpeg or shutil.which('ffmpeg')
    if not ffmpeg:
        try:
            import imageio_ffmpeg
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            parser.error('FFmpeg is required. Pass --ffmpeg with an existing binary.')
    output = ROOT / 'private/cd'
    for folder in ['stream', 'peaks']:
        (output / folder).mkdir(parents=True, exist_ok=True)
    manifest = {}
    for index, name in enumerate(SOURCES, 1):
        source = ROOT / 'psichoZTracks' / name
        with source.open('rb') as file:
            digest = hashlib.file_digest(file, 'sha256').hexdigest()
        track = f'track-{index:02d}'
        version = digest[:12]
        stream_key = f'stream/{track}-{version}.mp3'
        peaks_key = f'peaks/{track}-{version}.json'
        # FFmpeg handles PCM24 and floating-point WAV consistently.
        pcm = subprocess.run([ffmpeg, '-v', 'error', '-i', str(source), '-map', '0:a:0', '-ac', '1', '-ar', '8000', '-f', 'f32le', 'pipe:1'], check=True, capture_output=True).stdout
        samples = array.array('f')
        samples.frombytes(pcm)
        if sys.byteorder != 'little':
            samples.byteswap()
        duration = len(samples) / 8000
        if not duration:
            raise ValueError(f'Empty audio: {name}')
        step = math.ceil(len(samples) / 1200)
        peaks = [max(abs(value) for value in samples[i:i + step]) for i in range(0, len(samples), step)]
        maximum = max(peaks) or 1
        peaks = [round(min(1, value / maximum), 4) for value in peaks]
        (output / peaks_key).write_text(json.dumps(peaks, separators=(',', ':')), encoding='utf-8')
        destination = output / stream_key
        if not destination.exists():
            temp = destination.with_suffix('.tmp.mp3')
            subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(source), '-map', '0:a:0', '-map_metadata', '-1', '-vn', '-c:a', 'libmp3lame', '-q:a', '2', '-ar', '44100', str(temp)], check=True)
            temp.replace(destination)
        # Original WAV is served by the local adapter; copy to this key in R2 only when publishing.
        manifest[track] = {
            'sourceFilename': name, 'sourceSha256': digest,
            'durationSeconds': round(duration, 3),
            'stream': {'key': stream_key, 'filename': f'YTA-PsicoZ-{index:02d}.mp3', 'contentType': 'audio/mpeg'},
            'download': {'key': f'download/{track}-{version}.wav', 'filename': f'YTA-PsicoZ-{index:02d}.wav', 'contentType': 'audio/wav'},
            'peaks': {'key': peaks_key, 'filename': f'{track}.json', 'contentType': 'application/json'},
        }
        print(f'{track}: {duration:.2f}s; MP3 {destination.stat().st_size / 1024 / 1024:.2f} MiB; {len(peaks)} peaks', flush=True)
    (ROOT / 'server/cd/audio-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
