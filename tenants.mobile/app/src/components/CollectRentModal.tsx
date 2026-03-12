import { useState } from 'react';
import { View, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dialog, TextInput, Button, Text, Checkbox, Menu } from 'react-native-paper';
import { monthLabel, computeDues } from '../utils/dateUtils';
import type { RentPayment } from '../types';

interface CollectRentModalProps {
  visible: boolean;
  mode?: 'single' | 'bulk';
  floorCount?: number;
  rent: number;
  dues: number;
  totalDue?: number;
  amount: number;
  selectedYear: number;
  selectedMonth: number;
  unpaidMonths: { year: number; month: number }[];
  payments: RentPayment[];
  startDate: string;
  collectedToday: boolean;
  collectedAt: string;
  onAmountChange: (amount: number) => void;
  onPeriodChange: (year: number, month: number) => void;
  onCollectedTodayChange: (value: boolean) => void;
  onCollectedAtChange: (value: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
  onSwitchToSingle?: () => void;
}

export default function CollectRentModal({
  visible,
  mode = 'single',
  floorCount,
  rent,
  dues,
  totalDue: totalDueProp,
  amount,
  selectedYear,
  selectedMonth,
  unpaidMonths,
  payments,
  startDate,
  onPeriodChange,
  collectedToday,
  collectedAt,
  onAmountChange,
  onCollectedTodayChange,
  onCollectedAtChange,
  onSubmit,
  onDismiss,
  onSwitchToSingle,
}: CollectRentModalProps) {
  const showPeriodPicker = dues > 0 && unpaidMonths.length > 0;
  const totalDue =
    totalDueProp != null
      ? totalDueProp
      : showPeriodPicker
        ? rent + computeDues(rent, payments, startDate, selectedYear, selectedMonth)
        : rent + dues;
  const isBulk = mode === 'bulk' && (floorCount ?? 0) > 1;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);

  const collectedAtDate = collectedAt
    ? new Date(collectedAt + 'T12:00:00')
    : new Date();

  const handleDateChange = (_: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      onCollectedAtChange(date.toISOString().slice(0, 10));
    }
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        Collect Rent — {monthLabel(selectedMonth, selectedYear)}
        {isBulk ? ` (All ${floorCount} floors)` : ''}
      </Dialog.Title>
      <Dialog.Content>
        {isBulk && onSwitchToSingle && (
          <Button
            mode="outlined"
            compact
            onPress={onSwitchToSingle}
            style={{ marginBottom: 12 }}
          >
            Collect for this floor only
          </Button>
        )}
        <Text variant="bodyMedium">
          {isBulk ? 'Total Monthly Rent' : 'Monthly Rent'}: Rs. {rent.toLocaleString()}
        </Text>
        {dues > 0 && (
          <>
            <Text variant="bodyMedium" style={{ color: '#d32f2f' }}>
              Previous Dues: Rs. {dues.toLocaleString()}
            </Text>
            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
              Total Due: Rs. {totalDue.toLocaleString()}
            </Text>
          </>
        )}
        {showPeriodPicker && (
          <View style={{ marginTop: 12 }}>
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: 4 }}>Period</Text>
            <Menu
              visible={periodMenuVisible}
              onDismiss={() => setPeriodMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  compact
                  icon="calendar-month"
                  onPress={() => setPeriodMenuVisible(true)}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                >
                  {monthLabel(selectedMonth, selectedYear)}
                </Button>
              }
            >
              <ScrollView style={{ maxHeight: 240 }}>
                {unpaidMonths.map(({ year, month }) => (
                  <Menu.Item
                    key={`${year}-${month}`}
                    onPress={() => {
                      onPeriodChange(year, month);
                      setPeriodMenuVisible(false);
                    }}
                    title={monthLabel(month, year)}
                  />
                ))}
              </ScrollView>
            </Menu>
          </View>
        )}
        <TextInput
          label="Amount Collected"
          value={amount ? String(amount) : ''}
          onChangeText={(t) => onAmountChange(parseFloat(t) || 0)}
          mode="outlined"
          keyboardType="decimal-pad"
          style={{ marginTop: 16 }}
        />
        {amount > 0 && amount < totalDue && (
          <Text variant="bodySmall" style={{ color: '#ed6c02', marginTop: 8 }}>
            Partial payment — Rs. {(totalDue - amount).toLocaleString()} will carry over.
          </Text>
        )}
        {amount >= totalDue && amount > 0 && (
          <Text variant="bodySmall" style={{ color: '#2e7d32', marginTop: 8 }}>
            Full payment — no outstanding dues.
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <Checkbox.Android
            status={collectedToday ? 'checked' : 'unchecked'}
            onPress={() => onCollectedTodayChange(!collectedToday)}
          />
          <Text variant="bodyMedium" onPress={() => onCollectedTodayChange(!collectedToday)} style={{ flex: 1 }}>
            Rent was collected today
          </Text>
        </View>

        {!collectedToday && (
          <View style={{ marginTop: 12 }}>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
              style={{ marginBottom: 8 }}
            >
              {collectedAt
                ? new Date(collectedAt + 'T12:00:00').toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Select collection date'}
            </Button>
            {showDatePicker && (
              <DateTimePicker
                value={collectedAtDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={onSubmit}>Collect</Button>
      </Dialog.Actions>
    </Dialog>
  );
}
