import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dialog, TextInput, Button, Checkbox } from 'react-native-paper';
import type { Floor, Occupancy } from '../types';

interface OccupancyForm {
  name: string;
  phoneNumber: string;
  rent: number;
  securityDeposit: number;
  startDate: string;
  floorIds: number[];
}

interface TenantModalProps {
  visible: boolean;
  editingOccupancy: Occupancy | null;
  floors: Floor[];
  preselectedFloorId?: number;
  onDismiss: () => void;
  onSave: (form: OccupancyForm) => void;
}

export default function TenantModal({
  visible,
  editingOccupancy,
  floors,
  preselectedFloorId,
  onDismiss,
  onSave,
}: TenantModalProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rent, setRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [floorIds, setFloorIds] = useState<number[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!visible) setShowDatePicker(false);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (editingOccupancy) {
        setName(editingOccupancy.tenantName);
        setPhoneNumber(editingOccupancy.tenantPhone);
        setRent(String(editingOccupancy.rent));
        setSecurityDeposit(String(editingOccupancy.securityDeposit));
        setStartDate(editingOccupancy.startDate.slice(0, 10));
        setFloorIds(
          editingOccupancy.floorId != null ? [editingOccupancy.floorId] : []
        );
      } else {
        setName('');
        setPhoneNumber('');
        setRent('');
        setSecurityDeposit('');
        setStartDate(new Date().toISOString().slice(0, 10));
        setFloorIds(
          preselectedFloorId != null
            ? [preselectedFloorId]
            : floors.length > 0
              ? [floors[0].id]
              : []
        );
      }
    }
  }, [visible, editingOccupancy, floors, preselectedFloorId]);

  const toggleFloor = (floorId: number) => {
    if (editingOccupancy) {
      setFloorIds([floorId]);
    } else {
      setFloorIds((prev) =>
        prev.includes(floorId)
          ? prev.filter((id) => id !== floorId)
          : [...prev, floorId]
      );
    }
  };

  const startDateValue = startDate
    ? new Date(startDate + 'T12:00:00')
    : new Date();

  const handleDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setStartDate(date.toISOString().slice(0, 10));
  };

  const handleSave = () => {
    if (floorIds.length === 0) return;
    onSave({
      name,
      phoneNumber,
      rent: parseFloat(rent) || 0,
      securityDeposit: parseFloat(securityDeposit) || 0,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      floorIds,
    });
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        {editingOccupancy ? 'Edit Occupancy' : 'Add Tenant'}
      </Dialog.Title>
      <Dialog.ScrollArea>
        <ScrollView>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              disabled={!!editingOccupancy?.tenantId}
            />
            <TextInput
              label="Phone"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              disabled={!!editingOccupancy?.tenantId}
            />
            <View style={styles.floorSection}>
              {floors.map((f) => (
                <Checkbox.Item
                  key={f.id}
                  label={`Floor ${f.floorNumber} ${f.label ? `(${f.label})` : ''}`}
                  status={floorIds.includes(f.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleFloor(f.id)}
                />
              ))}
            </View>
            <TextInput
              label="Rent"
              value={rent}
              onChangeText={setRent}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              label="Security Deposit"
              value={securityDeposit}
              onChangeText={setSecurityDeposit}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.input}>
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
                contentStyle={{ justifyContent: 'flex-start' }}
              >
                {startDate
                  ? new Date(startDate + 'T12:00:00').toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Select start date'}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={startDateValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
            </View>
          </Dialog.Content>
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={handleSave}>{editingOccupancy ? 'Save' : 'Add'}</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12 },
  floorSection: { marginBottom: 12 },
});
