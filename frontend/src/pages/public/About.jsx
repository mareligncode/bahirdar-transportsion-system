import { useTranslation } from '../../hooks/useTranslation';

export default function About() {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{t('About Us')}</h1>
      <div className="space-y-6 text-gray-600">
        <p>
          {t('Bahir Dar Meneharia Transportation System is a modern, digital platform designed to revolutionize public transportation in the Bahir Dar region.')}
        </p>
        <p>
          {t('Our mission is to provide seamless, reliable, and efficient transportation services that connect people across cities while ensuring safety, comfort, and transparency.')}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8">{t('Our Vision')}</h2>
        <p>
          {t('To become Ethiopia\'s leading digital transportation platform, setting new standards for reliability, customer service, and technological innovation in public transit.')}
        </p>
      </div>
    </div>
  );
}