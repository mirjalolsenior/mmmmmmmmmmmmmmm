"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function AdminSettings() {
  const [threshold, setThreshold] = useState<number>(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/settings/inventory-threshold", { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        if (!cancelled && json?.success && typeof json?.threshold === "number") {
          setThreshold(json.threshold)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onSave = async () => {
    try {
      setSaving(true)
      const res = await fetch("/api/settings/inventory-threshold", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threshold }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        toast.error(json?.error || "Saqlashda xatolik")
        return
      }

      toast.success(`Saqlanildi: Kam qolganda limit = ${json.threshold}`)
      setThreshold(json.threshold)
    } catch {
      toast.error("Saqlashda xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="glass-card animate-slideIn">
      <CardHeader>
        <CardTitle>Bildirishnoma sozlamalari</CardTitle>
        <CardDescription>Tovar kam qolganda yuboriladigan limitni o'zgartiring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 max-w-sm">
          <Label htmlFor="lowStock">Kam qolganda limit (son)</Label>
          <Input
            id="lowStock"
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            value={Number.isFinite(threshold) ? threshold : 10}
            onChange={(e) => setThreshold(Number(e.target.value))}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Masalan: 10 — qoldiq 10 yoki undan kam bo'lsa, bildirishnoma chiqadi.
          </p>
        </div>

        <Button onClick={onSave} disabled={loading || saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </CardContent>
    </Card>
  )
}
