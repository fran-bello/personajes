import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../theme';
import { InputOverlay } from './InputOverlay';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  style = {},
  showOverlay = true,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            isPassword && styles.passwordInput,
            style
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#666"
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Image
              source={showPassword ? require('../../assets/img/ojo-abierto.png') : require('../../assets/img/ojo-cerrado.png')}
              style={styles.toggleIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {showOverlay && !isPassword && (
        <InputOverlay
          value={value}
          label={label}
          isVisible={isFocused}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Truculenta',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  input: {
    width: '100%',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#11111b',
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Truculenta',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff5555',
  },
  passwordInput: {
    paddingRight: 48,
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  toggleIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  errorText: {
    color: '#ff5555',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Truculenta',
  },
});





