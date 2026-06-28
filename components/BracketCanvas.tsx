import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, Platform, TouchableOpacity, StyleSheet, type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';

/**
 * Container de rolagem do chaveamento, responsivo, com:
 *  - FAIXA DE TÍTULOS FIXA (sticky): os rótulos de fase ficam num cabeçalho que
 *    não some na rolagem vertical e acompanha o pan horizontal no celular.
 *  - ZOOM: botões − / ajustar / + escalam o canvas (transform top-left), úteis
 *    no celular para ver o bracket inteiro ou aproximar um confronto.
 *  - No PC (canvas cabe na largura) sem zoom-in: rolagem vertical limpa.
 *  - No celular / com zoom-in: pan horizontal + vertical.
 *
 * Mede a largura disponível e informa via onWidth para o pai recalcular o layout.
 */

export const BAND_H = 42; // altura (lógica) da faixa de títulos de fase

const STEP = 0.15;
const MAX_SCALE = 1.4;
const ABS_MIN_SCALE = 0.35;

let cssInjected = false;
function injectScrollbarCSS(): void {
  if (cssInjected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  cssInjected = true;
  const style = document.createElement('style');
  style.setAttribute('data-bracket-scrollbar', '');
  style.textContent = `
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: ${Colors.backgroundAlt}; }
    ::-webkit-scrollbar-thumb {
      background: ${Colors.surfaceElevated};
      border-radius: 6px;
      border: 2px solid ${Colors.backgroundAlt};
    }
    ::-webkit-scrollbar-thumb:hover { background: ${Colors.accentGold}; }
    * { scrollbar-width: thin; scrollbar-color: ${Colors.surfaceElevated} ${Colors.backgroundAlt}; }
  `;
  document.head.appendChild(style);
}

export function BracketCanvas({
  canvasW,
  bodyH,
  labels,
  onWidth,
  children,
}: {
  /** Largura lógica do bracket (antes do zoom). */
  canvasW: number;
  /** Altura lógica do corpo rolável (antes do zoom, sem a faixa de títulos). */
  bodyH: number;
  /** Rótulos de fase (posicionados em x por colXs) — renderizados na faixa fixa. */
  labels?: React.ReactNode;
  onWidth?: (w: number) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const [availW, setAvailW] = useState(0);
  const [availH, setAvailH] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => { injectScrollbarCSS(); }, []);

  function handleLayout(e: LayoutChangeEvent): void {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - availW) > 1) { setAvailW(width); onWidth?.(width); }
    if (Math.abs(height - availH) > 1) setAvailH(height);
  }

  // Escala que faz o bracket inteiro caber na largura (para o botão "ajustar").
  const fitScale = availW > 0 && canvasW > 0
    ? Math.min(1, Math.max(ABS_MIN_SCALE, availW / canvasW))
    : 1;
  const minScale = Math.min(ABS_MIN_SCALE, fitScale);

  const clamp = useCallback(
    (s: number) => Math.max(minScale, Math.min(MAX_SCALE, s)),
    [minScale],
  );

  const zoomBy = useCallback((d: number) => setScale((s) => clamp(s + d)), [clamp]);
  const fit = useCallback(() => setScale(clamp(fitScale)), [clamp, fitScale]);

  const scaledW = canvasW * scale;
  const scaledBodyH = bodyH * scale;
  const bandH = BAND_H * scale;
  const contentW = Math.max(scaledW, availW);
  const needsH = availW > 0 && scaledW > availW + 1;

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <ScrollView
        horizontal
        scrollEnabled={needsH}
        showsHorizontalScrollIndicator={needsH}
        style={{ flex: 1 }}
        contentContainerStyle={{ width: contentW }}
      >
        {availH > 0 && (
          <View style={{ width: contentW, height: availH }}>
            {/* Faixa de títulos — fixa verticalmente, acompanha o pan horizontal */}
            <View style={[cz.band, { height: bandH, width: scaledW }]}>
              <View style={{ width: canvasW, height: BAND_H, transform: [{ scale }], transformOrigin: 'top left' }}>
                {labels}
              </View>
            </View>
            {/* Corpo rolável (vertical) */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ height: scaledBodyH, width: scaledW }}
              showsVerticalScrollIndicator
            >
              <View style={{ width: canvasW, height: bodyH, transform: [{ scale }], transformOrigin: 'top left' }}>
                {children}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Controles de zoom */}
      <View style={cz.controls} pointerEvents="box-none">
        <TouchableOpacity style={cz.btn} onPress={() => zoomBy(-STEP)} activeOpacity={0.8} accessibilityLabel="Diminuir zoom">
          <Ionicons name="remove" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={cz.btn} onPress={fit} activeOpacity={0.8} accessibilityLabel="Ajustar à tela">
          <Ionicons name="scan-outline" size={15} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={cz.btn} onPress={() => zoomBy(STEP)} activeOpacity={0.8} accessibilityLabel="Aumentar zoom">
          <Ionicons name="add" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cz = StyleSheet.create({
  band: {
    backgroundColor: Colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    overflow: 'hidden',
    zIndex: 2,
  },
  controls: {
    position: 'absolute',
    right: 10,
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    ...Shadows.sm,
  },
  btn: {
    width: 32, height: 32, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.backgroundAlt,
  },
});
