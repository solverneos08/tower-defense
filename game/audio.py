"""Procedural sound effects."""

import numpy as np

try:
    import pygame.mixer
    HAS_MIXER = True
except Exception:
    HAS_MIXER = False


def _tone(freq: float, duration: float, volume: float = 0.3, sample_rate: int = 22050):
    n = int(sample_rate * duration)
    t = np.linspace(0, duration, n, False)
    wave = np.sin(2 * np.pi * freq * t) * volume
    ramp = np.minimum(1.0, np.linspace(3, 1, n))
    wave = (wave * ramp * 32767).astype(np.int16)
    stereo = np.column_stack([wave, wave])
    return pygame.sndarray.make_sound(stereo)


class AudioManager:
    def __init__(self):
        self.sounds = {}
        self.enabled = True
        if HAS_MIXER:
            try:
                pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
                self.sounds["shoot"] = _tone(440, 0.05, 0.2)
                self.sounds["place"] = _tone(330, 0.08, 0.25)
                self.sounds["upgrade"] = _tone(550, 0.1, 0.25)
                self.sounds["wave"] = _tone(220, 0.15, 0.3)
                self.sounds["hit"] = _tone(180, 0.06, 0.2)
            except Exception:
                self.enabled = False

    def play(self, name: str):
        if not self.enabled or not HAS_MIXER:
            return
        s = self.sounds.get(name)
        if s:
            try:
                s.play()
            except Exception:
                pass
