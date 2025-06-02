
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import enTranslations from '@/locales/en.json';
import sqTranslations from '@/locales/sq.json';
import arTranslations from '@/locales/ar.json';
import bgTranslations from '@/locales/bg.json';
import caTranslations from '@/locales/ca.json';
import zhCNTranslations from '@/locales/zh-CN.json';
import hrTranslations from '@/locales/hr.json';
import csTranslations from '@/locales/cs.json';
import daTranslations from '@/locales/da.json';
import nlTranslations from '@/locales/nl.json';
import eoTranslations from '@/locales/eo.json';
import etTranslations from '@/locales/et.json';
import fiTranslations from '@/locales/fi.json';
import frTranslations from '@/locales/fr.json';
import glTranslations from '@/locales/gl.json';
import deTranslations from '@/locales/de.json';
import elTranslations from '@/locales/el.json';
import heTranslations from '@/locales/he.json';
import huTranslations from '@/locales/hu.json';
import idTranslations from '@/locales/id.json';
import itTranslations from '@/locales/it.json';
import jaTranslations from '@/locales/ja.json';
import koTranslations from '@/locales/ko.json';
import lvTranslations from '@/locales/lv.json';
import ltTranslations from '@/locales/lt.json';
import noTranslations from '@/locales/no.json';
import faTranslations from '@/locales/fa.json';
import plTranslations from '@/locales/pl.json';
import ptTranslations from '@/locales/pt.json';
import roTranslations from '@/locales/ro.json';
import ruTranslations from '@/locales/ru.json';
import srTranslations from '@/locales/sr.json';
import skTranslations from '@/locales/sk.json';
import slTranslations from '@/locales/sl.json';
import esTranslations from '@/locales/es.json';
import svTranslations from '@/locales/sv.json';
import thTranslations from '@/locales/th.json';
import trTranslations from '@/locales/tr.json';
import ukTranslations from '@/locales/uk.json';
import viTranslations from '@/locales/vi.json';


const translations = {
  en: enTranslations,
  sq: sqTranslations,
  ar: arTranslations,
  bg: bgTranslations,
  ca: caTranslations,
  'zh-CN': zhCNTranslations,
  hr: hrTranslations,
  cs: csTranslations,
  da: daTranslations,
  nl: nlTranslations,
  eo: eoTranslations,
  et: etTranslations,
  fi: fiTranslations,
  fr: frTranslations,
  gl: glTranslations,
  de: deTranslations,
  el: elTranslations,
  he: heTranslations,
  hu: huTranslations,
  id: idTranslations,
  it: itTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  lv: lvTranslations,
  lt: ltTranslations,
  no: noTranslations,
  fa: faTranslations,
  pl: plTranslations,
  pt: ptTranslations,
  ro: roTranslations,
  ru: ruTranslations,
  sr: srTranslations,
  sk: skTranslations,
  sl: slTranslations,
  es: esTranslations,
  sv: svTranslations,
  th: thTranslations,
  tr: trTranslations,
  uk: ukTranslations,
  vi: viTranslations,
};

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('appLanguage');
      return translations[savedLang] ? savedLang : 'en';
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
      document.documentElement.lang = language;
      // For RTL languages like Arabic or Hebrew
      if (['ar', 'he', 'fa'].includes(language)) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  }, [language]);

  const t = useCallback((key, options = {}) => {
    let currentTranslationsSet = translations[language] || translations.en;
    
    if (!currentTranslationsSet[key] && language !== 'en') {
      currentTranslationsSet = translations.en; 
    }
    let translation = currentTranslationsSet[key] || key; 

    if (typeof translation === 'string') {
        // Handle simple {{placeholder}}
        Object.keys(options).forEach(optionKey => {
            if (typeof options[optionKey] !== 'object') {
                const regex = new RegExp(`{{${optionKey}}}`, 'g');
                translation = translation.replace(regex, options[optionKey]);
            }
        });

        // Handle ICU-like pluralization: {count, plural, =0:no items|=1:one item|other:# items}
        // or simple pluralization using key_one, key_other
        if (options.count !== undefined) {
            const count = Number(options.count);
            const pluralKeySuffix = count === 1 ? '_one' : '_other';
            const specificPluralKey = `${key}${pluralKeySuffix}`;

            if (currentTranslationsSet[specificPluralKey]) {
                translation = currentTranslationsSet[specificPluralKey];
            } else if (translation.includes('{count, plural,')) {
                 // Basic ICU MessageFormat-like plural parsing (simplified)
                const pluralMatch = translation.match(/{count, plural, (.*?)}/);
                if (pluralMatch && pluralMatch[1]) {
                    const rulesRaw = pluralMatch[1].split('|');
                    const rules = {};
                    rulesRaw.forEach(ruleStr => {
                        const parts = ruleStr.split(':');
                        rules[parts[0].trim()] = parts.slice(1).join(':').trim();
                    });

                    let chosenRule = rules[`=${count}`] || (count === 1 && rules['=1']) || rules.one || rules.other;
                    if (chosenRule) {
                        translation = chosenRule.replace('#', count.toString());
                    } else {
                        // Fallback if no matching rule is found, try replacing {count}
                         translation = translation.replace('{count}', count.toString());
                    }
                }
            }
             // Ensure count is replaced if still present
            translation = translation.replace(/{{count}}/g, count.toString());
            translation = translation.replace(/# /g, `${count} `); // For cases like "# items"
            translation = translation.replace(/#/g, count.toString());


        }
    }
    return translation;
  }, [language]);

  return (
    <I18nContext.Provider value={{ t, setLanguage, currentLanguage: language }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
