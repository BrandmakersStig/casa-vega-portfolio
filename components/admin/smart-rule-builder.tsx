'use client'

import { Plus, X } from 'lucide-react'
import type { SmartCollectionRule } from '@/types'

const FIELD_LABELS: Record<SmartCollectionRule['field'], string> = {
  rating: 'Rating',
  keyword: 'Keyword',
  camera: 'Kamera',
  year: 'År',
  isBlackAndWhite: 'Sort/hvid',
  location: 'Lokation',
}

function defaultOperator(field: SmartCollectionRule['field']): SmartCollectionRule['operator'] {
  return field === 'rating' ? 'gte' : field === 'camera' || field === 'location' ? 'contains' : 'eq'
}

function defaultValue(field: SmartCollectionRule['field']): SmartCollectionRule['value'] {
  if (field === 'rating' || field === 'year') return field === 'rating' ? 4 : new Date().getFullYear()
  if (field === 'isBlackAndWhite') return true
  return ''
}

export function SmartRuleBuilder({
  rules,
  onChange,
}: {
  rules: SmartCollectionRule[]
  onChange: (rules: SmartCollectionRule[]) => void
}) {
  function updateRule(i: number, patch: Partial<SmartCollectionRule>) {
    onChange(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRule() {
    onChange([...rules, { field: 'rating', operator: 'gte', value: 4 }])
  }
  function removeRule(i: number) {
    onChange(rules.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2 border border-dashed border-border p-3">
      <p className="text-xs text-muted-foreground">Billeder skal matche ALLE regler for at være med i collectionen.</p>
      {rules.map((rule, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={rule.field}
            onChange={(e) => {
              const field = e.target.value as SmartCollectionRule['field']
              updateRule(i, { field, operator: defaultOperator(field), value: defaultValue(field) })
            }}
            className="border border-input bg-transparent px-2 py-1 text-xs"
          >
            {(Object.keys(FIELD_LABELS) as SmartCollectionRule['field'][]).map((f) => (
              <option key={f} value={f}>{FIELD_LABELS[f]}</option>
            ))}
          </select>

          {rule.field === 'rating' && (
            <select
              value={rule.operator}
              onChange={(e) => updateRule(i, { operator: e.target.value as SmartCollectionRule['operator'] })}
              className="border border-input bg-transparent px-2 py-1 text-xs"
            >
              <option value="gte">≥</option>
              <option value="lte">≤</option>
              <option value="eq">=</option>
            </select>
          )}

          {rule.field === 'isBlackAndWhite' ? (
            <select
              value={String(rule.value)}
              onChange={(e) => updateRule(i, { value: e.target.value === 'true' })}
              className="border border-input bg-transparent px-2 py-1 text-xs"
            >
              <option value="true">Sort/hvid</option>
              <option value="false">Farve</option>
            </select>
          ) : rule.field === 'rating' || rule.field === 'year' ? (
            <input
              type="number"
              value={Number(rule.value)}
              onChange={(e) => updateRule(i, { value: Number(e.target.value) })}
              className="w-20 border border-input bg-transparent px-2 py-1 text-xs"
            />
          ) : (
            <input
              value={String(rule.value)}
              onChange={(e) => updateRule(i, { value: e.target.value })}
              placeholder={rule.field === 'keyword' ? 'fx solnedgang' : rule.field === 'camera' ? 'fx Fujifilm' : 'fx Tokyo'}
              className="w-40 border border-input bg-transparent px-2 py-1 text-xs"
            />
          )}

          <button onClick={() => removeRule(i)} aria-label="Fjern regel" className="rounded p-1 text-destructive hover:bg-destructive/10">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <button onClick={addRule} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <Plus className="size-3.5" /> Tilføj regel
      </button>
    </div>
  )
}
