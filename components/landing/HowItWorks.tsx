// components/landing/HowItWorks.tsx
'use client';

const steps = [
    {
        number: '01',
        title: 'Connect & Pitch',
        desc: 'Buat profil, pamerkan keahlianmu, atau publikasikan ide proyek yang ingin kamu bangun.',
    },
    {
        number: '02',
        title: 'Prepare with AI',
        desc: 'Simulasi wawancara dan optimalkan CV kamu dengan asisten AI pribadi.',
    },
    {
        number: '03',
        title: 'Launch & Get Hired',
        desc: 'Eksekusi proyek bersama tim barumu atau melamar ke lowongan impian.',
    },
];

export function HowItWorks() {
    return (
        <section className="relative z-10 px-6 py-16 sm:py-24 bg-black/30 backdrop-blur-sm border-y border-white/10">
            <div className="mx-auto max-w-6xl">
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white">
                        3 Langkah Mudah Memulai di HubTalent
                    </h2>
                    <p className="mt-3 text-white/70 max-w-xl mx-auto text-sm sm:text-base">
                        Dari ide pertama hingga eksekusi nyata — semua bisa kamu lakukan di sini.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {steps.map((step) => (
                        <div key={step.number} className="relative">
                            {/* Panel */}
                            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:bg-white/10 transition-all duration-300 overflow-hidden text-left h-full flex flex-col justify-between">
                                {/* Nomor besar dekoratif di pojok kanan atas */}
                                <div className="absolute top-4 right-6 select-none pointer-events-none">
                                    <span className="text-5xl font-mono font-black text-white/10">
                                        {step.number}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="relative text-lg font-bold text-white mb-2 pr-12">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-white/65 leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}