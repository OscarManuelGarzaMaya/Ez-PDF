import { Text, StyleSheet } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper/ScreenWrapper";

const ViewerScreen = ()=>{
    return (
      <ScreenWrapper>
        <Text>Viewer Screen</Text>
      </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        alignItems:"center",
        justifyContent:"center"
    }
})

export default ViewerScreen;