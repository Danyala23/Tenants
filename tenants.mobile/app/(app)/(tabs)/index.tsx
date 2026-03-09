import { useState, useCallback, useEffect } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { FAB, Card, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useNotifications } from '../../src/context/NotificationContext';
import type { Property, BillSummary } from '../../src/types';
import PropertyModal from '../../src/components/PropertyModal';

export default function DashboardScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [billSummaries, setBillSummaries] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const router = useRouter();
  const { toast, confirm } = useNotifications();

  const loadData = useCallback(async () => {
    try {
      const [props, summaries] = await Promise.all([
        api.properties.list(),
        api.bills.billSummary(),
      ]);
      setProperties(props);
      setBillSummaries(summaries);
    } catch (e) {
      toast({ message: 'Failed to load properties', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProperty = () => {
    setEditingProperty(null);
    setModalVisible(true);
  };

  const handleEditProperty = (p: Property) => {
    setEditingProperty(p);
    setModalVisible(true);
  };

  const handleDeleteProperty = async (p: Property) => {
    const ok = await confirm({
      title: 'Delete Property',
      message: `Are you sure you want to delete ${p.houseNumber || p.address || 'this property'}?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.properties.delete(p.id);
      setModalVisible(false);
      toast({ message: 'Property deleted', type: 'success' });
      loadData();
    } catch {
      toast({ message: 'Failed to delete property', type: 'error' });
    }
  };

  const handleSaveProperty = async (data: {
    houseNumber: string;
    address: string;
    size: number;
  }) => {
    try {
      if (editingProperty) {
        await api.properties.update(editingProperty.id, data);
        toast({ message: 'Property updated', type: 'success' });
      } else {
        await api.properties.create(data);
        toast({ message: 'Property added', type: 'success' });
      }
      setModalVisible(false);
      loadData();
    } catch {
      toast({ message: 'Failed to save property', type: 'error' });
    }
  };

  const getBillSummary = (propertyId: number) => {
    return billSummaries.find((s) => s.propertyId === propertyId);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(p) => String(p.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const summary = getBillSummary(item.id);
          return (
            <Card
              style={styles.card}
              onPress={() => router.push(`/(app)/property/${item.id}`)}
              onLongPress={() => handleEditProperty(item)}
            >
              <Card.Content>
                <Text variant="titleMedium">
                  {item.houseNumber || item.address || `Property #${item.id}`}
                </Text>
                {item.address ? (
                  <Text variant="bodySmall" style={styles.address}>
                    {item.address}
                  </Text>
                ) : null}
                <View style={styles.row}>
                  <Text variant="bodySmall">{item.size} Marlas</Text>
                  {summary && summary.totalCount > 0 ? (
                    <Text
                      variant="bodySmall"
                      style={
                        summary.unpaidCount > 0
                          ? styles.unpaidBadge
                          : styles.paidBadge
                      }
                    >
                      {summary.unpaidCount}/{summary.totalCount} bills unpaid
                    </Text>
                  ) : null}
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />
      <FAB icon="plus" style={styles.fab} onPress={handleAddProperty} />
      <PropertyModal
        visible={modalVisible}
        property={editingProperty}
        onDismiss={() => setModalVisible(false)}
        onSave={handleSaveProperty}
        onDelete={
          editingProperty
            ? () => handleDeleteProperty(editingProperty)
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 8,
  },
  address: {
    opacity: 0.7,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  unpaidBadge: {
    color: '#d32f2f',
  },
  paidBadge: {
    color: '#2e7d32',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
