import { getSettings } from '@/actions/settings';
import ThankYouPageForm from '@/components/admin/settings/ThankYouPageForm';

export const metadata = {
  title: 'Thank you page Settings | Administration',
};

export default async function ThankYouSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-4xl">
      <ThankYouPageForm initialSettings={settings} />
    </div>
  );
}
