'use client'

import { Controller, useWatch, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function yearOptions(): number[] {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let y = current; y >= 1970; y--) years.push(y)
  return years
}

const YEARS = yearOptions()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthSelect({ control, name }: { control: Control<any>; name: string }) {
  return (
    <Controller
      control={control}
      name={name as FieldPath<FieldValues>}
      render={({ field, fieldState }) => (
        <div className="space-y-1">
          <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : undefined}>
            <SelectTrigger className="w-full" aria-invalid={Boolean(fieldState.error)}><SelectValue placeholder="Bulan" /></SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
        </div>
      )}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function YearSelect({ control, name }: { control: Control<any>; name: string }) {
  return (
    <Controller
      control={control}
      name={name as FieldPath<FieldValues>}
      render={({ field, fieldState }) => (
        <div className="space-y-1">
          <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : undefined}>
            <SelectTrigger className="w-full" aria-invalid={Boolean(fieldState.error)}><SelectValue placeholder="Tahun" /></SelectTrigger>
            <SelectContent className="max-h-64 bg-popover text-popover-foreground">
              {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
        </div>
      )}
    />
  )
}

/**
 * LinkedIn-style start/end month-year picker for an activity entry, plus an
 * "is currently ongoing" checkbox that hides the end-date fields when checked.
 * Bind via `namePrefix` to a react-hook-form array entry, e.g. `pekerja_details.0`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MonthYearRangeField({ control, namePrefix }: { control: Control<any>; namePrefix: string }) {
  const isCurrent = useWatch({ control, name: `${namePrefix}.is_current` as FieldPath<FieldValues> })

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium text-foreground">Durasi Aktivitas</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Bulan Mulai</label>
          <MonthSelect control={control} name={`${namePrefix}.start_month`} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground block">Tahun Mulai</label>
          <YearSelect control={control} name={`${namePrefix}.start_year`} />
        </div>
      </div>

      <Controller
        control={control}
        name={`${namePrefix}.is_current` as FieldPath<FieldValues>}
        render={({ field }) => (
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer">
            <Checkbox checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(Boolean(v))} />
            <span>Masih berlangsung saat ini</span>
          </label>
        )}
      />

      {!isCurrent && (
        <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Bulan Berakhir</label>
            <MonthSelect control={control} name={`${namePrefix}.end_month`} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground block">Tahun Berakhir</label>
            <YearSelect control={control} name={`${namePrefix}.end_year`} />
          </div>
        </div>
      )}
    </div>
  )
}
