import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
