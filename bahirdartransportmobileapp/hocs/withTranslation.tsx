import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader } from '@/components/common/Loader';

export function withTranslation<P extends object>(
  WrappedComponent: React.ComponentType<P & { t: any; language: string; translate: any }>
) {
  return function WithTranslationComponent(props: P) {
    const { t, language, isLoading, translate } = useTranslation();

    if (isLoading) {
      return <Loader message="Loading..." />;
    }

    return <WrappedComponent {...props} t={t} language={language} translate={translate} />;
  };
}