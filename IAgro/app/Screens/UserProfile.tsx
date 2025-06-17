import React, { useEffect, useState } from "react";
import { StyleSheet, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Divider, Subheading, useTheme } from "react-native-paper";
import TextInputCopagro from "../components/ButtonTxt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedInputCopagro from "../components/MaskedInputCopagro";
import axiosService from "@/services/axiosService";
import { router } from "expo-router";

// Interface do usuário
interface User {
  fullName: string;
  corporateName?: string;
  email: string;
  document: string;
}

const UserProfileScreen = () => {
  const theme = useTheme();
  let userUid;
  const [user, setUser] = useState<User>({
    fullName: "",
    corporateName: "",
    email: "",
    document: "",
  });

  const [originalUser, setOriginalUser] = useState<User>({
    fullName: "",
    corporateName: "",
    email: "",
    document: "",
  });

  const [originalCpf, setOriginalCpf] = useState<string>("");
  const [originalCnpj, setOriginalCnpj] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const userData = JSON.parse(userString);

        setOriginalCpf(userData.cpf || "");
        setOriginalCnpj(userData.cnpj || "");

        const currentUserData = {
          fullName: userData.fullName,
          corporateName: userData.corporateName,
          email: userData.email,
          document: userData.cpf ? userData.cpf : userData.cnpj,
        };
        setUser(currentUserData);
        setOriginalUser(currentUserData);
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (field: keyof User, value: string) => {
    setUser((prevUser) => ({
      ...prevUser,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const payload: { [key: string]: any } = {};

      if (user.fullName !== originalUser.fullName) {
        payload.fullName = user.fullName;
      }
      if (user.corporateName !== originalUser.corporateName) {
        payload.corporateName = user.corporateName;
      }
      if (user.email !== originalUser.email) {
        payload.email = user.email;
      }

      const userUid = await AsyncStorage.getItem("uid");

      if (Object.keys(payload).length === 0) {
        Alert.alert("Nenhuma alteração", "Não há dados para salvar.");
        return;
      }

      console.log("Dados a serem salvos:", payload);
      const idToken = await AsyncStorage.getItem("idToken");

      if (userUid) {
        await axiosService.put(`/users/${userUid}`, payload, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const updatedUserForStorage = {
          ...user,
          cpf: originalCpf,
          cnpj: originalCnpj,
        };
        if (user.corporateName !== originalUser.corporateName) {
          if ((user.corporateName ?? "").length === 0) {
            updatedUserForStorage.cpf = user.document;
            updatedUserForStorage.cnpj = "";
          } else {
            updatedUserForStorage.cnpj = user.document;
            updatedUserForStorage.cpf = "";
          }
        }

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(updatedUserForStorage)
        );
        Alert.alert("Sucesso", "Seus dados foram atualizados com sucesso.");
        setOriginalUser(user);
      }
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao atualizar seus dados. Tente novamente."
      );
    }
  };

  const handleDeleteAccount = async () => {
    const userUid = await AsyncStorage.getItem("uid");
    Alert.alert(
      "Excluir Conta",
      "Tem certeza de que deseja excluir sua conta? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const idToken = await AsyncStorage.getItem("idToken");
              await axiosService.del(`/users/${userUid}`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              });

              await AsyncStorage.multiRemove(["user", "uid", "idToken"]);

              router.replace("/Auth/LoginSys");
            } catch (error) {
              console.error("Erro ao excluir conta:", error);
              Alert.alert(
                "Erro",
                "Não foi possível excluir a conta. Tente novamente."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Subheading style={styles.subheading}>
          Gerencie suas informações
        </Subheading>

        <Image
          source={{
            uri: `https://ui-avatars.com/api/?background=199c5b&color=fff&size=150&name=${user.fullName}`,
          }}
          alt="Nome do usuário"
          height={120}
          width={120}
          style={styles.profileImage}
        />
        <Divider style={styles.divider} />

        <TextInputCopagro
          label="Nome Completo"
          value={user.fullName}
          onChangeText={(text) => handleInputChange("fullName", text)}
        />
        <TextInputCopagro
          label="Nome Corporativo"
          value={user.corporateName || "Não informado"}
          onChangeText={(text) => handleInputChange("corporateName", text)}
          readOnly={(user.corporateName ?? "").length < 1}
        />
        <TextInputCopagro
          label="E-mail"
          value={user.email}
          keyboardType="email-address"
          onChangeText={(text) => handleInputChange("email", text)}
        />

        {(user.corporateName ?? "").length === 0 && (
          <MaskedInputCopagro
            type="cpf"
            label="CPF"
            value={user.document}
            readOnly
          />
        )}

        {(user.corporateName ?? "").length > 0 && (
          <MaskedInputCopagro
            type="cnpj"
            label="CNPJ"
            value={user.document}
            readOnly
          />
        )}

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
  profileImage: {
    borderRadius: 100,
    alignSelf: "center",
    marginBottom: 10,
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
