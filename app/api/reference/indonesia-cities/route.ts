import { NextRequest, NextResponse } from 'next/server';

type ProvinceRow = {
  id: string;
  name: string;
};

type RegencyRow = {
  id: string;
  province_id: string;
  name: string;
};

type CityOption = {
  id: string;
  city: string;
  province: string;
  label: string;
};

let cachedCities: CityOption[] | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return null;
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return (await res.json()) as T;
}

async function loadRegenciesWithFallback(provinces: ProvinceRow[]): Promise<RegencyRow[]> {
  const allRegencies = await fetchJson<RegencyRow[]>(
    'https://www.emsifa.com/api-wilayah-indonesia/api/regencies.json'
  );

  if (allRegencies && Array.isArray(allRegencies) && allRegencies.length > 0) {
    return allRegencies;
  }

  const regencyBatches = await Promise.all(
    provinces.map((province) =>
      fetchJson<RegencyRow[]>(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`
      )
    )
  );

  return regencyBatches.flatMap((items) => (Array.isArray(items) ? items : []));
}

async function loadCities() {
  const now = Date.now();
  if (cachedCities && now - cacheBuiltAt < CACHE_TTL_MS) {
    return cachedCities;
  }

  const provinces = await fetchJson<ProvinceRow[]>(
    'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json'
  );

  if (!provinces || !Array.isArray(provinces) || provinces.length === 0) {
    throw new Error('Gagal memuat data referensi kota/provinsi Indonesia.');
  }

  const regencies = await loadRegenciesWithFallback(provinces);
  if (!regencies || regencies.length === 0) {
    throw new Error('Gagal memuat data kota/kabupaten Indonesia.');
  }

  const provinceMap = new Map<string, string>();
  for (const p of provinces) {
    provinceMap.set(p.id, p.name);
  }

  cachedCities = regencies
    .map((r) => {
      const province = provinceMap.get(r.province_id) || 'Tidak diketahui';
      return {
        id: r.id,
        city: r.name,
        province,
        label: `${r.name}, ${province}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'id-ID'));

  cacheBuiltAt = now;
  return cachedCities;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const limitRaw = Number(searchParams.get('limit') || '100');
    const limit = Number.isNaN(limitRaw) ? 100 : Math.min(Math.max(limitRaw, 1), 500);

    const cities = await loadCities();

    const filtered = search
      ? cities.filter((item) => item.label.toLowerCase().includes(search))
      : cities;

    return NextResponse.json(
      {
        total: filtered.length,
        items: filtered.slice(0, limit),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
