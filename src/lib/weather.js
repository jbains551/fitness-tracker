import { useEffect, useState } from 'react';

const CACHE_KEY = 'ft_weather_v1';
const TEMP_TTL_MS = 15 * 60 * 1000;
const LOC_TTL_MS = 24 * 60 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
  );
  if (!res.ok) throw new Error(`geo ${res.status}`);
  const j = await res.json();
  const city = j.city || j.locality || j.principalSubdivision || '';
  const region = j.principalSubdivisionCode?.split('-')?.[1] || '';
  return region ? `${city}, ${region}` : city;
}

async function fetchTemp(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=fahrenheit`
  );
  if (!res.ok) throw new Error(`wx ${res.status}`);
  const j = await res.json();
  const t = j?.current?.temperature_2m;
  return typeof t === 'number' ? Math.round(t) : null;
}

export function useWeather() {
  const [data, setData] = useState(() => readCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = readCache();
    const now = Date.now();
    const haveFreshTemp = cached?.tempAt && now - cached.tempAt < TEMP_TTL_MS;
    if (haveFreshTemp) return;

    if (!navigator.geolocation) {
      setError('geolocation unavailable');
      return;
    }

    let cancelled = false;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        try {
          const { latitude, longitude } = pos.coords;
          const haveFreshCity = cached?.cityAt && now - cached.cityAt < LOC_TTL_MS && cached.city;
          const [city, tempF] = await Promise.all([
            haveFreshCity ? Promise.resolve(cached.city) : reverseGeocode(latitude, longitude),
            fetchTemp(latitude, longitude),
          ]);
          if (cancelled) return;
          const next = {
            city,
            cityAt: haveFreshCity ? cached.cityAt : Date.now(),
            tempF,
            tempAt: Date.now(),
          };
          writeCache(next);
          setData(next);
          setLoading(false);
        } catch (err) {
          if (cancelled) return;
          setError(String(err?.message || err));
          setLoading(false);
        }
      },
      (err) => {
        if (cancelled) return;
        setError(err?.message || 'location denied');
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 600000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...(data || {}), loading, error };
}
