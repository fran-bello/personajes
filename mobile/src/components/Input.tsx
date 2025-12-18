import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { colors } from '../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        error={!!error}
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.primaryLight}
        textColor={colors.text}
        placeholderTextColor={colors.textMuted}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
              color={colors.textMuted}
            />
          ) : null
        }
        theme={{
          colors: {
            background: colors.surface,
            surfaceVariant: colors.surface,
            onSurfaceVariant: colors.textSecondary,
          },
        }}
      />
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
});
