import { useState, useCallback, useEffect } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { FAB, Text, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../../src/api';
import { useNotifications } from '../../../src/context/NotificationContext';
import type { Property, BillSummary } from '../../../src/types';
import PropertyModal from '../../../src/components/PropertyModal';
import { Colors, Spacing, Radius } from '../../../src/theme';

export default function DashboardScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [billSummaries, setBillSummaries] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const router = useRouter();
  const { toast, confirm } = useNotifications();
  const theme = useTheme();

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
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderPropertyCard = ({ item }: { item: Property }) => {
    const summary = getBillSummary(item.id);
    const hasUnpaid = summary && summary.unpaidCount > 0;
    const allPaid = summary && summary.totalCount > 0 && summary.unpaidCount === 0;

    return (
      <Pressable
        onPress={() => router.push(`/(app)/property/${item.id}`)}
        onLongPress={() => handleEditProperty(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.cardBody}>
          <View style={[styles.cardAccent, {
            backgroundColor: hasUnpaid ? Colors.error : allPaid ? Colors.success : theme.colors.primary,
          }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text
                variant="titleMedium"
                style={[styles.cardTitle, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {item.houseNumber || item.address || `Property #${item.id}`}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </View>

            {item.address ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <Chip
                compact
                textStyle={styles.chipText}
                style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
                icon={() => (
                  <MaterialCommunityIcons
                    name="ruler-square"
                    size={13}
                    color={theme.colors.onSurfaceVariant}
                  />
                )}
              >
                {item.size} Marlas
              </Chip>

              {summary && summary.totalCount > 0 ? (
                <Chip
                  compact
                  textStyle={[
                    styles.chipText,
                    { color: hasUnpaid ? Colors.errorDark : Colors.successDark },
                  ]}
                  style={[
                    styles.chip,
                    { backgroundColor: hasUnpaid ? Colors.errorLight : Colors.successLight },
                  ]}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={hasUnpaid ? 'alert-circle-outline' : 'check-circle-outline'}
                      size={13}
                      color={hasUnpaid ? Colors.errorDark : Colors.successDark}
                    />
                  )}
                >
                  {hasUnpaid
                    ? `${summary.unpaidCount} unpaid`
                    : 'All paid'}
                </Chip>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {properties.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="home-city-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.5 }}
          />
          <Text
            variant="titleMedium"
            style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            No properties yet
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Tap the + button to add your first property
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          renderItem={renderPropertyCard}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#FFFFFF"
        onPress={handleAddProperty}
      />

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
  list: {
    padding: Spacing.lg,
    paddingBottom: 80,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  infoText: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
    marginVertical: 0,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    borderRadius: Radius.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
});
