// Original 12-second test texture, synthesized locally. This is NOT the artist's song.
// No network, dependencies or external samples. Writes one explicit, project-local WAV.
import { mkdir, writeFile } from 'node:fs/promises';
const rate = 16000;
const seconds = 12;
const samples = rate * seconds;
const data = Buffer.alloc(44 + samples * 2);
data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
data.write('data', 36); data.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++) {
  const t = i / rate;
  const envelope = Math.min(1, t * 2, (seconds - t) * 2);
  const pulse = Math.exp(-(t % .75) * 12) * Math.sin(2 * Math.PI * 110 * t);
  const drone = Math.sin(2 * Math.PI * 55 * t) * .14 + Math.sin(2 * Math.PI * 82.5 * t) * .07;
  const value = (drone * (.7 + .3 * Math.sin(2 * Math.PI * t / 6)) + pulse * .06) * envelope;
  data.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
}
await mkdir('public/audio', { recursive: true });
await writeFile('public/audio/woodstock-demo-v1.wav', data);
console.log(`Original test audio: ${data.length} bytes, mono ${rate} Hz, ${seconds}s. Not Woodstock.`);
