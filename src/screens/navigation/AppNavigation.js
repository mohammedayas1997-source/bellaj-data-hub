// A cikin AppNavigation.js ko StackNavigator.js
import UserNIMCHistory from "./screens/User/NIMCHistory"; // Tabbatar path din dai-dai ne

// A cikin Stack.Navigator
<Stack.Screen
  name="UserNIMCHistory"
  component={UserNIMCHistory}
  options={{
    title: "Tarihin Aiki",
    headerStyle: { backgroundColor: "#0f172a" },
    headerTintColor: "#fff",
  }}
/>;
