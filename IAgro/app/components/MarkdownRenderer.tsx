// app/components/MarkdownRenderer.tsx
import React from 'react';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const { colors } = useTheme(); // Para usar cores do tema, se desejar
  
  return (
    <MarkdownDisplay style={markdownStyles}>
      {content}
    </MarkdownDisplay>
  );
};

// Estilos personalizados para os elementos do Markdown
const markdownStyles = StyleSheet.create({
  // Estilo para parágrafos normais
  paragraph: {
    color: 'white',
    fontSize: 14,
    marginTop: 0,
    marginBottom: 8,
  },
  // Estilo para texto em negrito (**)
  strong: {
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
  // Estilo para itens de lista (*)
  bullet_list_icon: {
    color: 'white',
  },
  // Estilo para links
  link: {
    color: '#A5D6A7', // Um verde claro para links
    textDecorationLine: 'underline' as const,
  },
});

export default MarkdownRenderer;