import enUS from "./locales/en-US.json";
import itIT from "./locales/it-IT.json";
import zhCN from "./locales/zh-CN.json";
import deDE from "./locales/de-DE.json";
import trTR from "./locales/tr-TR.json";
import ruRU from "./locales/ru-RU.json";
import viVN from "./locales/vi-VN.json";
import esES from "./locales/es-ES.json";
import frFR from "./locales/fr-FR.json";
import idID from "./locales/id-ID.json";
import ptBR from "./locales/pt-BR.json";
import zhTW from "./locales/zh-TW.json";
import defaultsDeep from "lodash.defaultsdeep";

// Translation strings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<string, any> = {
    "en-US": enUS,
    "it-IT": defaultsDeep(itIT, enUS),
    "zh-CN": defaultsDeep(zhCN, enUS),
    "de-DE": defaultsDeep(deDE, enUS),
    "tr-TR": defaultsDeep(trTR, enUS),
    "ru-RU": defaultsDeep(ruRU, enUS),
    "vi-VN": defaultsDeep(viVN, enUS),
    "es-ES": defaultsDeep(esES, enUS),
    "fr-FR": defaultsDeep(frFR, enUS),
    "id-ID": defaultsDeep(idID, enUS),
    "pt-BR": defaultsDeep(ptBR, enUS),
    "zh-TW": defaultsDeep(zhTW, enUS),
};

export default translations;
