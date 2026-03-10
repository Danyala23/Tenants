import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import {
  Text,
  Button,
  FAB,
  Chip,
  IconButton,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { api } from "../../src/api";
import { useNotifications } from "../../src/context/NotificationContext";
import {
  computeDues,
  getUnpaidMonths,
  monthLabel,
} from "../../src/utils/dateUtils";
import { Colors, Spacing, Radius } from "../../src/theme";
import type {
  Property,
  Floor,
  Occupancy,
  Bill,
  RentPayment,
  RentIncreaseRule,
  UtilityConnection,
} from "../../src/types";
import FloorModal from "../../src/components/FloorModal";
import TenantModal from "../../src/components/TenantModal";
import CollectRentModal from "../../src/components/CollectRentModal";
import RentIncreaseModal from "../../src/components/RentIncreaseModal";
import UtilityModal from "../../src/components/UtilityModal";
import BillSnapshotModal from "../../src/components/BillSnapshotModal";
import { TenantCardWithHistory } from "../../src/components/TenantCardWithHistory";

type TabKey = "overview" | "tenants" | "bills" | "utilities";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "home-outline" },
  { key: "tenants", label: "Tenants", icon: "account-group-outline" },
  { key: "bills", label: "Bills", icon: "receipt" },
  { key: "utilities", label: "Utilities", icon: "flash-outline" },
];

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = parseInt(id ?? "0", 10);
  const router = useRouter();
  const navigation = useNavigation();
  const { toast, confirm } = useNotifications();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

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
  const [billMonth, setBillMonth] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [floorModal, setFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const [tenantModal, setTenantModal] = useState(false);
  const [editingOccupancy, setEditingOccupancy] = useState<Occupancy | null>(
    null,
  );
  const [preselectedFloorId, setPreselectedFloorId] = useState<
    number | undefined
  >();

  const [collectModal, setCollectModal] = useState<{
    occId: number;
    rent: number;
    dues: number;
    unpaidMonths: { year: number; month: number }[];
    startDate: string;
    payments: RentPayment[];
  } | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectYear, setCollectYear] = useState(currentYear);
  const [collectMonth, setCollectMonth] = useState(currentMonth);
  const [collectCollectedToday, setCollectCollectedToday] = useState(true);
  const [collectCollectedAt, setCollectCollectedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [increaseModal, setIncreaseModal] = useState(false);
  const [editingIncreaseOccId, setEditingIncreaseOccId] = useState<
    number | null
  >(null);
  const [increaseForm, setIncreaseForm] = useState({
    increasePercent: 10,
    nextIncreaseDate: "",
  });

  const [utilityModal, setUtilityModal] = useState(false);
  const [editingUtility, setEditingUtility] =
    useState<UtilityConnection | null>(null);

  const [billSnapshot, setBillSnapshot] = useState<{
    id: number;
    html: string;
  } | null>(null);

  const totalTenants = useMemo(
    () =>
      Object.values(occupanciesByFloor).reduce(
        (sum, occs) => sum + occs.length,
        0,
      ),
    [occupanciesByFloor],
  );

  const unpaidBillCount = useMemo(
    () => bills.filter((b) => !b.isPaid).length,
    [bills],
  );

  const rentPaidCount = useMemo(() => {
    let paid = 0;
    for (const occs of Object.values(occupanciesByFloor)) {
      for (const occ of occs) {
        const pmt = (paymentsByOccupancy[occ.id] ?? []).find(
          (p) => p.year === currentYear && p.month === currentMonth,
        );
        if (pmt?.isPaid) paid++;
      }
    }
    return paid;
  }, [occupanciesByFloor, paymentsByOccupancy]);

  useLayoutEffect(() => {
    if (property) {
      navigation.setOptions({
        title: property.houseNumber || property.address || "Property",
      });
    }
  }, [property, navigation]);

  const getPayment = useCallback(
    (occId: number, year: number, month: number) =>
      (paymentsByOccupancy[occId] ?? []).find(
        (p) => p.year === year && p.month === month,
      ),
    [paymentsByOccupancy],
  );

  const getDues = useCallback(
    (
      occId: number,
      rent: number,
      startDate: string,
      payments: RentPayment[],
    ) => {
      return computeDues(rent, payments, startDate, currentYear, currentMonth);
    },
    [],
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
        }),
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
        }),
      );
      setPaymentsByOccupancy(payments);
      setRentIncreaseByOccupancy(increases);

      const [billList, connList] = await Promise.all([
        api.bills.list(
          propertyId,
          billYear,
          billMonth === "" ? undefined : (billMonth as number),
        ),
        api.utilityConnections.listByProperty(propertyId).catch(() => []),
      ]);
      setBills(billList);
      setUtilityConnections(connList);
    } catch {
      toast({ message: "Failed to load property", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId, billYear, billMonth, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleCollect = async () => {
    if (!collectModal) return;
    const collectedAt = collectCollectedToday
      ? undefined
      : `${collectCollectedAt}T00:00:00.000Z`;
    try {
      await api.payments.collect(collectModal.occId, {
        year: collectYear,
        month: collectMonth,
        amountPaid: collectAmount,
        collectedAt,
      });
      setCollectModal(null);
      toast({ message: "Rent collected successfully", type: "success" });
      loadData();
    } catch {
      toast({ message: "Failed to collect rent", type: "error" });
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
      toast({ message: "Failed to save floor", type: "error" });
    }
  };

  const handleFloorDelete = async (floorId: number) => {
    const ok = await confirm({
      message: "Delete this floor and its tenants?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.floors.delete(floorId);
      loadData();
    } catch {
      toast({ message: "Failed to delete floor", type: "error" });
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
      toast({ message: "Failed to save tenant", type: "error" });
    }
  };

  const handleVacateOccupancy = async (occ: Occupancy) => {
    const ok = await confirm({
      message: `Vacate ${occ.tenantName} from this floor? The tenant and payment history will be preserved.`,
      confirmLabel: "Vacate",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.occupancies.vacate(occ.id);
      loadData();
      toast({
        message: "Tenant vacated. Floor is now available.",
        type: "success",
      });
    } catch {
      toast({ message: "Failed to vacate tenant", type: "error" });
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
      toast({ message: "Failed to save rent increase rule", type: "error" });
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
      toast({ message: "Saved", type: "success" });
    } catch {
      toast({ message: "Failed to save", type: "error" });
    }
  };

  const handleBillMarkPaid = async (billId: number) => {
    try {
      await api.bills.markPaid(billId);
      loadData();
    } catch {
      toast({ message: "Failed to update bill", type: "error" });
    }
  };

  const handleViewBill = async (billId: number) => {
    try {
      const html = await api.bills.getSnapshotHtml(billId);
      setBillSnapshot({ id: billId, html });
    } catch {
      toast({ message: "Failed to load bill", type: "error" });
    }
  };

  const handleScrapeNow = async () => {
    try {
      await api.bills.scrapeNow();
      toast({ message: "Scraping started", type: "success" });
      loadData();
    } catch {
      toast({ message: "Failed to start scraping", type: "error" });
    }
  };

  // ── Tab Content Renderers ────────────────────────────────────

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View
        style={[
          styles.propertyCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {property!.address ? (
          <View style={styles.propInfoRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
            >
              {property!.address}
            </Text>
          </View>
        ) : null}
        <View style={styles.propInfoRow}>
          <MaterialCommunityIcons
            name="ruler-square"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
          >
            {property!.size} Marlas
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          Floors
        </Text>
        <IconButton
          icon="plus"
          size={20}
          iconColor={theme.colors.primary}
          onPress={() => {
            setEditingFloor(null);
            setFloorModal(true);
          }}
        />
      </View>

      {floors.length === 0 ? (
        <View
          style={[
            styles.emptySection,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="layers-outline"
            size={32}
            color={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.5 }}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            No floors added yet
          </Text>
        </View>
      ) : (
        floors.map((f) => {
          const tenantCount = occupanciesByFloor[f.id]?.length ?? 0;
          return (
            <Pressable
              key={f.id}
              style={[
                styles.floorCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              onPress={() => setActiveTab("tenants")}
            >
              <View style={styles.floorCardLeft}>
                <View
                  style={[
                    styles.floorNumber,
                    { backgroundColor: Colors.primarySurface },
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={{ color: Colors.primary, fontWeight: "700" }}
                  >
                    {f.floorNumber}
                  </Text>
                </View>
                <View style={styles.floorInfo}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                  >
                    {f.label || `Floor ${f.floorNumber}`}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {tenantCount} {tenantCount === 1 ? "tenant" : "tenants"}
                  </Text>
                </View>
              </View>
              <View style={styles.floorActions}>
                <IconButton
                  icon="pencil-outline"
                  size={18}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => {
                    setEditingFloor(f);
                    setFloorModal(true);
                  }}
                />
                <IconButton
                  icon="delete-outline"
                  size={18}
                  iconColor={Colors.error}
                  onPress={() => handleFloorDelete(f.id)}
                />
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const renderTenants = () => (
    <View style={styles.tabContent}>
      {floors.length === 0 ? (
        <View
          style={[
            styles.emptySection,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={32}
            color={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.5 }}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            Add floors first to manage tenants
          </Text>
        </View>
      ) : (
        floors.map((f) => (
          <View key={f.id} style={styles.floorGroup}>
            <View style={styles.floorGroupHeader}>
              <View
                style={[
                  styles.floorBadge,
                  { backgroundColor: Colors.primarySurface },
                ]}
              >
                <MaterialCommunityIcons
                  name="layers"
                  size={14}
                  color={Colors.primary}
                />
                <Text
                  variant="labelMedium"
                  style={{
                    color: Colors.primary,
                    fontWeight: "600",
                    marginLeft: 4,
                  }}
                >
                  Floor {f.floorNumber} {f.label ? `· ${f.label}` : ""}
                </Text>
              </View>
              {(occupanciesByFloor[f.id] ?? []).length === 0 && (
                <IconButton
                  icon="account-plus-outline"
                  size={18}
                  iconColor={theme.colors.primary}
                  onPress={() => {
                    setEditingOccupancy(null);
                    setPreselectedFloorId(f.id);
                    setTenantModal(true);
                  }}
                />
              )}
            </View>

            {(occupanciesByFloor[f.id] ?? []).length === 0 ? (
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginLeft: 4,
                  marginBottom: 12,
                  fontStyle: "italic",
                }}
              >
                No tenants on this floor
              </Text>
            ) : (
              (occupanciesByFloor[f.id] ?? []).map((occ) => (
                <TenantCardWithHistory
                  key={occ.id}
                  occ={occ}
                  payments={paymentsByOccupancy[occ.id] ?? []}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  getPayment={getPayment}
                  getDues={getDues}
                  rentIncrease={rentIncreaseByOccupancy[occ.id]}
                  onCollect={() => {
                    const payments = paymentsByOccupancy[occ.id] ?? [];
                    const dues = getDues(
                      occ.id,
                      occ.rent,
                      occ.startDate,
                      payments,
                    );
                    const unpaidMonths = getUnpaidMonths(
                      occ.rent,
                      payments,
                      occ.startDate,
                      currentYear,
                      currentMonth,
                    );
                    const hasDues = dues > 0;
                    const periodYear =
                      hasDues && unpaidMonths.length > 0
                        ? unpaidMonths[0].year
                        : currentYear;
                    const periodMonth =
                      hasDues && unpaidMonths.length > 0
                        ? unpaidMonths[0].month
                        : currentMonth;
                    const totalForPeriod = hasDues
                      ? occ.rent +
                        computeDues(
                          occ.rent,
                          payments,
                          occ.startDate,
                          periodYear,
                          periodMonth,
                        )
                      : occ.rent + dues;
                    setCollectModal({
                      occId: occ.id,
                      rent: occ.rent,
                      dues,
                      unpaidMonths,
                      startDate: occ.startDate,
                      payments,
                    });
                    setCollectYear(periodYear);
                    setCollectMonth(periodMonth);
                    setCollectAmount(totalForPeriod);
                    setCollectCollectedToday(true);
                    setCollectCollectedAt(
                      new Date().toISOString().slice(0, 10),
                    );
                  }}
                  onIncrease={() => {
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
                  onEdit={() => {
                    setEditingOccupancy(occ);
                    setTenantModal(true);
                  }}
                  onVacate={() => handleVacateOccupancy(occ)}
                  onViewTenant={() =>
                    router.push(`/(app)/tenant/${occ.tenantId}`)
                  }
                />
              ))
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderBills = () => (
    <View style={styles.tabContent}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
      >
        <Chip
          selected={billMonth === ""}
          onPress={() => setBillMonth("")}
          style={styles.filterChip}
          textStyle={styles.filterChipText}
          showSelectedCheck={false}
          mode={billMonth === "" ? "flat" : "outlined"}
        >
          All
        </Chip>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
          <Chip
            key={m}
            selected={billMonth === m}
            onPress={() => setBillMonth(m)}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
            showSelectedCheck={false}
            mode={billMonth === m ? "flat" : "outlined"}
          >
            {monthLabel(m).slice(0, 3)}
          </Chip>
        ))}
      </ScrollView>

      <Button
        mode="outlined"
        icon="refresh"
        onPress={handleScrapeNow}
        style={styles.scrapeBtn}
        labelStyle={{ fontSize: 13 }}
      >
        Scrape Bills Now
      </Button>

      {bills.length === 0 ? (
        <View
          style={[
            styles.emptySection,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="receipt"
            size={32}
            color={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.5 }}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            No bills found
          </Text>
        </View>
      ) : (
        bills.map((b) => (
          <View
            key={b.id}
            style={[
              styles.billCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.billCardHeader}>
              <View style={styles.billInfo}>
                <View
                  style={[
                    styles.billIcon,
                    {
                      backgroundColor: b.type.toLowerCase().includes("electric")
                        ? "#FEF3C7"
                        : b.type.toLowerCase().includes("gas")
                          ? "#DBEAFE"
                          : b.type.toLowerCase().includes("water")
                            ? "#D1FAE5"
                            : Colors.primarySurface,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      b.type.toLowerCase().includes("electric")
                        ? "lightning-bolt"
                        : b.type.toLowerCase().includes("gas")
                          ? "fire"
                          : b.type.toLowerCase().includes("water")
                            ? "water"
                            : "file-document-outline"
                    }
                    size={18}
                    color={
                      b.type.toLowerCase().includes("electric")
                        ? "#92400E"
                        : b.type.toLowerCase().includes("gas")
                          ? "#1E40AF"
                          : b.type.toLowerCase().includes("water")
                            ? "#065F46"
                            : Colors.primary
                    }
                  />
                </View>
                <View>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                  >
                    {b.type}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {monthLabel(b.month, b.year)}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                >
                  Rs. {b.amount.toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: b.isPaid
                        ? Colors.successLight
                        : Colors.errorLight,
                      marginTop: 4,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: b.isPaid
                          ? Colors.success
                          : Colors.error,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: b.isPaid ? Colors.successDark : Colors.errorDark,
                      },
                    ]}
                  >
                    {b.isPaid ? "Paid" : "Unpaid"}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.billActions,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              {b.hasSnapshot && (
                <Button
                  compact
                  mode="text"
                  icon="eye-outline"
                  onPress={() => handleViewBill(b.id)}
                  labelStyle={{ fontSize: 12 }}
                >
                  View
                </Button>
              )}
              <Button
                compact
                mode="text"
                icon={
                  b.isPaid ? "close-circle-outline" : "check-circle-outline"
                }
                onPress={() => handleBillMarkPaid(b.id)}
                labelStyle={{ fontSize: 12 }}
                textColor={b.isPaid ? Colors.error : Colors.success}
              >
                {b.isPaid ? "Mark Unpaid" : "Mark Paid"}
              </Button>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderUtilities = () => (
    <View style={styles.tabContent}>
      {utilityConnections.length === 0 ? (
        <View
          style={[
            styles.emptySection,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <MaterialCommunityIcons
            name="flash-outline"
            size={32}
            color={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.5 }}
          />
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            No utility connections
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              setEditingUtility(null);
              setUtilityModal(true);
            }}
            style={{ marginTop: 16 }}
          >
            Add Connection
          </Button>
        </View>
      ) : (
        utilityConnections.map((uc) => (
          <View
            key={uc.id}
            style={[
              styles.utilityCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.utilityHeader}>
              <View
                style={[
                  styles.billIcon,
                  {
                    backgroundColor: uc.type.toLowerCase().includes("electric")
                      ? "#FEF3C7"
                      : uc.type.toLowerCase().includes("gas")
                        ? "#DBEAFE"
                        : uc.type.toLowerCase().includes("water")
                          ? "#D1FAE5"
                          : Colors.primarySurface,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    uc.type.toLowerCase().includes("electric")
                      ? "lightning-bolt"
                      : uc.type.toLowerCase().includes("gas")
                        ? "fire"
                        : uc.type.toLowerCase().includes("water")
                          ? "water"
                          : "flash-outline"
                  }
                  size={18}
                  color={
                    uc.type.toLowerCase().includes("electric")
                      ? "#92400E"
                      : uc.type.toLowerCase().includes("gas")
                        ? "#1E40AF"
                        : uc.type.toLowerCase().includes("water")
                          ? "#065F46"
                          : Colors.primary
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                >
                  {uc.type} {uc.providerName ? `· ${uc.providerName}` : ""}
                </Text>
                {(uc.referenceNumber || uc.consumerNumber) && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 2,
                    }}
                  >
                    {uc.referenceNumber || uc.consumerNumber}
                  </Text>
                )}
              </View>
              <View style={styles.utilityActions}>
                <IconButton
                  icon="pencil-outline"
                  size={18}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => {
                    setEditingUtility(uc);
                    setUtilityModal(true);
                  }}
                />
                <IconButton
                  icon="delete-outline"
                  size={18}
                  iconColor={Colors.error}
                  onPress={async () => {
                    const ok = await confirm({
                      message: "Delete this utility connection?",
                      confirmLabel: "Delete",
                      variant: "danger",
                    });
                    if (ok) {
                      await api.utilityConnections.delete(uc.id);
                      loadData();
                    }
                  }}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  // ── Main Render ──────────────────────────────────────────────

  if (loading || !property) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Stats Banner */}
      <View
        style={[
          styles.statsBanner,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="layers-outline"
            size={18}
            color={Colors.primary}
          />
          <Text
            variant="titleSmall"
            style={[styles.statValue, { color: theme.colors.onSurface }]}
          >
            {floors.length}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
          >
            Floors
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={18}
            color={Colors.secondary}
          />
          <Text
            variant="titleSmall"
            style={[styles.statValue, { color: theme.colors.onSurface }]}
          >
            {totalTenants}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
          >
            Tenants
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="cash-check"
            size={18}
            color={
              rentPaidCount === totalTenants && totalTenants > 0
                ? Colors.success
                : theme.colors.primary
            }
          />
          <Text
            variant="titleSmall"
            style={[
              styles.statValue,
              {
                color:
                  rentPaidCount === totalTenants && totalTenants > 0
                    ? Colors.success
                    : theme.colors.onSurface,
              },
            ]}
          >
            {rentPaidCount}/{totalTenants}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
          >
            Rent
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={unpaidBillCount > 0 ? Colors.error : Colors.success}
          />
          <Text
            variant="titleSmall"
            style={[
              styles.statValue,
              {
                color:
                  unpaidBillCount > 0 ? Colors.error : theme.colors.onSurface,
              },
            ]}
          >
            {unpaidBillCount}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
          >
            Unpaid
          </Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabItem,
                isActive && [
                  styles.activeTabItem,
                  { backgroundColor: Colors.primarySurface },
                ],
              ]}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={
                  isActive ? Colors.primary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                variant="labelMedium"
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? Colors.primary
                      : theme.colors.onSurfaceVariant,
                  },
                  isActive && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      <ScrollView
        key={activeTab}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "tenants" && renderTenants()}
        {activeTab === "bills" && renderBills()}
        {activeTab === "utilities" && renderUtilities()}
      </ScrollView>

      {/* Contextual FAB */}
      {activeTab === "overview" && (
        <FAB
          icon="plus"
          label="Floor"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="#FFFFFF"
          onPress={() => {
            setEditingFloor(null);
            setFloorModal(true);
          }}
        />
      )}
      {activeTab === "tenants" &&
        floors.some((f) => (occupanciesByFloor[f.id] ?? []).length === 0) && (
          <FAB
            icon="account-plus"
            label="Tenant"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            color="#FFFFFF"
            onPress={() => {
              setEditingOccupancy(null);
              setPreselectedFloorId(undefined);
              setTenantModal(true);
            }}
          />
        )}
      {activeTab === "utilities" && (
        <FAB
          icon="plus"
          label="Connection"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="#FFFFFF"
          onPress={() => {
            setEditingUtility(null);
            setUtilityModal(true);
          }}
        />
      )}

      {/* Modals */}
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
        floors={
          editingOccupancy
            ? floors
            : floors.filter(
                (f) => (occupanciesByFloor[f.id] ?? []).length === 0,
              )
        }
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
          selectedYear={collectYear}
          selectedMonth={collectMonth}
          unpaidMonths={collectModal.unpaidMonths}
          payments={collectModal.payments}
          startDate={collectModal.startDate}
          collectedToday={collectCollectedToday}
          collectedAt={collectCollectedAt}
          onAmountChange={setCollectAmount}
          onPeriodChange={(y, m) => {
            setCollectYear(y);
            setCollectMonth(m);
            const total =
              collectModal.rent +
              computeDues(
                collectModal.rent,
                collectModal.payments,
                collectModal.startDate,
                y,
                m,
              );
            setCollectAmount(total);
          }}
          onCollectedTodayChange={setCollectCollectedToday}
          onCollectedAtChange={setCollectCollectedAt}
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 80 },

  // Stats Banner
  statsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontWeight: "700",
    fontSize: 18,
  },
  statDivider: {
    width: 1,
    height: 36,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    gap: 4,
  },
  activeTabItem: {
    borderRadius: Radius.sm,
  },
  tabLabel: {
    fontSize: 12,
  },
  activeTabLabel: {
    fontWeight: "600",
  },

  // Tab Content
  tabContent: {
    padding: Spacing.lg,
  },

  // Property Card
  propertyCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  propInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: "600",
  },

  // Empty Section
  emptySection: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  // Floor Card
  floorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  floorCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  floorNumber: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  floorInfo: {
    flex: 1,
  },
  floorActions: {
    flexDirection: "row",
  },

  // Floor Group (Tenants tab)
  floorGroup: {
    marginBottom: Spacing.lg,
  },
  floorGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  floorBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },

  // Tenant Card
  tenantCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  tenantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  tenantInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  rentSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  rentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  tenantActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionBtn: {
    borderRadius: Radius.sm,
  },
  actionBtnLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  increaseNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },

  // Bills
  filterBar: {
    marginBottom: Spacing.md,
    flexGrow: 0,
  },
  filterChip: {
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
  },
  scrapeBtn: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.sm,
  },
  billCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  billCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
  },
  billInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  billIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  billActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },

  // Utilities
  utilityCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  utilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  utilityActions: {
    flexDirection: "row",
  },

  // FAB
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    borderRadius: Radius.lg,
  },
});
