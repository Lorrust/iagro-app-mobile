import * as React from "react";
import { View, StyleSheet } from "react-native";
import {
  Button,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";

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
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <Dialog.Title style={styles.title}>{title}</Dialog.Title>
          <Dialog.Content style={styles.content}>
            <Text variant="bodyMedium">{content}</Text>
          </Dialog.Content>
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
    textAlign: "center",
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
