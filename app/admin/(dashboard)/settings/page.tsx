import { getSettings } from '@/lib/data/settings'
import { SettingsForm } from '@/components/admin/settings-form'

export default async function AdminSettingsPage() {
  const settings = await getSettings()
  return (
    <div>
      <h1 className="font-display text-3xl font-light">Indstillinger</h1>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  )
}
