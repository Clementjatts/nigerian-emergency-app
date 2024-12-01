import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// English translations
const en = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Try Again',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  emergency: {
    title: 'Emergency Alert',
    police: 'Police Emergency',
    medical: 'Medical Emergency',
    fire: 'Fire Emergency',
    security: 'Security Threat',
    confirmMessage: 'Are you sure you want to send an emergency alert?',
    warning: 'False alarms may result in penalties',
    help: 'Help is on the way',
    eta: 'Estimated arrival time: {{minutes}} minutes',
    callDirect: 'Call Emergency Services',
  },
  accessibility: {
    highContrast: 'High Contrast Mode',
    fontSize: 'Font Size',
    screenReader: 'Screen Reader',
  },
};

// Yoruba translations
const yo = {
  common: {
    loading: 'Ń gbéwọlé...',
    error: 'Àṣìṣe kan ṣẹlẹ̀',
    retry: 'Gbìyànjú lẹ́ẹ̀kan si',
    cancel: 'Fagilé',
    confirm: 'Jẹ́rìísí',
  },
  emergency: {
    title: 'Ìkìlọ̀ Pàjáwìrì',
    police: 'Pàjáwìrì Ọlọ́pàá',
    medical: 'Pàjáwìrì Ìwòsàn',
    fire: 'Pàjáwìrì Iná',
    security: 'Ewu Ààbò',
    confirmMessage: 'Ṣé ó dá ọ lójú pé o fẹ́ fi ìkìlọ̀ pàjáwìrì ránṣẹ́?',
    warning: 'Ìkìlọ̀ èké le fa ìjìyà',
    help: 'Ìrànlọ́wọ́ ń bọ̀',
    eta: 'Àkókò dédé tó ṣẹ́ku: {{minutes}} ìṣẹ́jú',
    callDirect: 'Pe Iṣẹ́ Pàjáwìrì',
  },
  accessibility: {
    highContrast: 'Ìpele Ìyàtọ̀ Gíga',
    fontSize: 'Ìtóbi Lẹ́tà',
    screenReader: 'Olùkà Ojú-iṣẹ́',
  },
};

// Hausa translations
const ha = {
  common: {
    loading: 'Ana loading...',
    error: 'Akwai kuskure',
    retry: 'Sake gwadawa',
    cancel: 'Soke',
    confirm: 'Tabbatar',
  },
  emergency: {
    title: 'Sanarwar Gaggawa',
    police: 'Gaggawar Yan Sanda',
    medical: 'Gaggawar Likita',
    fire: 'Gaggawar Gobara',
    security: 'Barazanar Tsaro',
    confirmMessage: 'Kana tabbatar kana son aika sanarwar gaggawa?',
    warning: 'Kiran karya na iya jawo hukunci',
    help: 'Taimako na zuwa',
    eta: 'Lokacin da aka tsara: minti {{minutes}}',
    callDirect: 'Kira Agajin Gaggawa',
  },
  accessibility: {
    highContrast: 'Yanayin Bambanci Mai Karfi',
    fontSize: 'Girman Rubutu',
    screenReader: 'Mai Karanta Allon',
  },
};

// Igbo translations
const ig = {
    common: {
        loading: 'Na-ebubata...',
        error: 'Nsogbu mere',
        retry: 'Nwaa ọzọ',
        cancel: 'Kagbuo',
        confirm: 'Kwenye',
    },
    emergency: {
        title: 'Ọkwa Mberede',
        police: 'Mberede Uwe Ojii',
        medical: 'Mberede Ahụike',
        fire: 'Mberede Ọkụ',
        security: 'Ihe Egwu Nchekwa',
        confirmMessage: 'Ị na-ekwenye na ị chọrọ izipu ọkwa mberede?',
        warning: 'Ọkwa ụgha nwere ike ịkpata ntaramahụhụ',
        help: 'Enyemaka na-abịa',
        eta: 'Oge a tụrụ anya: nkeji {{minutes}}',
        callDirect: 'Kpọọ Ọrụ Mberede',
    },
    accessibility: {
        highContrast: 'Ọnọdụ Nnukwu Ịdị Iche',
        fontSize: 'Nhazi Mkpụrụedemede',
        screenReader: 'Ọgụgụ Ihuenyo',
    },
};

const resources = {
  en: { translation: en },
  yo: { translation: yo },
  ha: { translation: ha },
  ig: { translation: ig },
};

const LANGUAGE_CODES = {
  ENGLISH: 'en',
  YORUBA: 'yo',
  HAUSA: 'ha',
  IGBO: 'ig',
};

class I18nService {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Get saved language or use device locale
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    const deviceLanguage = Localization.locale.split('-')[0];
    const defaultLanguage = Object.values(LANGUAGE_CODES).includes(deviceLanguage)
      ? deviceLanguage
      : LANGUAGE_CODES.ENGLISH;

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: savedLanguage || defaultLanguage,
        fallbackLng: LANGUAGE_CODES.ENGLISH,
        interpolation: {
          escapeValue: false,
        },
      });
  }

  async changeLanguage(languageCode) {
    if (Object.values(LANGUAGE_CODES).includes(languageCode)) {
      await AsyncStorage.setItem('userLanguage', languageCode);
      await i18n.changeLanguage(languageCode);
    }
  }

  getCurrentLanguage() {
    return i18n.language;
  }

  t(key, options = {}) {
    return i18n.t(key, options);
  }
}

export const SUPPORTED_LANGUAGES = [
  { code: LANGUAGE_CODES.ENGLISH, name: 'English' },
  { code: LANGUAGE_CODES.YORUBA, name: 'Yorùbá' },
  { code: LANGUAGE_CODES.HAUSA, name: 'Hausa' },
  { code: LANGUAGE_CODES.IGBO, name: 'Igbo' },
];

export default new I18nService();
