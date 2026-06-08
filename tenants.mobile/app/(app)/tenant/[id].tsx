import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Pressable,
} from 'react-native';
import { Menu } from 'react-native-paper';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { api } from '../../../src/api';
import { useThemeMode } from '../../../src/context/ThemeContext';
import { monthLabel } from '../../../src/utils/dateUtils';

function getMonthsBack(endYear: number, endMonth: number, count: number): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  let y = endYear;
  let m = endMonth;
  for (let i = 0; i < count; i++) {
    result.unshift({ year: y, month: m });
    m--;
    if (m < 1) { m = 12; y--; }
  }
  return result;
}

function formatCollectedAt(collectedAt: string | null | undefined): string {
  if (!collectedAt) return '—';
  try {
    return new Date(collectedAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}
import { Colors, Spacing, Radius, Gradients, FontFamily } from '../../../src/theme';
import type {
  Tenant,
  Occupancy,
  RentPayment,
  RentIncreaseRule,
} from '../../../src/types';
import RentIncreaseModal from '../../../src/components/RentIncreaseModal';

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = parseInt(id ?? '0', 10);
  const navigation = useNavigation();
  const theme = useTheme();
  const { theme: themeMode } = useThemeMode();
  const isDark = themeMode === 'dark';

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [occupancies, setOccupancies] = useState<Occupancy[]>([]);
  const [occupancyData, setOccupancyData] = useState<
    Record<number, { payments: RentPayment[]; rentIncrease: RentIncreaseRule | null }>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOcc, setExpandedOcc] = useState<number | null>(null);
  const [historyEndByOcc, setHistoryEndByOcc] = useState<Record<number, { year: number; month: number }>>({});
  const [menuVisibleByOcc, setMenuVisibleByOcc] = useState<Record<number, boolean>>({});
  const [increaseModal, setIncreaseModal] = useState(false);
  const [editingIncreaseOccId, setEditingIncreaseOccId] = useState<number | null>(null);
  const [increaseForm, setIncreaseForm] = useState({
    increasePercent: 10,
    nextIncreaseDate: '',
  });

  useLayoutEffect(() => {
    if (tenant) {
      navigation.setOptions({ title: tenant.name });
    }
  }, [tenant, navigation]);

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
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadData(); }}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <LinearGradient
          colors={isDark ? Gradients.brandDark : Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarLarge}
        >
          <Text style={styles.avatarLargeText}>
            {tenant.name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <Text variant="headlineSmall" style={[styles.profileName, { color: theme.colors.onBackground }]}>
          {tenant.name}
        </Text>
        {tenant.phoneNumber ? (
          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${tenant.phoneNumber}`)}
          >
            <MaterialCommunityIcons name="phone-outline" size={16} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginLeft: 6, textDecorationLine: 'underline' }}>
              {tenant.phoneNumber}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Occupancies */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Occupancies
        </Text>

        {occupancies.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: theme.colors.outlineVariant }]}>
            <MaterialCommunityIcons name="home-outline" size={32} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              No occupancies assigned
            </Text>
          </View>
        ) : (
          occupancies.map((occ) => {
            const data = occupancyData[occ.id];
            const rentIncrease = data?.rentIncrease ?? null;
            const payments = data?.payments ?? [];
            const isExpanded = expandedOcc === occ.id;

            return (
              <View
                key={occ.id}
                style={[styles.occCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
              >
                <View style={styles.occHeader}>
                  <View style={[styles.occIcon, { backgroundColor: Colors.primarySurface }]}>
                    <MaterialCommunityIcons name="home-floor-l" size={18} color={Colors.primary} />
                  </View>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600', flex: 1 }}>
                    {occ.isWholeProperty
                      ? 'Whole Property'
                      : `Floor ${occ.floorLabel ?? occ.floorId ?? '-'}`}
                  </Text>
                </View>

                <View style={[styles.detailGrid, { borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Rent</Text>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      Rs. {occ.rent.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.detailItem, { borderLeftWidth: 1, borderLeftColor: theme.colors.outlineVariant }]}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Deposit</Text>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      Rs. {occ.securityDeposit.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.detailItem, { borderLeftWidth: 1, borderLeftColor: theme.colors.outlineVariant }]}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Since</Text>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {occ.startDate.slice(0, 10)}
                    </Text>
                  </View>
                </View>

                {rentIncrease && (
                  <View style={[styles.increaseRow, { backgroundColor: Colors.warningLight }]}>
                    <MaterialCommunityIcons name="trending-up" size={14} color={Colors.warningDark} />
                    <Text variant="bodySmall" style={{ color: Colors.warningDark, flex: 1, marginLeft: 6 }}>
                      {rentIncrease.increasePercent}% increase on {rentIncrease.nextIncreaseDate.slice(0, 10)}
                    </Text>
                    <Button compact mode="text" onPress={() => openIncreaseModal(occ)} labelStyle={{ fontSize: 12 }}>
                      Edit
                    </Button>
                  </View>
                )}

                {/* Payment History */}
                <View style={styles.paymentSection}>
                  <Button
                    compact
                    mode="text"
                    icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                    onPress={() => setExpandedOcc(isExpanded ? null : occ.id)}
                    labelStyle={{ fontSize: 13 }}
                    contentStyle={{ flexDirection: 'row-reverse' }}
                  >
                    Payment History ({payments.length})
                  </Button>

                  {isExpanded && (() => {
                    const now = new Date();
                    const endForOcc = historyEndByOcc[occ.id] ?? { year: now.getFullYear(), month: now.getMonth() + 1 };
                    const historyMonths = getMonthsBack(endForOcc.year, endForOcc.month, 12);
                    const monthSet = new Set(historyMonths.map(({ year, month }) => `${year}-${month}`));
                    const filteredPayments = payments.filter((p) => monthSet.has(`${p.year}-${p.month}`));
                    const occStart = new Date(occ.startDate);
                    const earliest = { year: occStart.getFullYear(), month: occStart.getMonth() + 1 };
                    const selectableMonths: { year: number; month: number }[] = [];
                    let y = earliest.year, m = earliest.month;
                    while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
                      selectableMonths.push({ year: y, month: m });
                      m++; if (m > 12) { m = 1; y++; }
                    }
                    selectableMonths.reverse();
                    const menuVisible = menuVisibleByOcc[occ.id] ?? false;

                    return (
                      <View style={styles.paymentList}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>View up to:</Text>
                          <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisibleByOcc((p) => ({ ...p, [occ.id]: false }))}
                            anchor={
                              <Button
                                mode="outlined"
                                compact
                                onPress={() => setMenuVisibleByOcc((p) => ({ ...p, [occ.id]: true }))}
                                icon="calendar-month"
                                contentStyle={{ flexDirection: 'row-reverse' }}
                              >
                                {monthLabel(endForOcc.month, endForOcc.year)}
                              </Button>
                            }
                          >
                            <ScrollView style={{ maxHeight: 240 }}>
                              {selectableMonths.map(({ year, month }) => (
                                <Menu.Item
                                  key={`${year}-${month}`}
                                  onPress={() => {
                                    setHistoryEndByOcc((p) => ({ ...p, [occ.id]: { year, month } }));
                                    setMenuVisibleByOcc((p) => ({ ...p, [occ.id]: false }));
                                  }}
                                  title={monthLabel(month, year)}
                                />
                              ))}
                            </ScrollView>
                          </Menu>
                        </View>
                        {filteredPayments.length === 0 ? (
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic', padding: 8 }}>
                            No payment records in this range
                          </Text>
                        ) : (
                          <View style={{ width: '100%', alignSelf: 'stretch' }}>
                              <View style={[styles.paymentHeader, { borderColor: theme.colors.outlineVariant }]}>
                              <Text variant="labelSmall" style={[styles.payColPeriod, { color: theme.colors.onSurfaceVariant }]}>Period</Text>
                              <Text variant="labelSmall" style={[styles.payColPaid, { color: theme.colors.onSurfaceVariant }]}>Paid</Text>
                              <Text variant="labelSmall" style={[styles.payColDue, { color: theme.colors.onSurfaceVariant }]}>Due</Text>
                              <Text variant="labelSmall" style={[styles.payColCollected, { color: theme.colors.onSurfaceVariant }]}>Collected</Text>
                              <Text variant="labelSmall" style={[styles.payColStatus, { color: theme.colors.onSurfaceVariant }]}>Status</Text>
                            </View>
                            {(() => {
                              const sorted = [...filteredPayments].sort(
                                (a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month)
                              );
                              let accumulatedDues = 0;
                              return sorted.map((p) => {
                                const totalDue = occ.rent + accumulatedDues;
                                const shortfall = totalDue - p.amountPaid;
                                if (shortfall > 0) accumulatedDues = shortfall;
                                else accumulatedDues = 0;
                                return (
                                  <View key={p.id} style={[styles.paymentRow, { borderColor: theme.colors.outlineVariant }]}>
                                    <Text variant="bodySmall" style={[styles.payColPeriod, { color: theme.colors.onSurface }]}>
                                      {monthLabel(p.month, p.year)}
                                    </Text>
                                    <Text variant="bodySmall" style={[styles.payColPaid, { color: theme.colors.onSurface }]}>
                                      Rs. {p.amountPaid.toLocaleString()}
                                    </Text>
                                    <Text variant="bodySmall" style={[styles.payColDue, { color: theme.colors.onSurface }]}>
                                      Rs. {totalDue.toLocaleString()}
                                    </Text>
                                    <Text variant="bodySmall" style={[styles.payColCollected, { color: theme.colors.onSurface }]}>
                                      {formatCollectedAt(p.collectedAt)}
                                    </Text>
                                    <View style={[styles.payColStatus, styles.statusBadge, { backgroundColor: p.isPaid ? Colors.successLight : Colors.warningLight }]}>
                                      <View style={[styles.statusDot, { backgroundColor: p.isPaid ? Colors.success : Colors.warning }]} />
                                      <Text style={[styles.statusText, { color: p.isPaid ? Colors.successDark : Colors.warningDark }]}>
                                        {p.isPaid ? 'Paid' : 'Partial'}
                                      </Text>
                                    </View>
                                  </View>
                                );
                              });
                            })()}
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </View>
            );
          })
        )}
      </View>

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarLargeText: {
    fontSize: 32,
    fontFamily: FontFamily.display,
    color: '#FFFFFF',
  },
  profileName: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },

  // Occupancy Card
  occCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  occHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  occIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Detail Grid
  detailGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  detailItem: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },

  // Increase Row
  increaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.sm,
  },

  // Payment Section
  paymentSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  paymentList: {
    paddingHorizontal: Spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
  },
  payColPeriod: { width: 65, fontSize: 11 },
  payColPaid: { width: 70, fontSize: 11 },
  payColDue: { width: 55, fontSize: 11 },
  payColCollected: { width: 75, fontSize: 11 },
  payColStatus: { width: 55, fontSize: 11 },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
