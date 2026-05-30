// AppNavigation.js ko StackNavigator.js

import UserNIMCHistory from "./screens/User/NIMCHistory";

// A cikin Stack.Navigator
<Stack.Screen
  name="UserNIMCHistory"
  component={UserNIMCHistory}
  options={{
    title: "Bellaj History",
    headerStyle: {
      backgroundColor: "#E60000",
    },
    headerTintColor: "#FFFFFF",
    headerTitleStyle: {
      fontWeight: "bold",
    },
  }}
/>;
