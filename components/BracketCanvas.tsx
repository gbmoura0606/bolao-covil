import React, { useState, useEffect } from 'react';
import { View, ScrollView, Platform, type LayoutChangeEvent } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Container de rolagem do chaveamento, responsivo:
 *  - No PC/web (canvas cabe na largura): UMA rolagem vertical limpa, usando toda
 *    a largura disponível (as colunas são espalhadas por buildBracketLayout).
 *  - No celular (canvas maior que a tela): canvas livre — pan horizontal + vertical.
 *  - Barras de rolagem no tema do app (web), injetadas uma única vez.
 *
 * Mede a largura disponível e informa via onWidth para o pai recalcular o layout.
 */

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
  totalH,
  onWidth,
  children,
}: {
  canvasW: number;
  totalH: number;
  onWidth?: (w: number) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const [availW, setAvailW] = useState(0);

  useEffect(() => { injectScrollbarCSS(); }, []);

  function handleLayout(e: LayoutChangeEvent): void {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - availW) > 1) {
      setAvailW(w);
      onWidth?.(w);
    }
  }

  // Cabe na largura? → rolagem só vertical (PC). Senão → canvas livre (celular).
  const fits = availW > 0 && canvasW <= availW + 1;

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      {fits ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ height: totalH, width: canvasW }}
          showsVerticalScrollIndicator
        >
          {children}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={{ flex: 1 }}
          contentContainerStyle={{ width: canvasW }}
        >
          <ScrollView
            showsVerticalScrollIndicator
            style={{ flex: 1 }}
            contentContainerStyle={{ height: totalH, width: canvasW }}
          >
            {children}
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}
