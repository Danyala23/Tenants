import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, TextInput, Button, SegmentedButtons, Text } from 'react-native-paper';
import type { Floor, UtilityConnection } from '../types';

interface UtilityForm {
  floorId: number | null;
  type: string;
  referenceNumber: string;
  consumerNumber: string;
  providerName: string;
}

interface UtilityModalProps {
  visible: boolean;
  editingUtility: UtilityConnection | null;
  floors: Floor[];
  onDismiss: () => void;
  onSave: (data: {
    floorId: number | null;
    type: string;
    referenceNumber: string | null;
    consumerNumber: string | null;
    providerName: string | null;
  }) => void;
}

export default function UtilityModal({
  visible,
  editingUtility,
  floors,
  onDismiss,
  onSave,
}: UtilityModalProps) {
  const [floorId, setFloorId] = useState<number | null>(null);
  const [type, setType] = useState('Electricity');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [providerName, setProviderName] = useState('');

  useEffect(() => {
    if (visible) {
      setFloorId(editingUtility?.floorId ?? null);
      setType(editingUtility?.type ?? 'Electricity');
      setReferenceNumber(editingUtility?.referenceNumber ?? '');
      setConsumerNumber(editingUtility?.consumerNumber ?? '');
      setProviderName(editingUtility?.providerName ?? '');
    }
  }, [visible, editingUtility]);

  const handleSave = () => {
    onSave({
      floorId,
      type,
      referenceNumber: referenceNumber.trim() || null,
      consumerNumber: consumerNumber.trim() || null,
      providerName: providerName.trim() || null,
    });
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>
        {editingUtility ? 'Edit' : 'Add'} Utility Connection
      </Dialog.Title>
      <Dialog.Content>
        {editingUtility ? (
          <View style={styles.typeReadOnly}>
            <Text variant="bodyLarge" style={styles.typeLabel}>Type</Text>
            <Text variant="titleMedium">{editingUtility.type}</Text>
            <Text variant="bodySmall" style={styles.typeHint}>
              Type cannot be changed when editing
            </Text>
          </View>
        ) : (
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              { value: 'Electricity', label: 'Electricity' },
              { value: 'Gas', label: 'Gas' },
            ]}
            style={styles.segmented}
          />
        )}
        <View style={styles.pickerRow}>
          {floors.map((f) => (
            <Button
              key={f.id}
              mode={floorId === f.id ? 'contained' : 'outlined'}
              compact
              onPress={() => setFloorId(floorId === f.id ? null : f.id)}
              style={styles.pickerBtn}
            >
              {f.floorNumber} {f.label || ''}
            </Button>
          ))}
          <Button
            mode={floorId === null ? 'contained' : 'outlined'}
            compact
            onPress={() => setFloorId(null)}
            style={styles.pickerBtn}
          >
            Whole property
          </Button>
        </View>
        {type === 'Electricity' && (
          <TextInput
            label="Reference Number (14-digit)"
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            placeholder="e.g. 12112181887022"
            mode="outlined"
            style={styles.input}
          />
        )}
        {type === 'Gas' && (
          <TextInput
            label="Consumer Number (11-digit)"
            value={consumerNumber}
            onChangeText={setConsumerNumber}
            placeholder="e.g. 53467826375"
            mode="outlined"
            style={styles.input}
          />
        )}
        <TextInput
          label="Provider Name"
          value={providerName}
          onChangeText={setProviderName}
          placeholder="e.g. LESCO, SNGPL"
          mode="outlined"
          style={styles.input}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={handleSave}>{editingUtility ? 'Save' : 'Add'}</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  segmented: { marginBottom: 12 },
  typeReadOnly: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  typeLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  typeHint: {
    opacity: 0.6,
    marginTop: 4,
  },
  input: { marginBottom: 12 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  pickerBtn: { marginRight: 8, marginBottom: 8 },
});
