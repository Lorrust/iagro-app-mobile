import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { TextInput, IconButton, Surface } from 'react-native-paper';
import LogoCopagroUsers from '../components/LogoCopagroUsers';

const IntroScreen = () => {
  return (
      <View style={styles.container}>
      {/* Logo no topo */}
        <View>
            <LogoCopagroUsers/>
        </View>

      {/* Search Bar */}
      <Surface style={styles.searchContainer}>
        <TextInput
          placeholder="Pesquise por alguma conversa"
          mode="flat"
          underlineColor="transparent"
          style={styles.searchInput}
          right={<TextInput.Icon icon="magnify" />}
        />
      </Surface>

      {/* Illustration  */}
        <Image
          source={require('../../assets/images/intro.png')}
            style={styles.illustration}
            resizeMode="contain"
        />

      {/* Description */}
        <Text style={styles.description}>
            Análises e consultas fenológicas aparecerão {'\n'} aqui após sua primeira foto
        </Text>

        <Image 
          source={require('../../assets/images/seta.png')} 
            style={styles.seta} 
        />

      {/* Camera Button */}
      <IconButton
        icon="camera"
        size={36} 
        mode="contained"
        containerColor="#D9D9D9"
        iconColor="#ffffff"
        onPress={() => console.log('Abrir câmera')}
        style={styles.cameraButton}
     />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 160,
    height: 40,
    marginBottom: 30,
  },
  searchContainer: {
    width: '85%',
    marginTop: 30,
    elevation: 2,
    borderRadius: 33,
  },
  searchInput: {
    backgroundColor: '#F8F3F9',
    borderRadius: 33,
    height: 50,
  },
  illustration: {
    width: '100%',
    height: 450,
    marginTop: 90   ,
  },
  seta: {
    width: 30,
    height: 30,
    marginTop: -33,
    marginBottom: 20,
    left: 145,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
  },
  cameraButton: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    position: 'absolute',
    bottom: 40,
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#AFAFAF',
  },
  cameraIcon: {
    width: 39,
    height: 39,
  },  
});

export default IntroScreen;
