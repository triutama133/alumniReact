'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabaseClient';
import { AlumniSearchResult } from '@/lib/types';
import { AlumniCard } from '@/components/search/AlumniCard';

export default function SearchPage() {
  // State untuk menyimpan input dari pengguna
  const [searchTerm, setSearchTerm] = useState('');
  // State untuk menyimpan hasil pencarian dari Supabase
  const [searchResults, setSearchResults] = useState<AlumniSearchResult[]>([]);
  // State untuk menunjukkan proses pencarian sedang berlangsung
  const [loading, setLoading] = useState(false);
  // State untuk menandai apakah pencarian sudah pernah dilakukan
  const [hasSearched, setHasSearched] = useState(false);

  const supabase = createClient();

  // Fungsi yang dipanggil saat form pencarian disubmit
  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault(); // Mencegah halaman refresh saat form disubmit
    if (searchTerm.trim().length < 3) {
      toast.info("Kata kunci pencarian minimal 3 karakter.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setSearchResults([]); // Kosongkan hasil sebelumnya

    try {
      // Query ke Supabase untuk mencari di DUA kolom sekaligus:
      // nama_lengkap ATAU skill_gabungan.
      // .ilike adalah versi case-insensitive dari .like
      const { data, error } = await supabase
        .from('alumni_db')
        .select('id, nama_lengkap, nama_panggilan, aktivitas, skill_gabungan, fakultas_jurusan')
        .or(`nama_lengkap.ilike.%${searchTerm}%,skill_gabungan.ilike.%${searchTerm}%`);

      if (error) {
        throw error;
      }

      setSearchResults(data || []);

    } catch (error: any) {
      toast.error("Gagal melakukan pencarian", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Cari Talenta</h1>
        <p className="text-muted-foreground mt-2">Temukan alumni berdasarkan nama atau keahlian.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-10">
        <Input
          type="search"
          placeholder="Ketik nama atau skill (misal: Budi, Desain Grafis)..."
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Mencari...' : 'Cari'}
        </Button>
      </form>

      {/* Tampilan Hasil Pencarian */}
      <div className="max-w-4xl mx-auto">
        {loading && <p className="text-center">Mencari talenta...</p>}

        {!loading && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-10 border rounded-md">
            <h3 className="text-xl font-semibold">Tidak Ada Hasil</h3>
            <p className="text-muted-foreground mt-2">Coba gunakan kata kunci lain.</p>
          </div>
        )}
        
        {!loading && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((alumni) => (
              <AlumniCard key={alumni.id} alumni={alumni} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}