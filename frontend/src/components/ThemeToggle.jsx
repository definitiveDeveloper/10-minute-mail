
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-7 w-7"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? t('switchToDarkTheme') : t('switchToLightTheme')}
      title={theme === 'light' ? t('switchToDarkTheme') : t('switchToLightTheme')}
    >
      {theme === 'light' ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
