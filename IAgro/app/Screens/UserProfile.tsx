import React, { useState } from "react";
import { StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Divider,
  Subheading,
  useTheme,
} from "react-native-paper";
import TextInputCopagro from '../components/ButtonTxt';

// Interface do usuário
interface User {
  displayName: string;
  corporateName?: string;
  email: string;
  document: string;
}

const UserProfileScreen = () => {
  const theme = useTheme();
  const [user, setUser] = useState<User>({
    displayName: "João da Silva",
    corporateName: "Silva & Filhos Ltda.",
    email: "joao.silva@example.com",
    document: "123.456.789-00",
  });

  const handleInputChange = (field: keyof User, value: string) => {
    setUser((prevUser) => ({
      ...prevUser,
      [field]: value,
    }));
  };

  const handleSaveChanges = () => {
    console.log("Dados salvos:", user);
    Alert.alert("Sucesso", "Seus dados foram atualizados com sucesso.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Tem certeza de que deseja excluir sua conta? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => console.log("Conta excluída"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Subheading style={styles.subheading}>Gerencie suas informações</Subheading>

        <Divider style={styles.divider} />

        <TextInputCopagro
          label="Nome Completo"
          value={user.displayName}
          onChangeText={(text) => handleInputChange("displayName", text)}
        />
        <TextInputCopagro
          label="Nome Corporativo"
          value={user.corporateName}
          onChangeText={(text) => handleInputChange("corporateName", text)}
        />
        <TextInputCopagro
          label="E-mail"
          value={user.email}
          keyboardType="email-address"
          onChangeText={(text) => handleInputChange("email", text)}
        />
        <TextInputCopagro
          label="CPF ou CNPJ"
          value={user.document}
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange("document", text)}
        />

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          onPress={handleSaveChanges}
          style={styles.saveButton}
          buttonColor={"#028C48"}
          labelStyle={{ color: "#fff" }}
        >
          Salvar Alterações
        </Button>

        <Button
          mode="outlined"
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
          textColor={theme.colors.error}
        >
          Excluir Conta
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    padding: 20,
    gap: 10,
    height: "100%",
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    marginBottom: 4,
  },
  subheading: {
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  divider: {
    marginVertical: 20,
  },
  saveButton: {
    marginBottom: 15,
    paddingVertical: 6,
    borderRadius: 50,
  },
  deleteButton: {
    borderColor: "#D32F2F",
    borderWidth: 1,
    paddingVertical: 6,
    borderRadius: 50,
  },
});

export default UserProfileScreen;
