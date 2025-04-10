import { View, Text, Switch } from "react-native";
import { useState } from "react";
import { LogoCopagro } from "./components/LogoCopagro";

export default function SettingsScreen() {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <LogoCopagro/>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Configurações</Text>
      <Text>Modo Escuro</Text>
      <Switch value={isEnabled} onValueChange={() => setIsEnabled(!isEnabled)} />
    </View>
  );
}
