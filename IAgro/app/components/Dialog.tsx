//React e React Native imports
import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  Button,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";

// Componente de diálogo personalizado para exibir mensagens
const DialogCopagro = ({
  title,      
  content,     
  visible,     
  hideDialog,
}: {
  title: string;
  content: string;
  visible: boolean;
  hideDialog: () => void;
}) => {
  return (
    
    // Garante que o diálogo apareça por cima de todos os outros elementos
    <Portal>
      
      <Dialog 
        visible={visible}
        onDismiss={hideDialog}
        style={styles.dialog}
      >
        {/* Título */}
        <Dialog.Title style={styles.title}>
          {title}
        </Dialog.Title>
        
        {/* Conteúdo principal */}
        <Dialog.Content style={styles.content}>
          <Text variant="bodyMedium">{content}</Text>
        </Dialog.Content>
        
        {/* Área dos botões de ação */}
        <Dialog.Actions style={styles.actions}>
          <Button
            textColor="#028C48"           
            onPress={hideDialog}
            labelStyle={styles.buttonLabel}
          >
            Ok
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  title: {
    textAlign: "left",
    fontWeight: "bold",
    fontSize: 22,
    color: "#333333",
  },
  content: {
    paddingVertical: 10,
  },
  actions: {
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingRight: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DialogCopagro;
