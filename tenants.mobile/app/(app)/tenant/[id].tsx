import { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Card, Text, Button, List } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../src/api';
import type {
  Tenant,
  Occupancy,
  RentPayment,
  RentIncreaseRule,
} from '../../src/types';
import RentIncreaseModal from '../../src/components/RentIncreaseModal';

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = parseInt(id ?? '0', 10);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [occupancies, setOccupancies] = useState<Occupancy[]>([]);
  const [occupancyData, setOccupancyData] = useState<
    Record<number, { payments: RentPayment[]; rentIncrease: RentIncreaseRule | null }>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [increaseModal, setIncreaseModal] = useState(false);
  const [editingIncreaseOccId, setEditingIncreaseOccId] = useState<number | null>(
    null
  );
  const [increaseForm, setIncreaseForm] = useState({
    increasePercent: 10,
    nextIncreaseDate: '',
  });

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [t, occList] = await Promise.all([
        api.tenants.get(tenantId),
        api.occupancies.listByTenant(tenantId),
      ]);
      setTenant(t);
      setOccupancies(occList);

      const data: Record<
        number,
        { payments: RentPayment[]; rentIncrease: RentIncreaseRule | null }
      > = {};
      await Promise.all(
        occList.map(async (occ: Occupancy) => {
          const [payments, rentIncrease] = await Promise.all([
            api.payments.listByOccupancy(occ.id),
            api.rentIncrease.get(occ.id).catch(() => null),
          ]);
          data[occ.id] = { payments, rentIncrease };
        })
      );
      setOccupancyData(data);
    } catch {
      setTenant(null);
      setOccupancies([]);
      setOccupancyData({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openIncreaseModal = (occ: Occupancy) => {
    const data = occupancyData[occ.id];
    const rule = data?.rentIncrease;
    if (rule) {
      setIncreaseForm({
        increasePercent: rule.increasePercent,
        nextIncreaseDate: rule.nextIncreaseDate.slice(0, 10),
      });
    } else {
      setIncreaseForm({
        increasePercent: 10,
        nextIncreaseDate: new Date().toISOString().slice(0, 10),
      });
    }
    setEditingIncreaseOccId(occ.id);
    setIncreaseModal(true);
  };

  const handleIncreaseSave = async (data: {
    increasePercent: number;
    nextIncreaseDate: string;
  }) => {
    if (!editingIncreaseOccId) return;
    try {
      await api.rentIncrease.update(editingIncreaseOccId, data);
      setEditingIncreaseOccId(null);
      setIncreaseModal(false);
      loadData();
    } catch {
      // ignore
    }
  };

  if (loading || !tenant) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadData} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall">{tenant.name}</Text>
          <Text variant="bodyMedium">{tenant.phoneNumber}</Text>
        </Card.Content>
      </Card>

      <List.Section>
        <List.Subheader>Occupancies</List.Subheader>
        {occupancies.map((occ) => {
          const data = occupancyData[occ.id];
          const rentIncrease = data?.rentIncrease ?? null;
          const payments = data?.payments ?? [];
          return (
            <Card key={occ.id} style={styles.occCard}>
              <Card.Content>
                <Text variant="titleMedium">
                  {occ.isWholeProperty
                    ? 'Whole property'
                    : `Floor ${occ.floorLabel ?? occ.floorId ?? '-'}`}
                </Text>
                <Text variant="bodySmall" style={styles.detail}>
                  Rent: Rs. {occ.rent.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={styles.detail}>
                  Deposit: Rs. {occ.securityDeposit.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={styles.detail}>
                  Start: {occ.startDate.slice(0, 10)}
                </Text>
                {rentIncrease && (
                  <View style={styles.increaseRow}>
                    <Text variant="bodySmall">
                      Next increase: {rentIncrease.nextIncreaseDate.slice(0, 10)} (
                      {rentIncrease.increasePercent}%)
                    </Text>
                    <Button compact onPress={() => openIncreaseModal(occ)}>
                      Edit
                    </Button>
                  </View>
                )}
                <Text variant="titleSmall" style={styles.paymentsTitle}>
                  Rent Payments
                </Text>
                {payments.map((p) => (
                  <View key={p.id} style={styles.paymentRow}>
                    <Text variant="bodySmall">
                      {p.year}-{p.month}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={
                        p.isPaid ? styles.paid : styles.unpaid
                      }
                    >
                      {p.isPaid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                ))}
                {payments.length === 0 && (
                  <Text variant="bodySmall" style={styles.muted}>
                    No payment records yet.
                  </Text>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </List.Section>
      {occupancies.length === 0 && (
        <Text variant="bodyMedium" style={styles.muted}>
          No occupancies assigned.
        </Text>
      )}

      <RentIncreaseModal
        visible={increaseModal}
        increasePercent={increaseForm.increasePercent}
        nextIncreaseDate={increaseForm.nextIncreaseDate}
        onDismiss={() => {
          setIncreaseModal(false);
          setEditingIncreaseOccId(null);
        }}
        onSave={handleIncreaseSave}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { margin: 8 },
  occCard: { margin: 8 },
  detail: { marginTop: 4 },
  increaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentsTitle: { marginTop: 12 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  paid: { color: '#2e7d32' },
  unpaid: { color: '#757575' },
  muted: { opacity: 0.7, marginTop: 8 },
});
