'use client'
// src/app/audit/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ToolEntryCard from '@/src/components/ToolsEntryCard'
import { ToolEntry } from '@/src/lib/tools'

const STORAGE_KEY = 'aicostiq-form-v2'

export default function AuditPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<ToolEntry[]>([])
  const [nextId, setNextId] = useState(1)
  const [teamSize, setTeamSize] = useState('')
  const [useCase, setUseCase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setEntries(parsed.entries || [])
        setNextId(parsed.nextId || 1)
        setTeamSize(parsed.teamSize || '')
        setUseCase(parsed.useCase || '')
      } else {
        // Start with one empty entry
        setEntries([{ id: 1, company: '', plan: '', seats: '', spend: '' }])
        setNextId(2)
      }
    } catch {
      setEntries([{ id: 1, company: '', plan: '', seats: '', spend: '' }])
      setNextId(2)
    }
  }, [])

  // Save to localStorage on every change
  useEffect(() => {
    if (entries.length === 0) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, nextId, teamSize, useCase }))
    } catch {}
  }, [entries, nextId, teamSize, useCase])

  const totalMonthly = entries.reduce((sum, e) => sum + (parseFloat(e.spend) || 0), 0)
  const totalAnnual = totalMonthly * 12

  function addEntry() {
    setEntries((prev) => [...prev, { id: nextId, company: '', plan: '', seats: '', spend: '' }])
    setNextId((n) => n + 1)
  }

  function removeEntry(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function handleChange(id: number, field: keyof ToolEntry, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  async function handleSubmit() {
    setError('')

    // Validation
    if (entries.length === 0) {
      setError('Please add at least one AI tool.')
      return
    }
    const incomplete = entries.filter((e) => !e.company || !e.plan || e.spend === '')
    if (incomplete.length > 0) {
      setError('Please complete all fields for each tool.')
      return
    }
    if (!teamSize || !useCase) {
      setError('Please select your team size and primary use case.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, teamSize, useCase }),
      })

      if (!res.ok) throw new Error('Failed to create audit')

      const data = await res.json()
      // Clear form after successful submit
      localStorage.removeItem(STORAGE_KEY)
      // Redirect to results page
      router.push(`/audit/${data.uuid}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
              AI Cost IQ
            </h1>
            <p className="text-xs text-neutral-500">Free AI spend audit · no login required</p>
          </div>
        </div>

        {/* Tool entries */}
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-3">
          Your AI tools
        </p>
        <div className="flex flex-col gap-3 mb-3">
          {entries.map((entry, i) => (
            <ToolEntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onChange={handleChange}
              onRemove={removeEntry}
            />
          ))}
        </div>

        {/* Add tool button */}
        <button
          onClick={addEntry}
          className="w-full flex items-center gap-2 px-4 py-3 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950 transition-all mb-8"
        >
          <span className="text-lg leading-none">+</span>
          Add another AI tool
        </button>

        <hr className="border-neutral-200 dark:border-neutral-700 mb-6" />

        {/* Team info */}
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-3">
          About your team
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Team size <span className="text-red-500">*</span>
            </label>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select size</option>
              <option>Just me (1)</option>
              <option>2–5 people</option>
              <option>6–10 people</option>
              <option>11–25 people</option>
              <option>26–50 people</option>
              <option>50+ people</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">
              Primary use case <span className="text-red-500">*</span>
            </label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select use case</option>
              <option>Coding / engineering</option>
              <option>Writing / content</option>
              <option>Data / analytics</option>
              <option>Research</option>
              <option>Mixed / general</option>
            </select>
          </div>
        </div>

        {/* Spend summary */}
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 mb-4">
          <div>
            <p className="text-xs text-neutral-500">Total monthly spend</p>
            <p className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
              ${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-sm font-normal text-neutral-400"> / mo</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Annual</p>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              ${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })} / yr
            </p>
          </div>
        </div>

        {/* Trust note */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3 mb-5 text-sm text-neutral-700 dark:text-neutral-300">
          <span className="text-emerald-600 text-base">🔒</span>
          Your results are shown instantly and free. Email is only asked after you see your savings.
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3 text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Running your audit...
            </>
          ) : (
            <>⚡ Run my free audit</>
          )}
        </button>

      </div>
    </main>
  )
}