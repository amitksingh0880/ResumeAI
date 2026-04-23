import React from "react";
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  containerStyle,
  inputStyle,
  icon,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label.toUpperCase()}</Text>}
      <View style={[styles.inputWrapper, !!error && styles.inputError]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#333"
          secureTextEntry={secureTextEntry}
          style={[styles.input, inputStyle]}
          autoCapitalize="none"
          spellCheck={false}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#1F1F1F",
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter",
  },
  icon: {
    marginRight: 10,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});
