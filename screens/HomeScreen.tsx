import { View, Text, StyleSheet, Button } from "react-native";

// Navigation
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

import { useThemeStore } from '../store/themeStore'

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const HomeScreen =()=>{
    const navigation = useNavigation<HomeNavProp>()

    const { isDark, toggleTheme } = useThemeStore()
    
    return (
        <View style={styles.container}>
            <Text>Home screen</Text>
            <Button
                title="Ir al viewer"
                onPress={() => {
                    navigation.navigate('Viewer', { pdfId: 'test-123' })
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HomeScreen;