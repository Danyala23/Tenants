import { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  FAB,
  List,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useNotifications } from '../../src/context/NotificationContext';
import { getPreviousMonth, monthLabel } from '../../src/utils/dateUtils';
import type {
  Property,
  Floor,
  Occupancy,
  Bill,
  RentPayment,
  RentIncreaseRule,
  UtilityConnection,
} from '../../src/types';
import FloorModal from '../../src/components/FloorModal';
import TenantModal from '../../src/components/TenantModal';
import CollectRentModal from '../../src/components/CollectRentModal';
import RentIncreaseModal from '../../src/components/RentIncreaseModal';
import UtilityModal from '../../src/components/UtilityModal';
import BillSnapshotModal from '../../src/components/BillSnapshotModal';

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = parseInt(id ?? '0', 10);
  const router = useRouter();
  const { toast, confirm } = useNotifications();

  const [property, setProperty] = useState<Property | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [occupanciesByFloor, setOccupanciesByFloor] = useState<
    Record<number, Occupancy[]>
  >({});
  const [paymentsByOccupancy, setPaymentsByOccupancy] = useState<
    Record<number, RentPayment[]>
  >({});
  const [rentIncreaseByOccupancy, setRentIncreaseByOccupancy] = useState<
    Record<number, RentIncreaseRule | null>
  >({});
  const [bills, setBills] = useState<Bill[]>([]);
  const [utilityConnections, setUtilityConnections] = useState<
    UtilityConnection[]
  >([]);
  const [billYear, setBillYear] = useState(currentYear);
  const [billMonth, setBillMonth] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [floorModal, setFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const [tenantModal, setTenantModal] = useState(false);
  const [editingOccupancy, setEditingOccupancy] = useState<Occupancy | null>(
    null
  );
  const [preselectedFloorId, setPreselectedFloorId] = useState<number | undefined>();

  const [collectModal, setCollectModal] = useState<{
    occId: number;
    rent: number;
    dues: number;
  } | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);

  const [increaseModal, setIncreaseModal] = useState(false);
  const [editingIncreaseOccId, setEditingIncreaseOccId] = useState<number | null>(
    null
  );
  const [increaseForm, setIncreaseForm] = useState({
    increasePercent: 10,
    nextIncreaseDate: '',
  });

  const [utilityModal, setUtilityModal] = useState(false);
  const [editingUtility, setEditingUtility] = useState<UtilityConnection | null>(
    null
  );

  const [billSnapshot, setBillSnapshot] = useState<{ id: number; html: string } | null>(null);

  const getPayment = useCallback(
    (occId: number, year: number, month: number) =>
      (paymentsByOccupancy[occId] ?? []).find(
        (p) => p.year === year && p.month === month
      ),
    [paymentsByOccupancy]
  );

  const getDues = useCallback(
    (occId: number, rent: number) => {
      const prev = getPreviousMonth(currentYear, currentMonth);
      const prevPayment = getPayment(occId, prev.year, prev.month);
      if (!prevPayment) return 0;
      const shortfall = rent - prevPayment.amountPaid;
      return shortfall > 0 ? shortfall : 0;
    },
    [getPayment]
  );

  const loadData = useCallback(async () => {
    if (!propertyId) return;
    try {
      const [p, fList] = await Promise.all([
        api.properties.get(propertyId),
        api.floors.listByProperty(propertyId).catch(() => [] as Floor[]),
      ]);
      setProperty(p);
      setFloors(fList);

      const occupancies: Record<number, Occupancy[]> = {};
      const allOccupancies: Occupancy[] = [];

      await Promise.all(
        fList.map(async (f: Floor) => {
          try {
            const occs = await api.occupancies.listByFloor(f.id);
            occupancies[f.id] = occs;
            allOccupancies.push(...occs);
          } catch {
            occupancies[f.id] = [];
          }
        })
      );
      setOccupanciesByFloor(occupancies);

      const payments: Record<number, RentPayment[]> = {};
      const increases: Record<number, RentIncreaseRule | null> = {};

      await Promise.all(
        allOccupancies.map(async (occ) => {
          const [pmts, ri] = await Promise.all([
            api.payments.listByOccupancy(occ.id).catch(() => []),
            api.rentIncrease.get(occ.id).catch(() => null),
          ]);
          payments[occ.id] = pmts;
          increases[occ.id] = ri;
        })
      );
      setPaymentsByOccupancy(payments);
      setRentIncreaseByOccupancy(increases);

      const [billList, connList] = await Promise.all([
        api.bills.list(
          propertyId,
          billYear,
          billMonth === '' ? undefined : (billMonth as number)
        ),
        api.utilityConnections.listByProperty(propertyId).catch(() => []),
      ]);
      setBills(billList);
      setUtilityConnections(connList);
    } catch {
      toast({ message: 'Failed to load property', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId, billYear, billMonth, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCollect = async () => {
    if (!collectModal) return;
    try {
      await api.payments.collect(collectModal.occId, {
        year: currentYear,
        month: currentMonth,
        amountPaid: collectAmount,
      });
      setCollectModal(null);
      toast({ message: 'Rent collected successfully', type: 'success' });
      loadData();
    } catch {
      toast({ message: 'Failed to collect rent', type: 'error' });
    }
  };

  const handleFloorSave = async (data: {
    floorNumber: number;
    label?: string;
  }) => {
    try {
      if (editingFloor) {
        await api.floors.update(editingFloor.id, data);
      } else {
        await api.floors.create(propertyId, data);
      }
      setFloorModal(false);
      loadData();
    } catch {
      toast({ message: 'Failed to save floor', type: 'error' });
    }
  };

  const handleFloorDelete = async (floorId: number) => {
    const ok = await confirm({
      message: 'Delete this floor and its tenants?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.floors.delete(floorId);
      loadData();
    } catch {
      toast({ message: 'Failed to delete floor', type: 'error' });
    }
  };

  const handleOccupancySave = async (form: {
    name: string;
    phoneNumber: string;
    rent: number;
    securityDeposit: number;
    startDate: string;
    floorIds: number[];
  }) => {
    try {
      if (editingOccupancy) {
        await api.occupancies.update(editingOccupancy.id, {
          floorId: form.floorIds[0],
          rent: form.rent,
          securityDeposit: form.securityDeposit,
          startDate: form.startDate,
        });
        await api.tenants.update(editingOccupancy.tenantId, {
          name: form.name,
          phoneNumber: form.phoneNumber,
        });
      } else {
        const rentPerFloor = form.rent / form.floorIds.length;
        const depositPerFloor = form.securityDeposit / form.floorIds.length;
        const tenant = await api.tenants.create({
          name: form.name,
          phoneNumber: form.phoneNumber,
        });
        for (const floorId of form.floorIds) {
          await api.occupancies.create(propertyId, {
            tenantId: tenant.id,
            floorId,
            rent: rentPerFloor,
            securityDeposit: depositPerFloor,
            startDate: form.startDate,
          });
        }
      }
      setTenantModal(false);
      loadData();
    } catch {
      toast({ message: 'Failed to save tenant', type: 'error' });
    }
  };

  const handleOccupancyDelete = async (occ: Occupancy) => {
    const ok = await confirm({
      message: `Remove ${occ.tenantName} from this floor?`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.occupancies.delete(occ.id);
      loadData();
    } catch {
      toast({ message: 'Failed to remove tenant', type: 'error' });
    }
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
      toast({ message: 'Failed to save rent increase rule', type: 'error' });
    }
  };

  const handleUtilitySave = async (data: {
    floorId: number | null;
    type: string;
    referenceNumber: string | null;
    consumerNumber: string | null;
    providerName: string | null;
  }) => {
    try {
      if (editingUtility) {
        await api.utilityConnections.update(editingUtility.id, data);
      } else {
        await api.utilityConnections.create(propertyId, data);
      }
      setUtilityModal(false);
      loadData();
      toast({ message: 'Saved', type: 'success' });
    } catch {
      toast({ message: 'Failed to save', type: 'error' });
    }
  };

  const handleBillMarkPaid = async (billId: number) => {
    try {
      await api.bills.markPaid(billId);
      loadData();
    } catch {
      toast({ message: 'Failed to update bill', type: 'error' });
    }
  };

  const handleViewBill = async (billId: number) => {
    try {
      const html = await api.bills.getSnapshotHtml(billId);
      setBillSnapshot({ id: billId, html });
    } catch {
      toast({ message: 'Failed to load bill', type: 'error' });
    }
  };

  const handleScrapeNow = async () => {
    try {
      await api.bills.scrapeNow();
      toast({ message: 'Scraping started', type: 'success' });
      loadData();
    } catch {
      toast({ message: 'Failed to start scraping', type: 'error' });
    }
  };

  if (loading || !property) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData()} />
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">
              {property.houseNumber || property.address || `Property #${property.id}`}
            </Text>
            <Text variant="bodyMedium">{property.size} Marlas</Text>
          </Card.Content>
        </Card>

        <List.Section>
          <List.Subheader>
            Floors
            <Button icon="plus" compact onPress={() => setFloorModal(true)}>
              Add
            </Button>
          </List.Subheader>
          {floors.map((f) => (
            <List.Item
              key={f.id}
              title={`Floor ${f.floorNumber} ${f.label ? `(${f.label})` : ''}`}
              description={`${occupanciesByFloor[f.id]?.length ?? 0} tenants`}
              right={() => (
                <View style={styles.row}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => {
                      setEditingFloor(f);
                      setFloorModal(true);
                    }}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleFloorDelete(f.id)}
                  />
                </View>
              )}
            />
          ))}
        </List.Section>
        <Divider />

        <List.Section>
          <List.Subheader>
            Tenants by Floor
            <Button
              icon="plus"
              compact
              onPress={() => {
                setEditingOccupancy(null);
                setPreselectedFloorId(undefined);
                setTenantModal(true);
              }}
            >
              Add Tenant
            </Button>
          </List.Subheader>
          {floors.map((f) => (
            <View key={f.id}>
              <Text variant="titleSmall" style={styles.floorSection}>
                Floor {f.floorNumber} {f.label ? `(${f.label})` : ''}
              </Text>
              {(occupanciesByFloor[f.id] ?? []).map((occ) => {
                const pmt = getPayment(occ.id, currentYear, currentMonth);
                const dues = getDues(occ.id, occ.rent);
                const isPaid = pmt?.isPaid ?? false;
                return (
                  <Card key={occ.id} style={styles.tenantCard}>
                    <Card.Content>
                      <Text
                        variant="titleMedium"
                        style={styles.link}
                        onPress={() => router.push(`/(app)/tenant/${occ.tenantId}`)}
                      >
                        {occ.tenantName}
                      </Text>
                      <Text variant="bodySmall">{occ.tenantPhone}</Text>
                      <Text variant="bodySmall">
                        Rent: Rs. {occ.rent.toLocaleString()}
                        {isPaid ? ' — Paid' : ' — Unpaid'}
                      </Text>
                      <View style={styles.tenantActions}>
                        {!isPaid && (
                          <Button
                            compact
                            onPress={() => {
                              setCollectModal({
                                occId: occ.id,
                                rent: occ.rent,
                                dues,
                              });
                              setCollectAmount(occ.rent + dues);
                            }}
                          >
                            Collect
                          </Button>
                        )}
                        <Button
                          compact
                          onPress={() => {
                            const rule = rentIncreaseByOccupancy[occ.id];
                            setIncreaseForm({
                              increasePercent: rule?.increasePercent ?? 10,
                              nextIncreaseDate:
                                rule?.nextIncreaseDate?.slice(0, 10) ??
                                new Date().toISOString().slice(0, 10),
                            });
                            setEditingIncreaseOccId(occ.id);
                            setIncreaseModal(true);
                          }}
                        >
                          Rent Increase
                        </Button>
                        <Button
                          compact
                          onPress={() => {
                            setEditingOccupancy(occ);
                            setTenantModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          compact
                          textColor="#d32f2f"
                          onPress={() => handleOccupancyDelete(occ)}
                        >
                          Remove
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
              <Button
                icon="plus"
                compact
                onPress={() => {
                  setEditingOccupancy(null);
                  setPreselectedFloorId(f.id);
                  setTenantModal(true);
                }}
              >
                Add
              </Button>
            </View>
          ))}
        </List.Section>
        <Divider />

        <List.Section>
          <List.Subheader>Bills</List.Subheader>
          <View style={styles.billFilters}>
            <Chip
              selected={billMonth === ''}
              onPress={() => setBillMonth('')}
              style={styles.chip}
            >
              All
            </Chip>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <Chip
                key={m}
                selected={billMonth === m}
                onPress={() => setBillMonth(m)}
                style={styles.chip}
              >
                {monthLabel(m).slice(0, 3)}
              </Chip>
            ))}
          </View>
          <Button icon="refresh" onPress={handleScrapeNow}>
            Scrape Now
          </Button>
          {bills.map((b) => (
            <List.Item
              key={b.id}
              title={`${b.type} ${monthLabel(b.month, b.year)}`}
              description={`Rs. ${b.amount.toLocaleString()} ${b.isPaid ? 'Paid' : 'Unpaid'}`}
              right={() => (
                <View style={styles.row}>
                  {b.hasSnapshot && (
                    <Button compact onPress={() => handleViewBill(b.id)}>
                      View
                    </Button>
                  )}
                  <Button
                    compact
                    onPress={() => handleBillMarkPaid(b.id)}
                  >
                    {b.isPaid ? 'Unpaid' : 'Paid'}
                  </Button>
                </View>
              )}
            />
          ))}
        </List.Section>
        <Divider />

        <List.Section>
          <List.Subheader>
            Utility Connections
            <Button icon="plus" compact onPress={() => setUtilityModal(true)}>
              Add
            </Button>
          </List.Subheader>
          {utilityConnections.map((uc) => (
            <List.Item
              key={uc.id}
              title={`${uc.type} ${uc.providerName || ''}`}
              description={`${uc.referenceNumber || uc.consumerNumber || ''}`}
              right={() => (
                <View style={styles.row}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => {
                      setEditingUtility(uc);
                      setUtilityModal(true);
                    }}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={async () => {
                      const ok = await confirm({
                        message: 'Delete this utility connection?',
                        confirmLabel: 'Delete',
                        variant: 'danger',
                      });
                      if (ok) {
                        await api.utilityConnections.delete(uc.id);
                        loadData();
                      }
                    }}
                  />
                </View>
              )}
            />
          ))}
        </List.Section>
      </ScrollView>

      <FloorModal
        visible={floorModal}
        editingFloor={editingFloor}
        defaultFloorNumber={floors.length}
        onDismiss={() => {
          setFloorModal(false);
          setEditingFloor(null);
        }}
        onSave={handleFloorSave}
      />

      <TenantModal
        visible={tenantModal}
        editingOccupancy={editingOccupancy}
        floors={floors}
        preselectedFloorId={preselectedFloorId}
        onDismiss={() => {
          setTenantModal(false);
          setEditingOccupancy(null);
        }}
        onSave={handleOccupancySave}
      />

      {collectModal && (
        <CollectRentModal
          visible={!!collectModal}
          rent={collectModal.rent}
          dues={collectModal.dues}
          amount={collectAmount}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onAmountChange={setCollectAmount}
          onSubmit={handleCollect}
          onDismiss={() => setCollectModal(null)}
        />
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

      <UtilityModal
        visible={utilityModal}
        editingUtility={editingUtility}
        floors={floors}
        onDismiss={() => {
          setUtilityModal(false);
          setEditingUtility(null);
        }}
        onSave={handleUtilitySave}
      />

      <BillSnapshotModal
        visible={!!billSnapshot}
        html={billSnapshot?.html ?? null}
        onDismiss={() => setBillSnapshot(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { margin: 8 },
  row: { flexDirection: 'row' },
  tenantActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tenantCard: { margin: 8 },
  floorSection: { marginLeft: 16, marginTop: 8 },
  billFilters: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  chip: { margin: 4 },
  link: { color: '#6750A4', textDecorationLine: 'underline' },
});
