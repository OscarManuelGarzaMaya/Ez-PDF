import { View, Text, StyleSheet } from "react-native";

const ViewerScreen = ()=>{
    return (
      <View style={styles.container}>
        <Text>Viewer Screen</Text>
      </View>
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