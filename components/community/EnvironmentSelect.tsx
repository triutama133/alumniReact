// components/community/EnvironmentSelect.tsx
'use client';

import { Globe, Users, Check } from 'lucide-react';

export interface EnvironmentCohortOption {
  id: number;
  name: string;
}

interface EnvironmentSelectProps {
  cohorts: EnvironmentCohortOption[];
  selectedCohortIds: number[];
  onChange: (cohortIds: number[]) => void;
  className?: string;
}

/**
 * Lets an author choose where content is visible: "Global" (everyone) or
 * one-or-more communities they belong to. Selecting any community scopes the
 * content to exactly those communities and removes it from the global feed —
 * selecting zero communities means Global. Reused by the post composer, and
 * the project/job create-and-edit forms, so the semantics stay consistent
 * everywhere content can be tagged.
 */
export function EnvironmentSelect({ cohorts, selectedCohortIds, onChange, className }: EnvironmentSelectProps) {
  const isGlobal = selectedCohortIds.length === 0;

  const toggleCohort = (cohortId: number) => {
    if (selectedCohortIds.includes(cohortId)) {
      onChange(selectedCohortIds.filter((id) => id !== cohortId));
    } else {
      onChange([...selectedCohortIds, cohortId]);
    }
  };

  return (
    <div className={className}>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
        Tampilkan di
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange([])}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
            isGlobal
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
          }`}
        >
          {isGlobal && <Check className="h-3 w-3" />}
          <Globe className="h-3 w-3" />
          Global
        </button>
        {cohorts.map((cohort) => {
          const isSelected = selectedCohortIds.includes(cohort.id);
          return (
            <button
              key={cohort.id}
              type="button"
              onClick={() => toggleCohort(cohort.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                isSelected
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              <Users className="h-3 w-3" />
              {cohort.name}
            </button>
          );
        })}
        {cohorts.length === 0 && (
          <span className="text-xs text-slate-400 italic py-1">Anda belum bergabung dengan komunitas apapun.</span>
        )}
      </div>
    </div>
  );
}
