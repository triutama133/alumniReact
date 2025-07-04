// test_hash.js
const bcrypt = require('bcryptjs');

const passwordToTest = 'newmo'; // Password yang ingin Anda verifikasi
const hashedPasswordFromDb = '$2a$10$MhCsIsxxAgW94TgyZxfg.OLQl0sMR/YC/pCbt1KHwMAdRrx4DNahy'; // Hash dari database Anda

async function testPassword() {
    try {
        // Hasilkan hash dari password "newmo"
        const saltRounds = 10; // Harus sama dengan salt rounds yang digunakan saat hashing password di awal
        const hashOfNewmo = await bcrypt.hash(passwordToTest, saltRounds);
        console.log(`Hash dari "${passwordToTest}" (dibuat sekarang):`, hashOfNewmo);

        // Bandingkan password plain text "newmo" dengan hash dari database
        const isMatch = await bcrypt.compare(passwordToTest, hashedPasswordFromDb);
        console.log(`Apakah "${passwordToTest}" cocok dengan hash DB?`, isMatch);

        if (!isMatch) {
            console.log('\n--- PERINGATAN PENTING ---');
            console.log('Password "newmo" TIDAK COCOK dengan hash di database Anda.');
            console.log('Ini berarti hash di database dibuat dari password yang berbeda, atau salt rounds berbeda.');
            console.log('Anda harus mengetahui password asli yang menghasilkan hash tersebut, atau meminta pengguna untuk reset password.');
        } else {
            console.log('\n--- BERHASIL ---');
            console.log('Password "newmo" COCOK dengan hash di database Anda.');
            console.log('Jika Anda masih mendapatkan "Invalid credentials", masalahnya mungkin ada di konfigurasi JWT Secret di Supabase Dashboard, bukan perbandingan password.');
        }

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

// Pastikan Anda sudah menginstal bcryptjs: npm install bcryptjs
testPassword();
