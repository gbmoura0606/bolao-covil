import React, { useState } from 'react';
import { Image, Text } from 'react-native';

const COUNTRY_TO_ISO: Record<string, string> = {
  mex: 'mx', rsa: 'za', kor: 'kr', cze: 'cz',
  can: 'ca', bih: 'ba', qat: 'qa', sui: 'ch',
  bra: 'br', mar: 'ma', hai: 'ht', sco: 'gb-sct',
  usa: 'us', par: 'py', aus: 'au', tur: 'tr',
  ger: 'de', cur: 'cw', civ: 'ci', ecu: 'ec',
  ned: 'nl', jpn: 'jp', swe: 'se', tun: 'tn',
  bel: 'be', egy: 'eg', irn: 'ir', nzl: 'nz',
  esp: 'es', cpv: 'cv', ksa: 'sa', uru: 'uy',
  fra: 'fr', sen: 'sn', irq: 'iq', nor: 'no',
  arg: 'ar', alg: 'dz', aut: 'at', jor: 'jo',
  por: 'pt', cod: 'cd', uzb: 'uz', col: 'co',
  eng: 'gb-eng', cro: 'hr', gha: 'gh', pan: 'pa',
};

export function FlagImage({ country, height = 16 }: { country: string; height?: number }): React.JSX.Element {
  const [errored, setErrored] = useState(false);
  const code = COUNTRY_TO_ISO[country?.toLowerCase() ?? ''];
  if (!code || errored) {
    return <Text style={{ fontSize: height, lineHeight: height + 2 }}>🏳️</Text>;
  }
  const width = Math.round(height * 1.5);
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w40/${code}.png` }}
      style={{ width, height, borderRadius: 2 }}
      resizeMode="cover"
      onError={() => setErrored(true)}
    />
  );
}
