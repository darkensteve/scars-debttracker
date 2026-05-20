import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Searchbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDebt } from '../context/DebtContext';
import { formatDateTime, formatMoney } from '../utils/format';
import { colors } from '../theme/colors';

export default function ContactsScreen({ navigation }) {
  const { contacts, contactBalance, settings, transactions, updateContact } = useDebt();
  const [searchQuery, setSearchQuery] = useState('');

  const latestByContact = useMemo(() => {
    const map = new Map();
    for (const tx of transactions) {
      const existing = map.get(tx.contactId);
      if (!existing || new Date(tx.date) > new Date(existing.date)) {
        map.set(tx.contactId, tx);
      }
    }
    return map;
  }, [transactions]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = q
      ? contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q))
        )
      : [...contacts];
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, searchQuery]);

  const handleAvatarPress = async (contact) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets && result.assets[0];
    if (!asset?.uri) return;
    await updateContact(contact.id, { photoUri: asset.uri });
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name or phone"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No contacts yet. Tap + to add someone.
          </Text>
        }
        renderItem={({ item }) => {
          const balance = contactBalance(item.id);
          const latest = latestByContact.get(item.id);
          const hasPhone = !!item.phone;
          return (
            <Card style={styles.contactCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.contactRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAvatarPress(item)}
                  >
                    {item.photoUri ? (
                      <Image
                        source={{ uri: item.photoUri }}
                        style={styles.avatarImage}
                        onError={() => updateContact(item.id, { photoUri: null })}
                      />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    {hasPhone ? (
                      <Text style={styles.phone}>{item.phone}</Text>
                    ) : (
                      <Text style={styles.phoneMuted}>No phone added</Text>
                    )}
                    {latest ? (
                      <Text style={styles.activityMeta}>
                        Last activity: {formatDateTime(latest.date)}
                      </Text>
                    ) : (
                      <Text style={styles.activityMeta}>No records yet</Text>
                    )}
                  </View>

                  <View style={styles.balanceCol}>
                    <Text
                      style={[
                        styles.balance,
                        balance > 0 && styles.balanceOwed,
                        balance === 0 && styles.balanceSettled,
                      ]}
                    >
                      {balance === 0
                        ? 'Settled'
                        : formatMoney(balance, settings.currency)}
                    </Text>
                    <Pressable
                      hitSlop={12}
                      onPress={() =>
                        navigation.navigate('ContactDetail', { contactId: item.id })
                      }
                    >
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={22}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('AddContact')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    elevation: 0,
  },
  list: {
    paddingBottom: 88,
  },
  contactCard: {
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  cardContent: {
    paddingVertical: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: 20,
    color: colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  contactInfo: {
    flex: 1,
    marginRight: 8,
  },
  activityMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  balance: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.textSecondary,
  },
  balanceOwed: {
    color: colors.primary,
  },
  balanceSettled: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.success,
  },
  contactName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  phone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  phoneMuted: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: colors.primaryDark,
    shadowOpacity: 0.2,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
});
