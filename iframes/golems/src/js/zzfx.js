var zzfxV = 0.3; // volume
var zzfxR = 44100;

const zzfxX = new (window.AudioContext || webkitAudioContext)(); // audio context
const zzfx = (
  // play sound
  // parameters
  volume = 1,
  randomness = 0.05,
  frequency = 220,
  attack = 0,
  sustain = 0,
  release = 0.1,
  shape = 0,
  shapeCurve = 1,
  slide = 0,
  deltaSlide = 0,
  pitchJump = 0,
  pitchJumpTime = 0,
  repeatTime = 0,
  noise = 0,
  modulation = 0,
  bitCrush = 0,
  delay = 0,
  sustainVolume = 1,
  decay = 0,
  tremolo = 0
) => {
  // init parameters
  let PI2 = Math.PI * 2,
    sign = v => (v > 0 ? 1 : -1),
    startSlide = (slide *= (500 * PI2) / zzfxR / zzfxR),
    startFrequency = (frequency *=
      ((1 + randomness * 2 * Math.random() - randomness) * PI2) / zzfxR),
    b = [],
    t = 0,
    tm = 0,
    i = 0,
    j = 1,
    r = 0,
    c = 0,
    s = 0,
    f,
    length,
    buffer,
    source;

  // scale by sample rate
  attack = attack * zzfxR + 9; // minimum attack to prevent pop
  decay *= zzfxR;
  sustain *= zzfxR;
  release *= zzfxR;
  delay *= zzfxR;
  deltaSlide *= (500 * PI2) / zzfxR ** 3;
  modulation *= PI2 / zzfxR;
  pitchJump *= PI2 / zzfxR;
  pitchJumpTime *= zzfxR;
  repeatTime = (repeatTime * zzfxR) | 0;

  // generate waveform
  for (
    length = (attack + decay + sustain + release + delay) | 0;
    i < length;
    b[i++] = s
  ) {
    if (!(++c % ((bitCrush * 100) | 0))) {
      // bit crush
      s = shape
        ? shape > 1
          ? shape > 2
            ? shape > 3 // wave shape
              ? Math.sin((t % PI2) ** 3) // 4 noise
              : Math.max(Math.min(Math.tan(t), 1), -1) // 3 tan
            : 1 - (((((2 * t) / PI2) % 2) + 2) % 2) // 2 saw
          : 1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) // 1 triangle
        : Math.sin(t); // 0 sin

      s =
        (repeatTime
          ? 1 - tremolo + tremolo * Math.sin((PI2 * i) / repeatTime) // tremolo
          : 1) *
        sign(s) *
        Math.abs(s) ** shapeCurve * // curve 0=square, 2=pointy
        volume *
        zzfxV * // envelope
        (i < attack
          ? i / attack // attack
          : i < attack + decay // decay
          ? 1 - ((i - attack) / decay) * (1 - sustainVolume) // decay falloff
          : i < attack + decay + sustain // sustain
          ? sustainVolume // sustain volume
          : i < length - delay // release
          ? ((length - i - delay) / release) * // release falloff
            sustainVolume // release volume
          : 0); // post release

      s = delay
        ? s / 2 +
          (delay > i
            ? 0 // delay
            : ((i < length - delay ? 1 : (length - i) / delay) * // release delay
                b[(i - delay) | 0]) /
              2)
        : s; // sample delay
    }

    f =
      (frequency += slide += deltaSlide) * // frequency
      Math.cos(modulation * tm++); // modulation
    t += f - f * noise * (1 - (((Math.sin(i) + 1) * 1e9) % 2)); // noise

    if (j && ++j > pitchJumpTime) {
      // pitch jump
      frequency += pitchJump; // apply pitch jump
      startFrequency += pitchJump; // also apply to start
      j = 0; // reset pitch jump time
    }

    if (repeatTime && !(++r % repeatTime)) {
      // repeat
      frequency = startFrequency; // reset frequency
      slide = startSlide; // reset slide
      j = j || 1; // reset pitch jump time
    }
  }

  // play an array of audio samples
  buffer = zzfxX.createBuffer(1, length, zzfxR);
  buffer.getChannelData(0).set(b);
  source = zzfxX.createBufferSource();
  source.buffer = buffer;
  source.connect(zzfxX.destination);
  source.start();
  return source;
};

// var zzfx = (
//   // play sound
//   q = 1,
//   k = 0.05,
//   c = 220,
//   e = 0,
//   t = 0,
//   u = 0.1,
//   r = 0,
//   F = 1,
//   v = 0,
//   z = 0,
//   w = 0,
//   A = 0,
//   l = 0,
//   B = 0,
//   x = 0,
//   G = 0,
//   d = 0,
//   y = 1,
//   m = 0,
//   C = 0
// ) => {
//   let b = 2 * Math.PI,
//     H = (v *= (500 * b) / zzfxR ** 2),
//     I = ((0 < x ? 1 : -1) * b) / 4,
//     D = (c *= ((1 + 2 * k * Math.random() - k) * b) / zzfxR),
//     Z = [],
//     g = 0,
//     E = 0,
//     a = 0,
//     n = 1,
//     J = 0,
//     K = 0,
//     f = 0,
//     p,
//     h;
//   e = 99 + zzfxR * e;
//   m *= zzfxR;
//   t *= zzfxR;
//   u *= zzfxR;
//   d *= zzfxR;
//   z *= (500 * b) / zzfxR ** 3;
//   x *= b / zzfxR;
//   w *= b / zzfxR;
//   A *= zzfxR;
//   l = (zzfxR * l) | 0;
//   for (h = (e + m + t + u + d) | 0; a < h; Z[a++] = f)
//     ++K % ((100 * G) | 0) ||
//       ((f = r
//         ? 1 < r
//           ? 2 < r
//             ? 3 < r
//               ? Math.sin((g % b) ** 3)
//               : Math.max(Math.min(Math.tan(g), 1), -1)
//             : 1 - (((((2 * g) / b) % 2) + 2) % 2)
//           : 1 - 4 * Math.abs(Math.round(g / b) - g / b)
//         : Math.sin(g)),
//       (f =
//         (l ? 1 - C + C * Math.sin((2 * Math.PI * a) / l) : 1) *
//         (0 < f ? 1 : -1) *
//         Math.abs(f) ** F *
//         q *
//         zzfxV *
//         (a < e
//           ? a / e
//           : a < e + m
//           ? 1 - ((a - e) / m) * (1 - y)
//           : a < e + m + t
//           ? y
//           : a < h - d
//           ? ((h - a - d) / u) * y
//           : 0)),
//       (f = d
//         ? f / 2 +
//           (d > a ? 0 : ((a < h - d ? 1 : (h - a) / d) * Z[(a - d) | 0]) / 2)
//         : f)),
//       (p = (c += v += z) * Math.sin(E * x - I)),
//       (g += p - p * B * (1 - ((1e9 * (Math.sin(a) + 1)) % 2))),
//       (E += p - p * B * (1 - ((1e9 * (Math.sin(a) ** 2 + 1)) % 2))),
//       n && ++n > A && ((c += w), (D += w), (n = 0)),
//       !l || ++J % l || ((c = D), (v = H), (n = n || 1));
//   q = zzfxX.createBuffer(1, h, zzfxR);
//   q.getChannelData(0).set(Z);
//   c = zzfxX.createBufferSource();
//   c.buffer = q;
//   c.connect(zzfxX.destination);
//   c.start();
//   return c;
// };
