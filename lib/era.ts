export interface EraInfo {
  label: string;
  blurb: string;
}

/** Classifica a data numa "era" da internet para contextualizar o resultado. */
export function eraForDate(date: string): EraInfo {
  const year = Number(date.slice(0, 4));

  if (year < 1996) {
    return {
      label: "Pré-história",
      blurb: "A internet ainda engatinhava — pouco foi arquivado, mas o que existe é ouro.",
    };
  }
  if (year < 1998) {
    return {
      label: "Era dos portais",
      blurb: "UOL, Globo e Yahoo dominavam. O Google nem existia ainda.",
    };
  }
  if (year < 2004) {
    return {
      label: "Primeiros passos do Google",
      blurb: "O Google acabou de nascer e já mudou tudo. Orkut estava no forno.",
    };
  }
  if (year < 2008) {
    return {
      label: "Orkut, YouTube e Facebook chegam",
      blurb: "A internet começou a ter nome, rosto e vídeos de gatinho.",
    };
  }
  if (year < 2012) {
    return {
      label: "A febre do Orkut",
      blurb: "Depoimentos, scraps e comunidades. O Orkut era a rede social do Brasil.",
    };
  }
  if (year < 2015) {
    return {
      label: "Facebook e Instagram explodem",
      blurb: "O celular virou câmera e a internet foi pro bolso.",
    };
  }
  if (year < 2020) {
    return {
      label: "A internet no bolso",
      blurb: "Stories, memes e Wi-Fi em todo canto. A vida já era digital.",
    };
  }
  return {
    label: "Pandemia e home office",
    blurb: "A internet virou escritório, escola e vitrine do mundo inteiro.",
  };
}
