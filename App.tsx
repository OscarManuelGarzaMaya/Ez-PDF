import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import HomeScreen from "./screens/HomeScreen";
import ViewerScreen from "./screens/ViewerScreen";

export type RootStackParamList = {
  Home: undefined;
  Viewer: { pdfId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen}/>
        <Stack.Screen name="Viewer" component={ViewerScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
