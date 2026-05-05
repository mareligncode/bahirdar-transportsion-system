import { useTranslation } from '../../hooks/useTranslation';

export default function Contact() {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('Contact Us')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('Get in Touch')}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{t('Address')}</h3>
              <p className="text-gray-600">{t('123 Main St, Bahir Dar, Ethiopia')}</p>
            </div>
            <div>
              <h3 className="font-medium">{t('Phone')}</h3>
              <p className="text-gray-600">{t('+251 123 456 789')}</p>
            </div>
            <div>
              <h3 className="font-medium">{t('Email')}</h3>
              <p className="text-gray-600">{t('contact@bahirdartransit.com')}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-2xl font-semibold mb-4">{t('Send Message')}</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Name')}
              </label>
              <input type="text" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Email')}
              </label>
              <input type="email" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Message')}
              </label>
              <textarea rows={4} className="input-field"></textarea>
            </div>
            <button type="submit" className="btn-primary">
              {t('Send Message')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}