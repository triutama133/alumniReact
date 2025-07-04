/** @type {import('tailwindcss').Config} */
module.exports = {
  // Array 'content' memberitahu Tailwind di mana harus mencari kelas Tailwind yang Anda gunakan.
  // Pastikan semua jalur file yang berisi kelas Tailwind Anda tercakup di sini.
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Tambahkan ini jika Anda punya folder src
  ],
  theme: {
    // Bagian 'extend' memungkinkan Anda untuk menambahkan atau memperluas tema default Tailwind.
    // Misalnya, Anda bisa menambahkan warna kustom, font, atau ukuran spasi di sini.
    extend: {},
  },
  // Bagian 'plugins' adalah tempat Anda menambahkan plugin Tailwind CSS.
  // @tailwindcss/typography diperlukan untuk kelas 'prose' yang digunakan untuk merapikan Markdown.
  plugins: [
    require('@tailwindcss/typography'), // Penting untuk kelas 'prose'
  ],
}
