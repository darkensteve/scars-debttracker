import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';

export default function ContactPicker({ contacts, value, onChange }) {
  const [visible, setVisible] = useState(false);
  const selected = contacts.find((c) => c.id === value);

  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {selected ? selected.name : 'Select person'}
          </Button>
        }
      >
        {contacts.map((c) => (
          <Menu.Item
            key={c.id}
            onPress={() => {
              onChange(c.id);
              setVisible(false);
            }}
            title={c.name}
          />
        ))}
      </Menu>
      {selected?.phone ? (
        <Text style={styles.phone}>{selected.phone}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
  phone: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
});

