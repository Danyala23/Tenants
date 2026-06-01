import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { Text, Button, IconButton, Menu, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { monthLabel } from "../utils/dateUtils";
import { Colors, Spacing, Radius } from "../theme";
import type { Occupancy, RentPayment, RentIncreaseRule } from "../types";

function getMonthsBack(
  endYear: number,
  endMonth: number,
  count: number,
): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  let y = endYear;
  let m = endMonth;
  for (let i = 0; i < count; i++) {
    result.unshift({ year: y, month: m });
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
  }
  return result;
}

function formatCollectedAt(collectedAt: string | null | undefined): string {
  if (!collectedAt) return "—";
  try {
    return new Date(collectedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

interface TenantCardWithHistoryProps {
  occ: Occupancy;
  payments: RentPayment[];
  currentYear: number;
  currentMonth: number;
  getPayment: (
    occId: number,
    year: number,
    month: number,
  ) => RentPayment | undefined;
  getDues: (
    occId: number,
    rent: number,
    startDate: string,
    payments: RentPayment[],
  ) => number;
  rentIncrease: RentIncreaseRule | null;
  onCollect: () => void;
  onIncrease: () => void;
  onEdit: () => void;
  onVacate: () => void;
  onViewTenant?: () => void;
}

export function TenantCardWithHistory({
  occ,
  payments,
  currentYear,
  currentMonth,
  getPayment,
  getDues,
  rentIncrease,
  onCollect,
  onIncrease,
  onEdit,
  onVacate,
  onViewTenant,
}: TenantCardWithHistoryProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [historyEndYear, setHistoryEndYear] = useState(currentYear);
  const [historyEndMonth, setHistoryEndMonth] = useState(currentMonth);
  const [menuVisible, setMenuVisible] = useState(false);

  const pmt = getPayment(occ.id, currentYear, currentMonth);
  const dues = getDues(occ.id, occ.rent, occ.startDate, payments);
  const isPaid = pmt?.isPaid ?? false;

  const earliestDate = useMemo(() => {
    const start = new Date(occ.startDate);
    return { year: start.getFullYear(), month: start.getMonth() + 1 };
  }, [occ.startDate]);

  const historyMonths = useMemo(
    () => getMonthsBack(historyEndYear, historyEndMonth, 12),
    [historyEndYear, historyEndMonth],
  );

  const filteredPayments = useMemo(() => {
    const monthSet = new Set(
      historyMonths.map(({ year, month }) => `${year}-${month}`),
    );
    return payments.filter((p) => monthSet.has(`${p.year}-${p.month}`));
  }, [payments, historyMonths]);

  const selectableMonths = useMemo(() => {
    const months: { year: number; month: number }[] = [];
    let y = earliestDate.year;
    let m = earliestDate.month;
    const now = new Date();
    const endY = now.getFullYear();
    const endM = now.getMonth() + 1;
    while (y < endY || (y === endY && m <= endM)) {
      months.push({ year: y, month: m });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return months.reverse();
  }, [earliestDate]);

  return (
    <View
      style={[
        styles.tenantCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.tenantHeader}>
        <View
          style={[styles.avatar, { backgroundColor: Colors.primarySurface }]}
        >
          <Text style={[styles.avatarText, { color: Colors.primary }]}>
            {occ.tenantName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.tenantInfo}>
          <Pressable onPress={onViewTenant}>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.primary, fontWeight: "600" }}
            >
              {occ.tenantName}
            </Text>
          </Pressable>
          {occ.tenantPhone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${occ.tenantPhone}`)}
              style={{ marginTop: 2 }}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.primary,
                  textDecorationLine: "underline",
                }}
              >
                {occ.tenantPhone}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPaid ? Colors.successLight : Colors.errorLight,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isPaid ? Colors.success : Colors.error },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isPaid ? Colors.successDark : Colors.errorDark },
            ]}
          >
            {isPaid ? "Paid" : "Unpaid"}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.rentSection,
          { borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.rentRow}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Monthly Rent
          </Text>
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
          >
            Rs. {occ.rent.toLocaleString()}
          </Text>
        </View>
        {dues > 0 && (
          <View style={styles.rentRow}>
            <Text variant="bodySmall" style={{ color: Colors.error }}>
              Previous Dues
            </Text>
            <Text
              variant="titleSmall"
              style={{ color: Colors.error, fontWeight: "600" }}
            >
              Rs. {dues.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tenantActions}>
        {!isPaid && (
          <Button
            mode="contained"
            compact
            style={styles.actionBtn}
            labelStyle={styles.actionBtnLabel}
            onPress={onCollect}
          >
            Collect
          </Button>
        )}
        <Button
          mode="outlined"
          compact
          style={styles.actionBtn}
          labelStyle={styles.actionBtnLabel}
          onPress={onIncrease}
        >
          Increase
        </Button>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="pencil-outline"
          size={18}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onEdit}
        />
        <IconButton
          icon="exit-to-app"
          size={18}
          iconColor={Colors.error}
          onPress={onVacate}
        />
      </View>

      {rentIncrease && (
        <View
          style={[
            styles.increaseNote,
            { backgroundColor: Colors.warningLight },
          ]}
        >
          <MaterialCommunityIcons
            name="trending-up"
            size={14}
            color={Colors.warningDark}
          />
          <Text
            variant="bodySmall"
            style={{ color: Colors.warningDark, marginLeft: 6, flex: 1 }}
          >
            {rentIncrease.increasePercent}% increase on{" "}
            {rentIncrease.nextIncreaseDate?.slice(0, 10)}
          </Text>
        </View>
      )}

      <View style={styles.historySection}>
        <Button
          compact
          mode="text"
          icon={expanded ? "chevron-up" : "chevron-down"}
          onPress={() => setExpanded(!expanded)}
          labelStyle={{ fontSize: 13 }}
          contentStyle={{ flexDirection: "row-reverse" }}
        >
          {expanded ? "Hide" : "Show"} Rent History
        </Button>

        {expanded && (
          <View style={styles.historyContent}>
            <View style={styles.pickerRow}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}
              >
                View up to:
              </Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setMenuVisible(true)}
                    icon="calendar-month"
                    contentStyle={{ flexDirection: "row-reverse" }}
                  >
                    {monthLabel(historyEndMonth, historyEndYear)}
                  </Button>
                }
              >
                <ScrollView style={{ maxHeight: 240 }}>
                  {selectableMonths.map(({ year, month }) => (
                    <Menu.Item
                      key={`${year}-${month}`}
                      onPress={() => {
                        setHistoryEndYear(year);
                        setHistoryEndMonth(month);
                        setMenuVisible(false);
                      }}
                      title={monthLabel(month, year)}
                    />
                  ))}
                </ScrollView>
              </Menu>
            </View>

            {filteredPayments.length === 0 ? (
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: "italic",
                  padding: 8,
                }}
              >
                No payment records in this range
              </Text>
            ) : (
              <View style={styles.tableScroll}>
                <View style={styles.table}>
                  <View
                    style={[
                      styles.tableHeader,
                      { borderColor: theme.colors.outlineVariant },
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.colPeriod,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Period
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.colPaid,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Paid
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.colDue,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Due
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.colCollected,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Collected
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={[
                        styles.colStatus,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Status
                    </Text>
                  </View>
                  {(() => {
                    const sorted = [...filteredPayments].sort((a, b) =>
                      a.year !== b.year ? a.year - b.year : a.month - b.month,
                    );
                    let accumulatedDues = 0;
                    return sorted.map((p) => {
                      const totalDue = occ.rent + accumulatedDues;
                      const shortfall = totalDue - p.amountPaid;
                      if (shortfall > 0) accumulatedDues = shortfall;
                      else accumulatedDues = 0;
                      return (
                        <View
                          key={p.id || `stub-${p.year}-${p.month}`}
                          style={[
                            styles.tableRow,
                            { borderColor: theme.colors.outlineVariant },
                          ]}
                        >
                          <Text
                            variant="bodySmall"
                            style={[
                              styles.colPeriod,
                              { color: theme.colors.onSurface },
                            ]}
                            numberOfLines={1}
                          >
                            {monthLabel(p.month, p.year)}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[
                              styles.colPaid,
                              { color: theme.colors.onSurface },
                            ]}
                            numberOfLines={1}
                          >
                            Rs. {p.amountPaid.toLocaleString()}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[
                              styles.colDue,
                              { color: theme.colors.onSurface },
                            ]}
                            numberOfLines={1}
                          >
                            Rs. {totalDue.toLocaleString()}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={[
                              styles.colCollected,
                              { color: theme.colors.onSurface },
                            ]}
                            numberOfLines={1}
                          >
                            {formatCollectedAt(p.collectedAt)}
                          </Text>
                          <View
                            style={[
                              styles.colStatus,
                              styles.statusBadge,
                              {
                                backgroundColor: p.isPaid
                                  ? Colors.successLight
                                  : Colors.warningLight,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: p.isPaid
                                    ? Colors.success
                                    : Colors.warning,
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color: p.isPaid
                                    ? Colors.successDark
                                    : Colors.warningDark,
                                },
                              ]}
                            >
                              {p.isPaid ? "Paid" : "Partial"}
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  historySection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  historyContent: {
    marginTop: Spacing.sm,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  tableScroll: {
    marginHorizontal: -Spacing.sm,
    width: "100%",
    alignSelf: "stretch",
  },
  table: {
    width: "100%",
    alignSelf: "stretch",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
  },
  colPeriod: { width: 72, fontSize: 12 },
  colPaid: { width: 88, fontSize: 12 },
  colDue: { width: 88, fontSize: 12 },
  colCollected: { width: 95, fontSize: 12 },
  colStatus: { width: 60, fontSize: 12 },
});
